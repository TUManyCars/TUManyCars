from ortools.constraint_solver.pywrapcp import RoutingModel, RoutingIndexManager
import math


def euclidean_distance(coord1, coord2):
    # Calculate Euclidean distance between two coordinates
    x1, y1 = coord1
    x2, y2 = coord2
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def time_callback(
    manager: RoutingIndexManager, from_index: int, to_index: int, locations
):
    """Returns the travel time between two nodes.

    For TRACKING RESOURCE CONSUMPTION.
    """
    # if to_index == dummy_end:
    #     return 0
    from_node = manager.IndexToNode(from_index)
    to_node = manager.IndexToNode(to_index)
    speed_factor = 15  # adjust based on your scenario
    travel_time = (
        euclidean_distance(locations[from_node], locations[to_node]) / speed_factor
    )
    return travel_time


def create_time_dimension(
    routing: RoutingModel,
    manager: RoutingIndexManager,
    locations,
):
    """Adds the time dimension to the routing model and returns it."""

    time_callback_index = routing.RegisterTransitCallback(
        lambda from_index, to_index: time_callback(
            manager, from_index, to_index, locations
        )
    )
    routing.AddDimension(
        time_callback_index,
        slack_max=0,  # No slack time
        capacity=10000,  # Maximum time allowed for each vehicle
        fix_start_cumul_to_zero=True,
        name="Time",
    )
    return routing.GetDimensionOrDie("Time")


def add_pickup_delivery_constraints(routing: RoutingModel, pickup_delivery_pairs):
    """Adds pickup and delivery constraints to the routing model."""
    time_dimension = routing.GetDimensionOrDie("Time")
    for pickup_index, delivery_index in pickup_delivery_pairs:
        routing.AddPickupAndDelivery(pickup_index, delivery_index)
        # Ensure that pickups and deliveries are on the same vehicle
        routing.solver().Add(
            routing.VehicleVar(pickup_index) == routing.VehicleVar(delivery_index)
        )
        # Enforce that delivery occurs immediately after pickup
        routing.solver().Add(routing.NextVar(pickup_index) == delivery_index)
        # Ensure time at destination is higher than at start
        routing.solver().Add(
            time_dimension.CumulVar(pickup_index)
            <= time_dimension.CumulVar(delivery_index)
        )


def add_max_capacity_per_vehicle(routing: RoutingModel, vehicle_capacities: list[int]):
    """Adds the capacity dimension to the routing model."""

    def demand_callback(index):
        return 1

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # Null capacity slack
        vehicle_capacities,
        True,  # Start cumul to zero
        "Capacity",
    )
    capacity_dimension = routing.GetDimensionOrDie("Capacity")
    return capacity_dimension


def minimize_largest_end_time(routing: RoutingModel):
    """Adds a time dimension and sets an objective to minimize the largest end time."""
    time_dimension = routing.GetDimensionOrDie("Time")
    # Create a variable to track the maximum end time
    # max_end_time = routing.solver().IntVar(0, 10000, "MaxEndTime")
    # # Collect end times for all vehicles
    # end_nodes = [routing.End(i) for i in range(routing.vehicles())]
    # end_times = [time_dimension.CumulVar(end_node) for end_node in end_nodes]
    # # Set max_end_time to be the maximum of all end times
    # routing.solver().AddMaxEquality(max_end_time, end_times)
    # # Set the objective to minimize the maximum end time
    # routing.solver().Minimize(max_end_time)
    time_dimension.SetGlobalSpanCostCoefficient(100)
    return time_dimension  # , max_end_time
