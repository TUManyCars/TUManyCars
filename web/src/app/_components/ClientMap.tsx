"use client";

import dynamic from "next/dynamic";
import type { LatLngExpression, LatLngTuple } from "leaflet";
import type Vehicle from "~/types/Vehicle";
import type Customer from "~/types/Customer";

const Map = dynamic(() => import("./Map"), { ssr: false });

interface Props {
  center: LatLngExpression | LatLngTuple;
  zoom?: number;
  vehicles: Vehicle[];
  customers: Customer[];
  onMapClick?: (lat: number, lng: number) => void;
  onVehicleDelete?: (vehicleId: string) => void;
}

export function ClientMap({ center, zoom, vehicles, customers, onMapClick, onVehicleDelete }: Props) {
  return (
    <Map 
      center={center} 
      zoom={zoom} 
      vehicles={vehicles}
      customers={customers}
      onMapClick={onMapClick}
      onVehicleDelete={onVehicleDelete}
    />
  );
}
