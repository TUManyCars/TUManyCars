from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import List
from main import run_main, run_solver
from typing import Optional

app = FastAPI(
    swagger_ui_parameters={"tryItOutEnabled": True},
)


class Location(BaseModel):
    id: int
    name: str
    coordinates: List[float]  # [latitude, longitude]


class RouteRequest(BaseModel):
    scenario_id: str
    solve_for_shortest_path: Optional[bool] = False
    start_cars: Optional[bool] = True
    hub_coords: Optional[tuple[float, float]] = (48.137371, 11.575328)


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
            run_solver(
                request.scenario_id,
                request.hub_coords,
                request.solve_for_shortest_path,
                10,
            )
        )
        if request.start_cars:
            background_tasks.add_task(run_main, request.scenario_id, car_routes)
    except Exception as exc:
        print(str(exc))
        raise HTTPException(status_code=400, detail=str(exc))
    return RouteResponse(
        time_algo_took_in_sec=elapsed_time_algo,
        overall_car_usage_in_sec=total_travel_time,
        last_customer_at_destination_in_sec=max_car_travel_time,
    )


class SolverRequest(BaseModel):
    scenario_id: str
    max_solv_time_in_sec: int = 10


@app.post("/solver", response_model=RouteResponse)
def solver(request: SolverRequest) -> RouteResponse:
    """
    Solves a simple routing problem (e.g., finding the order to visit locations).
    """
    try:
        (_, total_travel_time, max_car_travel_time, elapsed_time_algo) = run_solver(
            request.scenario_id, None, False, request.max_solv_time_in_sec
        )
    except Exception as exc:
        print(str(exc))
        raise HTTPException(status_code=400, detail=str(exc))
    return RouteResponse(
        time_algo_took_in_sec=elapsed_time_algo,
        overall_car_usage_in_sec=total_travel_time,
        last_customer_at_destination_in_sec=max_car_travel_time,
    )
