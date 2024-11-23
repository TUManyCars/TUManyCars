from pydantic import BaseModel
from typing import List

class OneVehicleUpdate(BaseModel):
    id: str
    customerId: str

class VehiclesUpdate(BaseModel):
    vehicles: List[OneVehicleUpdate]
