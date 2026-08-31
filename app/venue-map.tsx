"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Venue } from "@/lib/venue-engine";
import { scoreTier, workFitLabel } from "@/lib/work-fit";

type VenueMapProps = {
  venues: Venue[];
  center: { lat: number; lng: number };
  onSelect: (venueId: string) => void;
};

function FitVenues({
  venues,
  center,
}: {
  venues: Venue[];
  center: { lat: number; lng: number };
}) {
  const map = useMap();

  useEffect(() => {
    if (venues.length === 0) {
      map.setView([center.lat, center.lng], 14);
      return;
    }
    const bounds = L.latLngBounds(venues.map((v) => [v.lat, v.lng]));
    map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
  }, [map, venues, center.lat, center.lng]);

  return null;
}

function pinIcon(score: number) {
  return L.divIcon({
    className: `work-fit-pin work-fit-pin--${scoreTier(score)}`,
    html: `<div class="work-fit-pin-inner" aria-hidden="true"><strong>${score}</strong><span>Work Fit</span></div>`,
    iconSize: [52, 40],
    iconAnchor: [26, 40],
  });
}

export default function VenueMap({ venues, center, onSelect }: VenueMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      className="venue-map-canvas"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitVenues venues={venues} center={center} />
      {venues.map((venue) => (
        <Marker
          key={venue.id}
          position={[venue.lat, venue.lng]}
          icon={pinIcon(venue.workScore)}
          eventHandlers={{
            click: () => onSelect(venue.id),
          }}
          title={`${venue.name}, ${workFitLabel(venue.workScore)}`}
        />
      ))}
    </MapContainer>
  );
}
