import requests
from scenario_model import Scenario
from patch_model import VehiclesUpdate, OneVehicleUpdate
from initialise_scenario import init_scenario
import time
from _create_route import get_routing_solution
import os


def run_main(scenario_id: str):
    start_time = time.perf_counter()
    host = os.environ.get('API_HOST', 'localhost')
    get_url = f"http://{host}:8090/Scenarios/get_scenario/{scenario_id}"
    update_url = (
        f"http://{host}:8090/Scenarios/update_scenario/{scenario_id}"
    )
    cars = VehiclesUpdate(vehicles=[])

    response = requests.get(get_url)
    response_data = response.json()
    if "message" in response_data and response_data["message"] == "Scenario not found":
        raise ValueError("Scenario was not found for id.")
    scenario = Scenario.parse_obj(response_data)

    car_routes, total_travel = get_routing_solution(scenario)
    while scenario.status != "COMPLETED":
        response = requests.get(get_url)
        response_data = response.json()
        if "message" in response_data and response_data["message"] == "Scenario not found":
            raise ValueError("Scenario was not found for id.")

        scenario = Scenario.parse_obj(response_data)
        for i, car in enumerate(scenario.vehicles):
            if car.isAvailable:
                if car_routes[i] != []:
                    print(car_routes)
                    cars.vehicles.append(
                        OneVehicleUpdate(id=car.id, customerId=car_routes[i][0])
                    )
                    car_routes[i] = car_routes[i][1:]

        if cars.vehicles:
            print(cars.dict())
            response = requests.put(update_url, json=cars.dict())
            if response.status_code == 200:
                print("Update a car.")
            cars = VehiclesUpdate(vehicles=[])
        time.sleep(2)

    print("completed")
    end_time = time.perf_counter()
    elapsed_time = end_time - start_time
    print(f"Elapsed time: {elapsed_time} seconds")
    print(f"Start time:{scenario.startTime}")
    print(f"End time:{scenario.endTime}")


if __name__ == "__main__":
    from pathlib import Path

    scenario2 = Scenario.parse_file((Path(__file__).parent / "example.json"))
    # scenario = init_scenario(0.01, 5, 20)
    run_main(scenario2)
