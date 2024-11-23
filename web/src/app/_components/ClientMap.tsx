"use client";

import dynamic from "next/dynamic";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import type Vehicle from "~/types/Vehicle";

const Map = dynamic(() => import("./Map"), { ssr: false });

interface Props {
  center: LatLngExpression | LatLngTuple;
  zoom?: number;
  vehicles: Vehicle[];
  onMapClick?: (lat: number, lng: number) => void;
  onVehicleDelete?: (vehicleId: string) => void;
}

export function ClientMap({ center, zoom, vehicles, onMapClick, onVehicleDelete }: Props) {
  return (
    <Map 
      center={center} 
      zoom={zoom} 
      vehicles={vehicles}
      onMapClick={onMapClick}
      onVehicleDelete={onVehicleDelete}
    />
  );
}
