"use client";

import "leaflet/dist/leaflet.css";
import { ClientMap } from "./ClientMap";
import type Scenario from "~/types/Scenario";
import { useEffect, useRef, useState, useCallback } from "react";
import type Vehicle from "~/types/Vehicle";

interface VehicleMovement extends Vehicle {
  targetLat: number;
  targetLng: number;
  startLat: number;
  startLng: number;
}

export function ScenarioLive({ scenario }: { scenario: Scenario }) {
  const [vehicles, setVehicles] = useState<VehicleMovement[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const isAnimatingRef = useRef(false);

  // Animation function
  const startAnimation = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const animate = () => {
      const currentTime = Date.now();
      const timeDiff = currentTime - lastUpdateTimeRef.current;
      const duration = 2000; // Match the server update interval
      const progress = Math.min(timeDiff / duration, 1);
      
      setVehicles(prevVehicles => 
        prevVehicles.map(vehicle => ({
          ...vehicle,
          lat: vehicle.startLat + (vehicle.targetLat - vehicle.startLat) * progress,
          lng: vehicle.startLng + (vehicle.targetLng - vehicle.startLng) * progress,
        }))
      );

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        isAnimatingRef.current = false;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, []);

  // Connect to SSE endpoint
  useEffect(() => {
    const eventSource = new EventSource(`/api/scenario/vehicles?scenarioID=${scenario.id}`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      const newVehicles = JSON.parse(event.data as string) as Vehicle[];
      lastUpdateTimeRef.current = Date.now();
      
      setVehicles(prevVehicles => {
        return newVehicles.map(newVehicle => {
          const existing = prevVehicles.find(m => m.id === newVehicle.id)!;
          return {
            ...newVehicle,
            coordX: existing?.coordX ?? newVehicle.coordX,
            coordY: existing?.coordY ?? newVehicle.coordY,
            startLat: existing?.coordX ?? newVehicle.coordX,
            startLng: existing?.coordY ?? newVehicle.coordY,
            targetLat: newVehicle.coordX,
            targetLng: newVehicle.coordY,
          };
        });
      });

      // Start a new animation when we receive new data
      startAnimation();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [startAnimation, scenario.id]);

  return (
    <ClientMap 
      center={[48.13515, 11.5825]}
      vehicles={vehicles}
    />
  );
}
