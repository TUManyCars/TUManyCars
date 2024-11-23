import type Vehicle from "./Vehicle";
import type Customer from "./Customer";

export default interface Scenario {
  id: string;
  startTime: number | null;
  endTime: number | null;
  status: string;
  vehicles: Vehicle[];
  customers: Customer[];
}
