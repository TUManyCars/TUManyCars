import requests
from scenario_model import Scenario
from patch_model import VehiclesUpdate, OneVehicleUpdate
from initialise_scenario import init_scenario
import time
from calculate_distance import calculate_distance

scenario, scenario_start_time = init_scenario(0.01, 5, 20)
    
start_time = time.perf_counter()
get_url = f'http://localhost:8090/Scenarios/get_scenario/{scenario.id}'
update_url = f"http://localhost:8090/Scenarios/update_scenario/{scenario.id}"
currently_serviced = []
cars = VehiclesUpdate(vehicles=[])
while scenario.status != "COMPLETED":
    response = requests.get(get_url)
    scenario = Scenario.parse_obj(response.json())
    for car in scenario.vehicles:
        if car.isAvailable:
            closest_customer = None
            min_distance = float('inf')
            
            for customer in scenario.customers:
                if customer.awaitingService and customer.id not in currently_serviced:
                    distance = calculate_distance(car.coordX, car.coordY, customer.coordX, customer.coordY)
                    if distance < min_distance:
                        min_distance = distance
                        closest_customer = customer
                        
            if closest_customer:
                currently_serviced.append(closest_customer.id)
                closest_customer.awaitingService = False
                cars.vehicles.append(OneVehicleUpdate(id=car.id, customerId=closest_customer.id))
                
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
print(f"Start time:{scenario_start_time}")
print(f"End time:{scenario.endTime}")