import requests
from scenario_model import Scenario
from patch_model import VehiclesUpdate, OneVehicleUpdate
from initialise_scenario import init_scenario
import time

scenario, scenario_start_time = init_scenario(0.01)
    
start_time = time.perf_counter()
get_url = f'http://localhost:8090/Scenarios/get_scenario/{scenario.id}'
update_url = f"http://localhost:8090/Scenarios/update_scenario/{scenario.id}"
currently_serivced = []
cars = VehiclesUpdate(vehicles=[])
while scenario.status != "COMPLETED":
    response = requests.get(get_url)
    scenario = Scenario.parse_obj(response.json())
    for car in scenario.vehicles:
        if car.isAvailable:
            for customer in scenario.customers:
                if customer.awaitingService and customer.id not in currently_serivced:
                    currently_serivced.append(customer.id)
                    customer.awaitingService = False
                    cars.vehicles.append(OneVehicleUpdate(id=car.id, customerId=customer.id))
                    break
    print(cars.dict())
    requests.put(update_url, json=cars.dict())
    cars = VehiclesUpdate(vehicles=[])
    time.sleep(2)
    
print("completed")
end_time = time.perf_counter()
elapsed_time = end_time - start_time
print(f"Elapsed time: {elapsed_time} seconds")
print(f"Start time:{scenario_start_time}")
print(f"End time:{scenario.endTime}")