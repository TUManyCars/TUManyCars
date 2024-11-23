from pathlib import Path
from scenario_model import Scenario
from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2
from _create_pairs import process_customers
from _penalties import (
    add_max_capacity_per_vehicle,
    add_pickup_delivery_constraints,
    minimize_largest_end_time,
    set_penalty_for_waiting,
    create_time_dimension,
)
from absl import logging

logging.set_verbosity(logging.INFO)

scenario = Scenario.parse_file((Path(__file__).parent / "example.json"))
locations, precedence_pairs = process_customers(scenario)

num_cars = len(scenario.vehicles)


vehicle_start_indeces = []
for vehicle in scenario.vehicles:
    start_car_coords = (vehicle.coordX, vehicle.coordY)
    locations.append(start_car_coords)
    vehicle_start_indeces.append(len(locations) - 1)

# locations.append((0, 0))
# dummy_end = len(locations) - 1
# print(locations)
# print(precedence_pairs)
# print(num_cars)

vehicle_end_indeces = []
for vehicle in scenario.vehicles:
    end_car_coords = (vehicle.coordX, vehicle.coordY)
    locations.append(end_car_coords)
    vehicle_end_indeces.append(len(locations) - 1)


# manager = pywrapcp.RoutingIndexManager(
#     len(locations), num_cars, vehicle_indices, [dummy_end] * num_cars
# )
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

add_max_capacity_per_vehicle(routing, [10] * num_cars)
minimize_largest_end_time(routing)
set_penalty_for_waiting(routing)


search_parameters = pywrapcp.DefaultRoutingSearchParameters()
search_parameters.first_solution_strategy = (
    routing_enums_pb2.FirstSolutionStrategy.PARALLEL_CHEAPEST_INSERTION
)
search_parameters.local_search_metaheuristic = (
    routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
)
search_parameters.time_limit.seconds = 40
search_parameters.log_search = True
solution = routing.SolveWithParameters(search_parameters)

# Display the solution
if solution:
    total_time = 0
    time_dimension = routing.GetDimensionOrDie("Time")

    for vehicle_id in range(num_cars):
        index = routing.Start(vehicle_id)
        route = [f"Route for vehicle {vehicle_id}:"]
        route_time = 0

        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            time_var = time_dimension.CumulVar(index)
            route.append(f"Node {node_index} Time({solution.Min(time_var)})")
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
        route.append(f"End Time({solution.Min(end_time_var)})")
        route.append(f"Route time: {route_time}")
        total_time += route_time

        # Print the route
        print("\n".join(route))
        print()  # Blank line between vehicle routes

    print(f"Total time for all routes: {total_time}")
else:
    print("No solution found.")
