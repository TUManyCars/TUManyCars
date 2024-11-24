from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List
from scenario_model import Scenario
from main import run_main
from initialise_scenario import init_scenario
from typing import Optional

app = FastAPI()


class Location(BaseModel):
    id: int
    name: str
    coordinates: List[float]  # [latitude, longitude]


class RouteRequest(BaseModel):
    scenario_id: str
    solve_for_shortest_path: Optional[bool] = False


class RouteResponse(BaseModel):
    time_algo_took_in_sec: float
    overall_car_usage_in_sec: int
    last_customer_at_destination_in_sec: int


@app.get("/")
def redirect_to_docs():
    return RedirectResponse(url="/docs")


@app.post("/solve-routing", response_model=RouteResponse)
def solve_routing(request: RouteRequest) -> RouteResponse:
    """
    Solves a simple routing problem (e.g., finding the order to visit locations).
    """
    # Validate input
    # scenario = init_scenario()
    # print(request)
    try:
        (elapsed_time_algo, total_travel, max_car_travel_time) = run_main(
            request.scenario_id, request.solve_for_shortest_path
        )
    except Exception as exc:
        print(str(exc))
        raise HTTPException(status_code=400, detail=str(exc))
    return RouteResponse(
        time_algo_took_in_sec=elapsed_time_algo,
        overall_car_usage_in_sec=total_travel,
        last_customer_at_destination_in_sec=max_car_travel_time,
    )
