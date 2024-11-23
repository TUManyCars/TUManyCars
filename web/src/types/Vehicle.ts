export default interface Vehicle {
  id: string;
  coordX: number;
  coordY: number;
  isAvailable: boolean;
  vehicleSpeed: number | null;
  customerId: string | null;
  remainingTravelTime: number | null;
  distanceTravelled: number | null;
  activeTime: number | null;
  numberOfTrips: number | null;
}
