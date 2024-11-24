"use client";

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import { LatLngExpression, LatLngTuple, Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import type Vehicle from "~/types/Vehicle";
import type Customer from "~/types/Customer";

// Fix for Leaflet default icon issue
import { CSSProperties } from "react";
const mapStyle: CSSProperties = {
  height: "100%",
  width: "100%",
  position: "relative",
  zIndex: 0
};

interface Props {
  center: LatLngExpression | LatLngTuple;
  zoom?: number;
  vehicles: Vehicle[];
  customers: Customer[];
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

const robotaxiWithPersonIcon = new Icon({
  iconUrl: "/robotaxi_with_person.png",
  iconSize: [54, 54],
  shadowUrl: "/robotaxi-shadow.png",
  shadowSize: [54, 54],
  shadowAnchor: [25, 23],
  iconAnchor: [27, 27],
  className: "car-icon",
});

const customerIcon = new Icon({
  iconUrl: "/person.png",
  iconSize: [15,38],
  iconAnchor: [8, 19],
  className: "customer-icon",
});

const getVehicleIcon = (vehicle: Vehicle, hasCustomer: boolean) => {
  const baseIcon = hasCustomer ? robotaxiWithPersonIcon : robotaxiIcon;
  return new Icon({
    ...baseIcon.options,
    className: `car-icon ${vehicle.targetX && vehicle.targetX > vehicle.coordX ? 'scale-x-[-1]' : ''}`
  });
};

const Map = ({ zoom = defaults.zoom, center, vehicles, customers, onMapClick, onVehicleDelete }: Props) => {
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

  console.log(vehicles, customers);

  const vehicleContainsCustomer = (vehicle: Vehicle) => {
    console.log(vehicle.customerId, customers);
    return !!vehicle.customerId && customers.some(customer => customer.id === vehicle.customerId && customer.coordX === vehicle.coordX && customer.coordY === vehicle.coordY);
  };

  const customerIsInVehicle = (customer: Customer) => {
    return vehicles.some(vehicle => vehicle.customerId === customer.id && vehicle.coordX === customer.coordX && vehicle.coordY === customer.coordY);
  };

  return (
    <div style={{ height: "500px", width: "100%" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={mapStyle}
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
              position={[vehicle.realtimeX ?? vehicle.coordX, vehicle.realtimeY ?? vehicle.coordY]}
              icon={getVehicleIcon(vehicle, vehicleContainsCustomer(vehicle))}
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
                >Delete Vehicle</button>
              </Popup>
            </Marker>
          );
        })}

      {customers.map((customer, index) => {
          if (typeof customer.coordY !== 'number' || typeof customer.coordX !== 'number' || customerIsInVehicle(customer) || customer.awaitingService === false) {
            return null;
          }
          return (
            <Marker
              key={customer.id}
              position={[customer.coordX, customer.coordY]}
              icon={customerIcon}
              eventHandlers={{
                contextmenu: (e) => {
                  e.originalEvent.preventDefault();
                  e.originalEvent.stopPropagation();
                  if (onVehicleDelete) {
                    console.log('Deleting vehicle:', customer.id);
                    onVehicleDelete(customer.id);
                  }
                }
              }}
            >
              <Popup>
                Customer {index + 1} [{customer.id}]
                <br />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onVehicleDelete) {
                      onVehicleDelete(customer.id);
                    }
                  }}
                  className="mt-2 rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                >Delete Vehicle</button>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default Map;