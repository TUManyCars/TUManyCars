"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { LatLngExpression, LatLngTuple, Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";
import type Vehicle from "~/types/Vehicle";

interface Props {
  center: LatLngExpression | LatLngTuple;
  zoom?: number;
  vehicles: Vehicle[];
  onMapClick?: (lat: number, lng: number) => void;
  onVehicleDelete?: (vehicleId: string) => void;
}

const defaults = {
  zoom: 19,
};

const robotaxiIcon = new Icon({
  iconUrl: "/robotaxi.png",
  iconSize: [54, 54],
  shadowUrl: "/robotaxi-shadow.png",
  shadowSize: [54, 54],
  shadowAnchor: [25, 23],
  iconAnchor: [27, 27],
  className: "car-icon",
});

const Map = ({ zoom = defaults.zoom, center, vehicles, onMapClick, onVehicleDelete }: Props) => {
  function MapEvents() {
    useMapEvents({
      click: (e) => {
        if (onMapClick) {
          onMapClick(e.latlng.lat, e.latlng.lng);
        }
        console.log(`Latitude: ${e.latlng.lat}, Longitude: ${e.latlng.lng}`);
      },
    });
    return null;
  }

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <MapEvents />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vehicles.map((vehicle, index) => {
          if (typeof vehicle.coordY !== 'number' || typeof vehicle.coordX !== 'number') {
            return null;
          }
          return (
            <Marker
              key={vehicle.id}
              position={[vehicle.coordY, vehicle.coordX]}
              icon={robotaxiIcon}
              eventHandlers={{
                contextmenu: (e) => {
                  e.originalEvent.preventDefault();
                  e.originalEvent.stopPropagation();
                  if (onVehicleDelete) {
                    console.log('Deleting vehicle:', vehicle.id);
                    onVehicleDelete(vehicle.id);
                  }
                }
              }}
            >
              <Popup>
                Vehicle {index + 1} [{vehicle.id}]
                <br />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onVehicleDelete) {
                      onVehicleDelete(vehicle.id);
                    }
                  }}
                  className="mt-2 rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                >
                  Delete Vehicle
                </button>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;