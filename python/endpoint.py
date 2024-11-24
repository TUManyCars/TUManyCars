from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List
import uuid
from scenario_model import Scenario
from main import run_main, run_solver
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
def solve_routing(
    request: RouteRequest, background_tasks: BackgroundTasks
) -> RouteResponse:
    """
    Solves a simple routing problem (e.g., finding the order to visit locations).
    """
    try:
        (car_routes, total_travel_time, max_car_travel_time, elapsed_time_algo) = (
            run_solver(request.scenario_id, request.solve_for_shortest_path)
        )
        task_id = str(uuid.uuid4())
        background_tasks.add_task(run_main, request.scenario_id, car_routes, task_id)
    except Exception as exc:
        print(str(exc))
        raise HTTPException(status_code=400, detail=str(exc))
    return RouteResponse(
        time_algo_took_in_sec=elapsed_time_algo,
        overall_car_usage_in_sec=total_travel_time,
        last_customer_at_destination_in_sec=max_car_travel_time,
    )
