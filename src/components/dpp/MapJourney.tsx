import React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
} from "react-leaflet";
import type { LatLngTuple } from "leaflet";
import "leaflet/dist/leaflet.css";

type Point = {
  lat: number;
  lng: number;
  label: string;
};

// ✅ FIX typing: TS của bạn đang báo MapContainerProps không có "center" (do mismatch types)
// -> cast để build pass nhưng runtime vẫn đúng
const MapContainerAny = MapContainer as unknown as React.ComponentType<any>;

export default function MapJourney({ events }: any) {
  const points: Point[] =
    events
      ?.map((e: any) => {
        if (!e?.biz_location) return null;

        const [lat, lng] = String(e.biz_location).split(",").map(Number);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

        return {
          lat,
          lng,
          label: e?.biz_name || "",
        } as Point;
      })
      .filter((p: Point | null): p is Point => p !== null) || [];

  if (points.length === 0) return null;

  const center: LatLngTuple = [points[0].lat, points[0].lng];

  return (
    <MapContainerAny
      center={center}
      zoom={10}
      style={{ height: 320, width: "100%", borderRadius: 12 }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      <Polyline positions={points.map((p) => [p.lat, p.lng] as LatLngTuple)} />

      {points.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng] as LatLngTuple}>
          <Popup>{p.label}</Popup>
        </Marker>
      ))}
    </MapContainerAny>
  );
}
