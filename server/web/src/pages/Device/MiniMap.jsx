// features/map/MiniMap.jsx
// Leaflet-based mini GPS map. Initialises once; updates position on new telemetry.
// Requires Leaflet to be loaded in the page (window.L).

import { useRef, useEffect } from "react";
import { C } from "../../shared/theme.js";

export function MiniMap({ lat, lon, accuracy, visible, onToggle }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const circleRef    = useRef(null);

  // Initialise map once (no deps — intentional)
  useEffect(() => {
    if (!window.L || mapRef.current || !containerRef.current) return;
    const L    = window.L;
    const iLat = lat || 20.5937;
    const iLon = lon || 78.9629;

    const map = L.map(containerRef.current, {
      center: [iLat, iLon], zoom: 16, minZoom: 1, maxZoom: 22, zoomControl: false,
    });

    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 22 }
    );
    const labels = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 22 }
    );
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 });

    L.layerGroup([satellite, labels]).addTo(map);
    L.control.layers({
      "Street":   osm,
      "Satellite": satellite,
      "Hybrid":   L.layerGroup([satellite, labels]),
    }).addTo(map);

    const icon = L.divIcon({
      html: `<div style="width:8px;height:8px;background:${C.red};border:2px solid #fff;border-radius:50%;"></div>`,
      className: "", iconSize: [8, 8], iconAnchor: [4, 4],
    });
    markerRef.current = L.marker([iLat, iLon], { icon }).addTo(map);
    circleRef.current = L.circle([iLat, iLon], {
      radius: accuracy || 0, color: C.blue, weight: 1, fillColor: C.blue, fillOpacity: 0.12,
    }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);
  }, []); // eslint-disable-line

  // Update position on new telemetry
  useEffect(() => {
    if (!mapRef.current || lat == null || lon == null) return;
    const pos = [lat, lon];
    markerRef.current?.setLatLng(pos);
    circleRef.current?.setLatLng(pos);
    circleRef.current?.setRadius(accuracy || 0);
    mapRef.current.setView(pos, mapRef.current.getZoom(), { animate: true });
  }, [lat, lon, accuracy]);

  // Invalidate size when panel becomes visible
  useEffect(() => {
    if (visible && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 150);
    }
  }, [visible]);

  return (
    <div style={{
      position: "fixed", bottom: 16, right: 16, zIndex: 60,
      display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5,
    }}>
      <div ref={containerRef} style={{
        width: 300, height: 190, borderRadius: C.r, overflow: "hidden",
        border: `1px solid ${C.line}`, display: visible ? "block" : "none",
      }}/>
      <MapToggle onClick={onToggle}/>
    </div>
  );
}

function MapToggle({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background:    "rgba(13,17,23,0.9)",
      border:        `1px solid ${C.line}`,
      borderRadius:  C.r,
      width:         32, height: 32,
      color:         C.t2,
      cursor:        "pointer",
      fontSize:      13,
      display:       "flex",
      alignItems:    "center",
      justifyContent:"center",
    }}>◎</button>
  );
}
