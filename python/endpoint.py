from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List
from scenario_model import Scenario
from main import run_main
from initialise_scenario import init_scenario

app = FastAPI()


class Location(BaseModel):
    id: int
    name: str
    coordinates: List[float]  # [latitude, longitude]


class RouteRequest(BaseModel):
    scenario: Scenario
    solve_for_shortest_path: bool | None
    solve_for_shortest_max_time: bool | None


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
    run_main(request.scenario)
    return RouteResponse(
        time_algo_took_in_sec=12.5,
        overall_car_usage_in_sec=180,
        last_customer_at_destination_in_sec=7200,
    )
