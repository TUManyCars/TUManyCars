"use client";

import { useState } from "react";
import { ClientMap } from "./ClientMap";
import type Vehicle from "~/types/Vehicle";
import { v4 as uuidv4 } from 'uuid';
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import type { OptimizeTarget } from "~/types/OptimizeTarget";

export function ScenarioStarter() {
  // Map state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Configuration options
  const [optimizationTarget, setOptimizationTarget] = useState<OptimizeTarget>("customer_satisfaction");
  const [returnToHub, setReturnToHub] = useState(false);
  const [startAtHub, setStartAtHub] = useState(false);
  
  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customerCount, setCustomerCount] = useState<number | null>(20);
  const [randomVehicleCount, setRandomVehicleCount] = useState<number | null>(5);
  const [simulationSpeed, setSimulationSpeed] = useState(0.1);
  const [isStarting, setStarting] = useState(false);

  const router = useRouter();

  const setup = api.scenario.setup.useMutation({
    onSuccess: (data) => {
      router.push(`/live?scenarioid=${data.scenarioId}&optimize=${optimizationTarget}&returnToHub=${returnToHub}&simulationSpeed=${simulationSpeed}`);
    }
  });

  const handleMapClick = (lat: number, lng: number) => {
    const newVehicle: Vehicle = {
      id: uuidv4(),
      coordX: lat,
      coordY: lng,
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

  const handleSubmit = () => {
    setup.mutate({
      optimizationTarget,
      returnToHub,
      startAtHub,
      customerCount: customerCount ?? 1,
      vehicleCount: vehicles.length + (randomVehicleCount ?? 0),
      customVehicles: vehicles,
      simulationSpeed
    });

    setStarting(true);
  };

  return (
    <div className="w-full max-w-6xl px-4">
      <div className="mb-8">
        <div className="space-y-4">
          <div className="space-y-4">
            <div className="max-w-xs">
              <label className="block text-sm font-medium mb-1">Optimization Target</label>
              <div className="relative">
                <select
                  value={optimizationTarget}
                  onChange={(e) => setOptimizationTarget(e.target.value as "sustainability" | "customer_satisfaction")}
                  className="w-full p-1 pl-3 pr-10 border rounded-md bg-white text-black appearance-none"
                  onFocus={(e) => e.target.parentElement?.classList.add('focused')}
                  onBlur={(e) => e.target.parentElement?.classList.remove('focused')}
                >
                  <option value="sustainability">Sustainability</option>
                  <option value="customer_satisfaction">Customer Satisfaction</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg 
                    className="w-4 h-4 transform transition-transform duration-200 group-[.focused]:rotate-180"
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={returnToHub}
                  onChange={(e) => setReturnToHub(e.target.checked)}
                  className="form-checkbox accent-[#ea0a8e]"
                />
                <span>Return to Hub</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={startAtHub}
                  onChange={(e) => setStartAtHub(e.target.checked)}
                  className="form-checkbox accent-[#ea0a8e]"
                />
                <span>Start at Hub</span>
              </label>
            </div>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-white hover:text-slate-100 transition-colors"
            >
              <svg
                className={`w-4 h-4 transform transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="font-medium">
                {showAdvanced ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </span>
            </button>

            <div className={`mt-2 overflow-hidden transition-all duration-200 ${showAdvanced ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-3 p-4 border rounded-md bg-gray-900/50">
                <div className="space-y-1">
                  <label className="block text-sm font-medium">Amount of Customers</label>
                  <input
                    type="number"
                    value={customerCount ?? ''}
                    onChange={(e) => {
                      setCustomerCount(e.target.value === '' ? null : Number(e.target.value));
                    }}
                    className="w-full p-2 border rounded-md text-black"
                  />
                  <p className="text-sm text-gray-400 italic">Will be randomly placed when simulation starts</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Additional Random Cars</label>
                  <input
                    type="number"
                    value={randomVehicleCount ?? ''}
                    onChange={(e) => {
                      setRandomVehicleCount(e.target.value === '' ? null : Number(e.target.value));
                    }}
                    className="w-full p-2 border rounded-md text-black"
                  />
                  <p className="text-sm text-gray-400 italic">Will be randomly placed when simulation starts, in addition to the cars you put on the map yourself</p>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium">Simulation Speed</label>
                  <input
                    type="number"
                    value={simulationSpeed}
                    onChange={(e) => setSimulationSpeed(Number(e.target.value))}
                    min="0.1"
                    step="0.1"
                    className="w-full p-2 border rounded-md text-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h1 className="mb-4 text-2xl font-bold">Click on the map to spawn vehicles</h1>
        <ClientMap 
          center={[48.13515, 11.5825]}
          zoom={12}
          vehicles={vehicles}
          customers={[]}
          onMapClick={handleMapClick}
          onVehicleDelete={handleVehicleDelete}
        />
        <div className="mt-4">
          <div className="text-gray-300">
            <p>Manually placed vehicles: {vehicles.length}</p>
            {randomVehicleCount > 0 && (
              <p className="text-sm text-gray-400">+ {randomVehicleCount} random vehicles</p>
            )}
          </div>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => handleSubmit()}
              disabled={vehicles.length + (randomVehicleCount ?? 0) === 0}
              className="bg-[#ea0a8e] text-white py-3 px-8 text-lg font-semibold rounded-md hover:bg-[#ea0a8db9] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed min-w-[200px]"
            >
              {isStarting ? 'Starting...' : 'Start Simulation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
