from pathlib import Path
from scenario_model import Scenario
from ortools.constraint_solver import pywrapcp
from ortools.constraint_solver import routing_enums_pb2
from _create_pairs import euclidean_distance, process_customers

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
print(locations)
print(precedence_pairs)
print(num_cars)


manager = pywrapcp.RoutingIndexManager(
    len(locations), num_cars, vehicle_indices, [dummy_end] * num_cars
)
routing = pywrapcp.RoutingModel(manager)


def distance_callback(from_index, to_index):
    if to_index == dummy_end:
        return 0
    from_node = manager.IndexToNode(from_index)
    to_node = manager.IndexToNode(to_index)
    return euclidean_distance(locations[from_node], locations[to_node])


def time_callback(from_index, to_index):
    """Returns the travel time between two nodes."""
    if to_index == dummy_end:
        return 0
    from_node = manager.IndexToNode(from_index)
    to_node = manager.IndexToNode(to_index)
    speed_factor = 1.0  # adjust based on your scenario
    travel_time = (
        euclidean_distance(locations[from_node], locations[to_node]) / speed_factor
    )
    # Add service time for customer nodes (if applicable)
    # Adjust these values based on your scenario
    # if to_node < len(scenario.customers):  # If destination is a customer
    #     service_time = 10  # Add fixed service time
    #     return travel_time + service_time
    return travel_time


# transit_callback_index = routing.RegisterTransitCallback(distance_callback)
# routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

time_callback_index = routing.RegisterTransitCallback(time_callback)
routing.SetArcCostEvaluatorOfAllVehicles(time_callback_index)

time = "Time"
routing.AddDimension(
    time_callback_index,
    slack_max=0,  # No slack
    capacity=1000,  # Maximum time per vehicle
    fix_start_cumul_to_zero=True,
    name=time,
)
time_dimension = routing.GetDimensionOrDie(time)
time_dimension.SetGlobalSpanCostCoefficient(100)

for vehicle_id in range(num_cars):
    for first, second in precedence_pairs:
        first_index = manager.NodeToIndex(first)
        second_index = manager.NodeToIndex(second)
        # Ensure precedence constraints are respected
        routing.solver().Add(
            time_dimension.CumulVar(first_index)
            <= time_dimension.CumulVar(second_index)
        )
        # Prevent assignments to dummy end before all precedences are satisfied
        routing.solver().Add(routing.NextVar(second_index) != dummy_end)

search_parameters = pywrapcp.DefaultRoutingSearchParameters()
search_parameters.first_solution_strategy = (
    routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
)
search_parameters.local_search_metaheuristic = (
    routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
)
search_parameters.time_limit.seconds = 30

solution = routing.SolveWithParameters(search_parameters)
if solution:
    total_time = 0
    for vehicle_id in range(num_cars):
        index = routing.Start(vehicle_id)
        route = f"Route for vehicle {vehicle_id}:\n"
        route_time = 0

        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            time_var = time_dimension.CumulVar(index)
            route += f"Node {node_index}"
            route += f" Time({solution.Min(time_var)},{solution.Max(time_var)}) -> "

            previous_index = index
            index = solution.Value(routing.NextVar(index))
            route_time += time_callback(previous_index, index)

        route += "End"
        print(route)
        print(f"Route time: {route_time}\n")
        total_time += route_time

    print(f"Total time for all routes: {total_time}")
else:
    print("No solution found.")
