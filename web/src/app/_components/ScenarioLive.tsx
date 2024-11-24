"use client";

import "leaflet/dist/leaflet.css";
import { ClientMap } from "./ClientMap";
import type Scenario from "~/types/Scenario";
import { useEffect, useRef, useState, useCallback } from "react";
import type Vehicle from "~/types/Vehicle";
import type Customer from "~/types/Customer";
import type CalculationResult from "~/types/CalculationResult";
import { OptimizeTarget } from "~/types/OptimizeTarget";
import { api } from "~/trpc/react";

interface VehicleWithGoal extends Vehicle {
  targetX: number; // Latitude
  targetY: number; // Longitude
}

export function ScenarioLive({ 
  scenarioId, 
  optimize, 
  returnToHub,
  simulationSpeed 
}: { 
  scenarioId: string, 
  optimize: OptimizeTarget, 
  returnToHub: boolean,
  simulationSpeed: number 
}) {
  const [vehicles, setVehicles] = useState<VehicleWithGoal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [calculationResults, setCalculationResults] = useState<CalculationResult | null | false>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const hasCalculated = useRef(false);

  const calculate = api.scenario.calculate.useMutation({
    onSuccess: (data) => {
      setCalculationResults(data);
    },
    onError: () => {
      setCalculationResults(false);
    },
  });

  useEffect(() => {
    if (!hasCalculated.current) {
      calculate.mutate({ scenarioId, optimize, returnToHub });
      hasCalculated.current = true;
    }
  }, [calculate, scenarioId, optimize, returnToHub]);

  function calculateEuclideanDistance(latA: number, latB: number, longA: number, longB: number): number {
    const RADIANS = Math.PI / 180;
    const getKmPerDegreeLat = (latitude: number) => 111.13295 - 0.55982 * Math.cos(2 * latitude * RADIANS) + 0.001175 * Math.cos(4 * latitude * RADIANS);
    const latDiff = Math.abs(latA - latB);
    const longDiff = Math.abs(longA - longB);
    const meanLatitude = (latA + latB) / 2;
    const meanLatitudeRad = meanLatitude * RADIANS;
    const kmPerDegreeLat = getKmPerDegreeLat(meanLatitude);
    const latDistance = latDiff * kmPerDegreeLat * 1000;
    const longDistance = longDiff * kmPerDegreeLat * Math.cos(meanLatitudeRad) * 1000;
    return Math.sqrt(latDistance ** 2 + longDistance ** 2);
}

  const startAnimation = useCallback(() => {
    const animate = () => {
      const elapsedTimeSinceUpdate = ((Date.now() - lastUpdateTimeRef.current) / 1000) / (simulationSpeed * 2);

      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => {
          const totalDistance = calculateEuclideanDistance(vehicle.targetX, vehicle.coordX, vehicle.targetY, vehicle.coordY);
          const speed = vehicle.vehicleSpeed ?? 0;
          const timeForTotalDistanceInSeconds = totalDistance / speed;
          const adjustedRemainingTime = Math.max(0, (vehicle.remainingTravelTime ?? 0) - elapsedTimeSinceUpdate);
          const percentageLeft = adjustedRemainingTime / timeForTotalDistanceInSeconds;

          return ({
            ...vehicle,
            realtimeX: (vehicle.coordX + (vehicle.targetX - vehicle.coordX) * (1 - percentageLeft)) || vehicle.coordX,
            realtimeY: (vehicle.coordY + (vehicle.targetY - vehicle.coordY) * (1 - percentageLeft)) || vehicle.coordY,
          });
        }));
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animate();
  }, [simulationSpeed]);

  // Connect to SSE endpoint
  useEffect(() => {
    const eventSource = new EventSource(`/api/scenario/vehicles?scenarioID=${scenarioId}`);
    eventSourceRef.current = eventSource;

    const handleMessage = (event: MessageEvent) => {
      console.log("msg");
      const liveScenario = JSON.parse(event.data as string) as Scenario;
      const liveVehicles = liveScenario.vehicles;
      const liveCustomers = liveScenario.customers;
      console.log(liveVehicles, liveCustomers);
      lastUpdateTimeRef.current = Date.now();

      console.log(liveCustomers);

      const allCustomersServed = !liveCustomers.some(customer => customer.awaitingService);
      if (allCustomersServed) {
        console.log("All customers served, closing connection");
        eventSource.close();
        eventSourceRef.current = null;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        return;
      }

      const vehicleContainsCustomer = (vehicle: Vehicle) => {
        return vehicle.customerId && liveCustomers.some(customer => 
          customer.id === vehicle.customerId && 
          customer.coordX === vehicle.coordX && 
          customer.coordY === vehicle.coordY
        );
      };

      setVehicles(liveVehicles.map(liveVehicle => {
        const customer = liveVehicle.customerId && liveCustomers.find(c => c.id === liveVehicle.customerId);
        return {
          ...liveVehicle,
          realtimeX: liveVehicle.coordX,
          realtimeY: liveVehicle.coordY,
          targetX: liveVehicle.isAvailable ? liveVehicle.coordX : (vehicleContainsCustomer(liveVehicle) ? (customer as Customer).destinationX : (customer as Customer).coordX),
          targetY: liveVehicle.isAvailable ? liveVehicle.coordY : (vehicleContainsCustomer(liveVehicle) ? (customer as Customer).destinationY : (customer as Customer).coordY),
        };
      }));

      setCustomers(liveCustomers);
      startAnimation();
    };

    eventSource.onmessage = handleMessage;

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [scenarioId, startAnimation]);

  return (
    <div className="w-full h-full max-w-6xl px-4 flex flex-col gap-4 justify-center">
      <div className="w-full p-4 bg-[#11182780] text-white rounded-lg mb-4">
        {calculationResults ? (
          <div className="space-y-2">
            <p>Algorithm Time: {calculationResults.time_algo_took_in_sec.toFixed(2)}s</p>
            <p>Total Vehicle Usage: {calculationResults.overall_car_usage_in_sec.toFixed(2)}min</p>
            <p>Max Travel Time for a Car: {calculationResults.last_customer_at_destination_in_sec.toFixed(2)}min</p>
          </div>
        ) : (
          <p className="text-white">{calculationResults === false ? "Could not calculate data..." : "Calculating..."}</p>
        )}
      </div>
      <h3 className="text-white mt-6">Simulation</h3>
      <div className="w-full h-[50vh]">
        <ClientMap 
          center={[48.13515, 11.5825]}
          vehicles={vehicles}
          customers={customers}
        />
      </div>
    </div>
  );
}
