"use client";

import { useState } from "react";
import { ClientMap } from "./ClientMap";
import type Vehicle from "~/types/Vehicle";
import { v4 as uuidv4 } from 'uuid';

/* Original Form Implementation:
import { api } from "~/trpc/react";

export function StartScenario() {
  const [vehicleCount, setVehicleCount] = useState(1);
  const [customerCount, setCustomerCount] = useState(1);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const createScenario = api.scenario.create.useMutation({});

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        createScenario.mutate({
          vehicleCount,
          customerCount,
          simulationSpeed,
        });
      }}
      className="flex flex-col gap-2"
    >
      <input
        type="text"
        placeholder="Vehicle count"
        value={vehicleCount}
        onChange={(e) => setVehicleCount(Number(e.target.value))}
        className="w-full rounded-full px-4 py-2 text-black"
      />
      <input
        type="text"
        placeholder="Customer count"
        value={customerCount}
        onChange={(e) => setCustomerCount(Number(e.target.value))}
        className="w-full rounded-full px-4 py-2 text-black"
      />
      <input
        type="text"
        placeholder="Speed"
        value={simulationSpeed}
        onChange={(e) => setSimulationSpeed(Number(e.target.value))}
        className="w-full rounded-full px-4 py-2 text-black"
      />
      <button
        type="submit"
        className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20"
      >
        {createScenario.isPending ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
*/

export function ScenarioStarter() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  const handleMapClick = (lat: number, lng: number) => {
    const newVehicle: Vehicle = {
      id: uuidv4(),
      coordX: lng,
      coordY: lat,
      isAvailable: true,
      vehicleSpeed: null,
      customerId: null,
      remainingTravelTime: null,
      distanceTravelled: null,
      activeTime: null,
      numberOfTrips: null
    };
    setVehicles([...vehicles, newVehicle]);
  };

  const handleVehicleDelete = (vehicleId: string) => {
    setVehicles(vehicles.filter(v => v.id !== vehicleId));
  };

  return (
    <div className="w-full max-w-6xl px-4">
      <h1 className="mb-4 text-2xl font-bold">Click on the map to spawn vehicles</h1>
      <ClientMap 
        center={[48.13515, 11.5825]}
        vehicles={vehicles}
        onMapClick={handleMapClick}
        onVehicleDelete={handleVehicleDelete}
      />
      <div className="mt-4">
        <p>Vehicles spawned: {vehicles.length}</p>
      </div>
    </div>
  );
}
