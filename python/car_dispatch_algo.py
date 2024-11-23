from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import numpy as np
from typing import List, Tuple
from pydantic import BaseModel
from scenario_model import Scenario
from pathlib import Path


class Customer(BaseModel):
    id: int
    pickup: Tuple[float, float]  # (x, y) coordinates
    dropoff: Tuple[float, float]  # (x, y) coordinates


class Car(BaseModel):
    id: int
    position: Tuple[float, float]  # (x, y) coordinates


def calculate_distance(
    point1: Tuple[float, float], point2: Tuple[float, float]
) -> float:
    """Calculate Euclidean distance between two points."""
    return np.sqrt((point1[0] - point2[0]) ** 2 + (point1[1] - point2[1]) ** 2)


def create_data_model(cars: List[Car], customers: List[Customer]):
    """Creates the data model for the OR-Tools solver."""
    data = {}

    # Create an array of all locations in this order:
    # [car_positions, customer_pickups]
    locations = []

    # Add car positions
    for car in cars:
        locations.append(car.position)

    # Add customer pickup locations
    for customer in customers:
        locations.append(customer.pickup)

    # Calculate distance matrix
    num_locations = len(locations)
    distances = np.zeros((num_locations, num_locations))

    for i in range(num_locations):
        for j in range(num_locations):
            if i != j:
                # For each location pair, we need to consider if this is a customer pickup
                # If it is, we need to add the distance to their dropoff location
                source = locations[i]
                dest = locations[j]

                # Base distance between points
                base_distance = calculate_distance(source, dest)

                # If destination is a customer pickup (not a car starting position)
                if j >= len(cars):
                    # Add distance from pickup to dropoff
                    customer_idx = j - len(cars)
                    dropoff_distance = calculate_distance(
                        customers[customer_idx].pickup, customers[customer_idx].dropoff
                    )
                    distances[i][j] = base_distance + dropoff_distance
                else:
                    distances[i][j] = base_distance

    data["distance_matrix"] = distances
    data["num_vehicles"] = len(cars)
    data["depot"] = 0  # Start depot index
    data["num_locations"] = num_locations

    return data


def solve_taxi_dispatch(cars: List[Car], customers: List[Customer]):
    """
    Solve the taxi dispatch problem.

    Args:
        cars: List of Car objects with their starting positions
        customers: List of Customer objects with pickup and dropoff locations

    Returns:
        List of routes for each car, where each route is a list of customer IDs
    """
    # Create the data model
    data = create_data_model(cars, customers)

    # Create Routing Model
    manager = pywrapcp.RoutingIndexManager(
        data["num_locations"], data["num_vehicles"], data["depot"]
    )
    routing = pywrapcp.RoutingModel(manager)

    # Define cost of each arc
    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return int(
            data["distance_matrix"][from_node][to_node] * 1000
        )  # Convert to integers for OR-Tools

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # Add Distance constraint
    dimension_name = "Distance"
    routing.AddDimension(
        transit_callback_index,
        0,  # no slack
        1000000,  # vehicle maximum travel distance
        True,  # start cumul to zero
        dimension_name,
    )
    distance_dimension = routing.GetDimensionOrDie(dimension_name)
    distance_dimension.SetGlobalSpanCostCoefficient(100)

    # Setting first solution heuristic
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.TABU_SEARCH
    )
    search_parameters.time_limit.FromSeconds(10)

    # Solve the problem
    solution = routing.SolveWithParameters(search_parameters)

    if solution:
        # Extract routes
        routes = []
        for vehicle_id in range(data["num_vehicles"]):
            index = routing.Start(vehicle_id)
            route = []
            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                # Only add to route if it's a customer (not a car starting position)
                if node_index >= len(cars):
                    customer_idx = node_index - len(cars)
                    route.append(customers[customer_idx].id)
                index = solution.Value(routing.NextVar(index))
            routes.append(route)
        return routes
    return None


def print_solution(routes: List[List[int]], cars: List[Car], customers: List[Customer]):
    """Print the solution in a readable format."""
    total_distance = 0

    for car_idx, route in enumerate(routes):
        if not route:
            print(f"Car {cars[car_idx].id}: No customers assigned")
            continue

        print(f"\nCar {cars[car_idx].id} route:")
        current_pos = cars[car_idx].position

        for customer_id in route:
            # Find customer object
            customer = next(c for c in customers if c.id == customer_id)

            # Calculate distances
            to_pickup = calculate_distance(current_pos, customer.pickup)
            pickup_to_dropoff = calculate_distance(customer.pickup, customer.dropoff)

            print(f"  → Customer {customer_id}:")
            print(f"    Drive to pickup: {to_pickup:.2f} units")
            print(f"    Drive to dropoff: {pickup_to_dropoff:.2f} units")

            total_distance += to_pickup + pickup_to_dropoff
            current_pos = customer.dropoff

    print(f"\nTotal distance: {total_distance:.2f} units")


# Example usage
def create_routing(scenario: Scenario):
    # Create 5 cars with random starting positions

    cars = [
        Car(id=idx + 1, position=(v.coordX, v.coordY))
        for idx, v in enumerate(scenario.vehicles)
    ]
    customers = [
        Customer(
            id=str(i + 1),
            pickup=(c.coordX, c.coordY),
            dropoff=(c.destinationX, c.destinationY),
        )
        for i, c in enumerate(scenario.customers)
    ]
    print(cars)
    print(customers)

    # Solve the problem
    routes = solve_taxi_dispatch(cars, customers)

    if routes:
        print("Solution found!")
        print_solution(routes, cars, customers)
    else:
        print("No solution found!")
    return routes


if __name__ == "__main__":
    scenario = Scenario.parse_file((Path(__file__).parent / "example.json"))
    create_routing(scenario)
