from ortools.constraint_solver.pywrapcp import RoutingModel, RoutingIndexManager
import math


def euclidean_distance(coord1, coord2) -> int:
    # Calculate Euclidean distance between two coordinates
    x1, y1 = coord1
    x2, y2 = coord2
    distance_in_meters = (math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)) * 111000
    time_in_sec = distance_in_meters / 4.5
    time_in_min = time_in_sec / 60
    return round(time_in_min)


def create_time_dimension(
    routing: RoutingModel,
    manager: RoutingIndexManager,
    locations,
):
    """Adds the time dimension to the routing model and returns it."""

    def time_callback(from_index, to_index):
        """Returns the travel time between the two nodes."""
        # Convert from routing variable Index to actual node index
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        time = euclidean_distance(locations[from_node], locations[to_node])
        return time

    time_callback_index = routing.RegisterTransitCallback(time_callback)
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
    # # Create a variable to track the maximum end time
    # max_end_time = routing.solver().IntVar(0, 10000, "MaxEndTime")
    # # Collect end times for all vehicles
    # end_nodes = [routing.End(i) for i in range(routing.vehicles())]
    # end_times = [time_dimension.CumulVar(end_node) for end_node in end_nodes]
    # # Set max_end_time to be the maximum of all end times
    # if not isinstance(end_times, list) or not all(
    #     isinstance(var, IntVar) for var in end_times
    # ):
    #     raise ValueError("end_times must be a list of IntVar objects.")

    # # Set the objective to minimize the maximum end time
    # routing.solver().AddObjective(max_end_time)
    time_dimension.SetGlobalSpanCostCoefficient(100)
    return time_dimension  # , max_end_time


def set_penalty_for_waiting(routing: RoutingModel):
    def waiting_time_callback(from_index, to_index):
        """Return a penalty for waiting."""
        # Waiting time is the time spent at the start without moving
        return 0 if routing.IsEnd(from_index) else 1

    waiting_time_index = routing.RegisterTransitCallback(waiting_time_callback)

    # Add a waiting time dimension
    routing.AddDimension(
        waiting_time_index,
        slack_max=0,  # No additional slack
        capacity=10000,  # Large enough capacity
        fix_start_cumul_to_zero=True,
        name="WaitingTime",
    )

    # Penalize waiting time globally
    waiting_time_dimension = routing.GetDimensionOrDie("WaitingTime")
    waiting_time_dimension.SetGlobalSpanCostCoefficient(100)
