import requests
from scenario_model import Scenario
from patch_model import VehiclesUpdate, OneVehicleUpdate
from initialise_scenario import init_scenario
import time
from _create_route import get_routing_solution
import os


def run_solver(
    scenario_id: str,
    solve_for_shortest_path: bool | None,
    max_solv_time_in_sec: int = 10,
):
    get_url = (
        os.environ.get("8080_URL", "http://localhost:8080")
        + f"/Scenarios/get_scenario/{scenario_id}"
    )

    response_data = requests.get(get_url).json()
    if "message" in response_data and response_data["message"] == "Scenario not found":
        raise ValueError("Scenario was not found for id.")
    scenario = Scenario.parse_obj(response_data)
    return get_routing_solution(scenario, solve_for_shortest_path, max_solv_time_in_sec)


def run_main(scenario_id: str, car_routes):
    start_time = time.perf_counter()
    get_url = (
        os.environ.get("8080_URL", "http://localhost:8080")
        + f"/Scenarios/get_scenario/{scenario_id}"
    )
    update_url = (
        os.environ.get("8090_URL", "http://localhost:8090")
        + f"/Scenarios/update_scenario/{scenario_id}"
    )
    response_data = requests.get(get_url).json()
    cars = VehiclesUpdate(vehicles=[])
    scenario = Scenario.parse_obj(response_data)
    while scenario.status != "COMPLETED":
        response_data = requests.get(get_url).json()
        if (
            "message" in response_data
            and response_data["message"] == "Scenario not found"
        ):
            raise ValueError("Scenario was not found for id.")

        scenario = Scenario.parse_obj(response_data)
        for i, car in enumerate(scenario.vehicles):
            if car.isAvailable:
                if car_routes[i] != []:
                    cars.vehicles.append(
                        OneVehicleUpdate(id=car.id, customerId=car_routes[i][0])
                    )
                    car_routes[i] = car_routes[i][1:]

        if cars.vehicles:
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
    return


if __name__ == "__main__":
    from pathlib import Path

    scenario2 = Scenario.parse_file((Path(__file__).parent / "example.json"))
    # scenario = init_scenario(0.01, 5, 20)
    run_main(scenario2, False)
