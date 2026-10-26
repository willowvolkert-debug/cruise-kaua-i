import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getHazardType } from "./hazardTypes";

const KAUAI_CENTER = [22.05, -159.5];

const emojiIcon = (emoji, color, ring) =>
  L.divIcon({
    className: "",
    html: `<div style="width:36px;height:36px;border-radius:50%;background:#fff;border:3px solid ${color};box-shadow:0 2px 6px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font-size:18px;${ring ? "outline:3px solid #000;" : ""}">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const pickedIcon = L.divIcon({
  className: "",
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.3)"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapBits({ onPick, flyTo }) {
  const map = useMap();
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
  useEffect(() => {
    const t = [100, 400, 1000].map((ms) => setTimeout(() => map.invalidateSize(), ms));
    return () => t.forEach(clearTimeout);
  }, [map]);
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, 14);
  }, [flyTo, map]);
  return null;
}

export default function HazardMap({ reports, selectedId, onSelect, onPick, picked, flyTo }) {
  return (
    <MapContainer center={KAUAI_CENTER} zoom={10} scrollWheelZoom dragging={!L.Browser.mobile} tap={false} className="w-full h-80 sm:h-96 rounded-2xl z-0">
      <TileLayer
        attribution="Tiles &copy; Esri"
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={18}
      />
      <MapBits onPick={onPick} flyTo={flyTo} />
      {picked && <Marker position={picked} icon={pickedIcon} />}
      {reports.map((r) => {
        const t = getHazardType(r.type);
        return (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={emojiIcon(t.emoji, t.color, r.id === selectedId)}
            eventHandlers={{ click: () => onSelect(r) }}
          />
        );
      })}
    </MapContainer>
  );
}