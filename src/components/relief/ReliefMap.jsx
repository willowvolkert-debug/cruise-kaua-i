import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getIslandMap } from "@/lib/island";

const ISLAND = getIslandMap();

const pinIcon = (color) =>
  L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.5)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

export const NEED_ICON = pinIcon("#dc2626");
export const RESOURCE_ICON = pinIcon("#2563eb");

function FixSize() {
  const map = useMap();
  useEffect(() => {
    const t = [100, 400, 1000].map((ms) => setTimeout(() => map.invalidateSize(), ms));
    return () => t.forEach(clearTimeout);
  }, [map]);
  return null;
}

function ClickHandler({ onClick }) {
  useMapEvents({ click: (e) => onClick && onClick([e.latlng.lat, e.latlng.lng]) });
  return null;
}

export default function ReliefMap({ posts = [], onSelect, onPick, picked, center = ISLAND.center, zoom = ISLAND.zoom, className = "h-80" }) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom dragging={!L.Browser.mobile} tap={false} className={`w-full rounded-2xl z-0 ${className}`}>
      <TileLayer
        attribution='Tiles &copy; Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
        maxZoom={18}
      />
      <FixSize />
      {onPick && <ClickHandler onClick={onPick} />}
      {picked && <Marker position={picked} icon={NEED_ICON} />}
      {posts.map((p) => (
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={p.kind === "need" ? NEED_ICON : RESOURCE_ICON}
          eventHandlers={{ click: () => onSelect && onSelect(p) }}
        />
      ))}
    </MapContainer>
  );
}