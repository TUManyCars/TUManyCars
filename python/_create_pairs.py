from scenario_model import Scenario


def process_customers(
    scenario: Scenario,
) -> tuple[list[tuple[float, float]], list[tuple[int, int]]]:
    locations = []
    precedence_pairs = []

    for customer in scenario.customers:
        current_coord = (customer.coordX, customer.coordY)
        destination_coord = (customer.destinationX, customer.destinationY)

        current_index = len(locations)
        locations.append(current_coord)
        locations.append(destination_coord)

        precedence_pairs.append((current_index, current_index + 1))
    return locations, precedence_pairs
