from scenario_model import Scenario
from pathlib import Path
import math

scenario = Scenario.parse_file((Path(__file__).parent / "example.json"))


def euclidean_distance(coord1, coord2):
    # Calculate Euclidean distance between two coordinates
    x1, y1 = coord1
    x2, y2 = coord2
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


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


locations, precedence_pairs = process_customers(scenario)
print("Locations:", locations)
print("Precedence Pairs:", precedence_pairs)
