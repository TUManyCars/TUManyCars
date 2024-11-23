import requests
from scenario_model import Scenario
from patch_model import VehiclesUpdate, OneVehicleUpdate

url1 = 'http://localhost:8080/scenario/create'
params1 = {'numberOfVehicles': 5, 'numberOfCustomers': 10}
response = requests.post(url1, params=params1)
scenario = Scenario.parse_obj(response.json())
print("Scenario created successfully.") if response.status_code == 200 else None


url2 = f"http://localhost:8090/Scenarios/initialize_scenario?db_scenario_id={scenario.id}"
response = requests.post(url2, json={})
print("Scenario initialized successfully.") if response.status_code == 200 else None
    

url3 = f'http://localhost:8090/Runner/launch_scenario/{scenario.id}?speed=1'
response = requests.post(url3)
print("Scenario launched successfully.") if response.status_code == 200 else None
    
    

url4 = f"http://localhost:8090/Scenarios/update_scenario/{scenario.id}"
for vehicle in scenario.vehicles:
    for customer in scenario.customers:
        if customer.awaitingService:
            customer_id = customer.id
            customer.awaitingService = False
    cars = VehiclesUpdate(vehicles=[OneVehicleUpdate(id=vehicle.id, customerId=customer_id)])

    payload = {"vehicles": cars.dict()}
    response = requests.put(url4, json=payload)

    print(f"Vehicles were updated successfully.") if response.status_code == 200 else None
        

url5 = f'http://localhost:8090/Scenarios/get_scenario/{scenario.id}'
response = requests.get(url4)
print(response.json()) if response.status_code == 200 else None
