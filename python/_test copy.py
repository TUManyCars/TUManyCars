from pathlib import Path
from scenario_model import Scenario
from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2
from _create_pairs import process_customers
from _penalties import (
    add_max_capacity_per_vehicle,
    add_pickup_delivery_constraints,
    minimize_largest_end_time,
    time_callback,
    create_time_dimension,
)
from absl import logging

logging.set_verbosity(logging.INFO)

scenario = Scenario.parse_file((Path(__file__).parent / "example.json"))
locations, precedence_pairs = process_customers(scenario)

num_cars = len(scenario.vehicles)


vehicle_indices = []
for vehicle in scenario.vehicles:
    start_car_coords = (vehicle.coordX, vehicle.coordY)
    locations.append(start_car_coords)
    vehicle_indices.append(len(locations) - 1)

locations.append((0, 0))
dummy_end = len(locations) - 1
# print(locations)
# print(precedence_pairs)
# print(num_cars)


manager = pywrapcp.RoutingIndexManager(
    len(locations), num_cars, vehicle_indices, [dummy_end] * num_cars
)
routing = pywrapcp.RoutingModel(manager)

create_time_dimension(routing, manager, locations)

pickup_indices = []
delivery_indices = []

for customer_index in range(len(scenario.customers)):
    pickup_indices.append(2 * customer_index)
    delivery_indices.append(2 * customer_index + 1)

add_pickup_delivery_constraints(routing, zip(pickup_indices, delivery_indices))

add_max_capacity_per_vehicle(routing, [1] * num_cars)
minimize_largest_end_time(routing)


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
    for vehicle_id in range(num_cars):
        index = routing.Start(vehicle_id)
        route = f"Route for vehicle {vehicle_id}:\n"
        route_time = 0
        time_dimension = routing.GetDimensionOrDie("Time")

        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            time_var = time_dimension.CumulVar(index)
            route += f"Node {node_index} Time({solution.Min(time_var)}) -> "
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_time += time_callback(manager, previous_index, index, locations)

        route += "End"
        print(route)
        print(f"Route time: {route_time}\n")
        total_time += route_time

    print(f"Total time for all routes: {total_time}")
else:
    print("No solution found.")
