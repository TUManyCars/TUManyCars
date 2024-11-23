import requests
from scenario_model import Scenario

def init_scenario(speed: float, n_cars:int = 5, n_customers:int = 10):
    url1 = 'http://localhost:8080/scenario/create'
    params1 = {'numberOfVehicles': n_cars, 'numberOfCustomers': n_customers}
    response = requests.post(url1, params=params1)
    scenario = Scenario.parse_obj(response.json())
    print(scenario.id)
    print("Scenario created successfully.") if response.status_code == 200 else None


    url2 = f"http://localhost:8090/Scenarios/initialize_scenario?db_scenario_id={scenario.id}"
    response = requests.post(url2, json={})
    print("Scenario initialized successfully.") if response.status_code == 200 else None
        

    url3 = f'http://localhost:8090/Runner/launch_scenario/{scenario.id}?speed={speed}'
    response = requests.post(url3)
    start_time = response.json()['startTime']
    print("Scenario launched successfully.") if response.status_code == 200 else None
    return scenario, start_time