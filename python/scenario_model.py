from pydantic import BaseModel
from typing import List, Optional

class Vehicle(BaseModel):
    id: str
    coordX: float
    coordY: float
    isAvailable: bool
    vehicleSpeed: Optional[float] = None
    customerId: Optional[str] = None
    remainingTravelTime: Optional[float] = None
    distanceTravelled: Optional[float] = None
    activeTime: Optional[float] = None
    numberOfTrips: Optional[int] = None

class Customer(BaseModel):
    id: str
    coordX: float
    coordY: float
    destinationX: float
    destinationY: float
    awaitingService: bool

class Scenario(BaseModel):
    id: str
    startTime: Optional[str] = None
    endTime: Optional[str] = None
    status: str
    vehicles: List[Vehicle]
    customers: List[Customer]