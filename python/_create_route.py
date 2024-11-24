from pathlib import Path
from scenario_model import Scenario
from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2
from _create_pairs import process_customers
from _penalties import (
    add_max_overall_capacity_per_vehicle,
    add_pickup_delivery_constraints,
    minimize_largest_end_time,
    set_penalty_for_waiting_at_start,
    create_time_dimension,
    minimize_total_travel_time,
)
import math
from absl import logging

logging.set_verbosity(logging.INFO)


def get_list_of_customer_ids_from_nodes(
    car_routes: dict[int, list[int]],
    locations: list[tuple[float, float]],
    scenario: Scenario,
) -> dict[int, list[str]]:
    """Convert car_routes from indices to unique customer IDs."""

    # Step 1: Remove the first and last elements of each route
    car_routes = {
        car: route[1:-1] if len(route) > 2 else [] for car, route in car_routes.items()
    }

    # Step 2: Create a customer lookup for (coordX, coordY) -> customer ID
    customer_lookup = {
        (customer.coordX, customer.coordY): customer.id
        for customer in scenario.customers
    }

    # Step 3: Replace indices with customer IDs
    updated_car_routes = {
        car: [
            customer_lookup.get(locations[i])
            for i in indices
            if customer_lookup.get(locations[i]) is not None
        ]
        for car, indices in car_routes.items()
    }

    # Step 4: Remove duplicates while maintaining order
    unique_car_routes = {
        car: [item for i, item in enumerate(route) if item not in route[:i]]
        for car, route in updated_car_routes.items()
    }

    return unique_car_routes


def get_routing_solution(
    scenario: Scenario, solve_for_shortest_path: bool = False
) -> tuple[dict[int, list[int]], int]:
    locations, precedence_pairs = process_customers(scenario)

    num_cars = len(scenario.vehicles)

    vehicle_start_indeces = []
    for vehicle in scenario.vehicles:
        start_car_coords = (vehicle.coordX, vehicle.coordY)
        locations.append(start_car_coords)
        vehicle_start_indeces.append(len(locations) - 1)

    vehicle_end_indeces = []
    for vehicle in scenario.vehicles:
        end_car_coords = (vehicle.coordX, vehicle.coordY)
        locations.append(end_car_coords)
        vehicle_end_indeces.append(len(locations) - 1)

    # locations.append((0, 0))
    # dummy_end = len(locations) - 1
    # len(locations), num_cars, vehicle_indices, [dummy_end] * num_cars
    manager = pywrapcp.RoutingIndexManager(
        len(locations), num_cars, vehicle_start_indeces, vehicle_end_indeces
    )
    routing = pywrapcp.RoutingModel(manager)

    create_time_dimension(routing, manager, locations)

    pickup_indices = []
    delivery_indices = []

    for customer_index in range(len(scenario.customers)):
        pickup_indices.append(2 * customer_index)
        delivery_indices.append(2 * customer_index + 1)

    add_pickup_delivery_constraints(routing, zip(pickup_indices, delivery_indices))

    print(len(scenario.customers))

    number_of_customers_per_car = math.ceil(len(scenario.customers) / num_cars * 2.1)
    print(number_of_customers_per_car)
    add_max_overall_capacity_per_vehicle(
        routing, [number_of_customers_per_car] * num_cars
    )
    minimize_total_travel_time(routing, manager, locations)
    # if solve_for_shortest_path:
    #     minimize_total_travel_time(routing, manager, locations)
    # else:
    #     minimize_largest_end_time(routing)
    set_penalty_for_waiting_at_start(routing)

    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = 12
    search_parameters.log_search = False
    solution = routing.SolveWithParameters(search_parameters)

    # Display the solution
    if solution:
        car_routes = {}
        total_time = 0
        time_dimension = routing.GetDimensionOrDie("Time")

        for vehicle_id in range(num_cars):
            index = routing.Start(vehicle_id)
            route_text = [f"Route for vehicle {vehicle_id}:"]
            route = []
            route_time = 0

            while not routing.IsEnd(index):
                node_index = manager.IndexToNode(index)
                route.append(node_index)
                time_var = time_dimension.CumulVar(index)
                route_text.append(f"Node {node_index} Time({solution.Min(time_var)})")
                next_index = solution.Value(routing.NextVar(index))
                if not routing.IsEnd(next_index):
                    # Calculate the travel time to the next node
                    travel_time = solution.Min(
                        time_dimension.CumulVar(next_index)
                    ) - solution.Min(time_var)
                    route_time += travel_time
                index = next_index

            # Add the end node
            end_time_var = time_dimension.CumulVar(index)
            route_text.append(f"End Time({solution.Min(end_time_var)})")
            route_text.append(f"Route time: {route_time}")
            total_time += route_time
            route.append(manager.IndexToNode(index))
            car_routes[vehicle_id] = route

            # Print the route
            #print("\n".join(route_text))
            print()  # Blank line between vehicle routes

        print(f"Total time for all routes: {total_time}")
        car_routes_with_ids = get_list_of_customer_ids_from_nodes(
            car_routes, locations, scenario
        )
        return (car_routes_with_ids, total_time)
    else:
        raise ValueError("No solution found.")


if __name__ == "__main__":
    scenario = Scenario.parse_file((Path(__file__).parent / "example.json"))
    get_routing_solution(scenario)
