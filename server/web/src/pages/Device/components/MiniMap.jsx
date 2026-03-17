// ─── MiniMap ──────────────────────────────────────────────────────────────────
// Floating Leaflet map anchored to the bottom-right of the screen.
// Requires Leaflet CSS in the HTML head.

import { useRef, useEffect } from "react";

export function MiniMap({ lat, lon, accuracy, visible, onToggle }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const circleRef    = useRef(null);

  // ── Init Leaflet map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!window.L || mapRef.current) return;
    const L = window.L;

    console.log("[Map] initialising Leaflet map");
    const map = L.map(containerRef.current, {
      center:      [lat || 20.5937, lon || 78.9629], // default: India
      zoom:        16,
      minZoom:     1,
      maxZoom:     22,
      zoomControl: false,
    });

    // Satellite + labels hybrid layer
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 22 }
    );
    const labels = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      { maxZoom: 22 }
    );
    const osm = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { maxZoom: 19 }
    );

    const hybrid = L.layerGroup([satellite, labels]);
    hybrid.addTo(map);

    L.control.layers({
      "Street": osm,
      "Satellite": satellite,
      "Hybrid":   hybrid,
    }).addTo(map);

    // Marker using a small SVG pin
    const icon = L.divIcon({
      html:       `<div style="width:10px;height:10px;background:#f85149;border:2px solid #fff;border-radius:50%;"></div>`,
      className:  "",
      iconSize:   [10, 10],
      iconAnchor: [5, 5],
    });

    markerRef.current = L.marker([lat || 0, lon || 0], { icon }).addTo(map);
    circleRef.current = L.circle([lat || 0, lon || 0], {
      radius:      accuracy || 0,
      color:       "#1f6feb",
      weight:      1,
      fillColor:   "#1f6feb",
      fillOpacity: 0.15,
    }).addTo(map);

    mapRef.current = map;
  }, []);

  // ── Update marker on telemetry change ─────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !lat) return;
    console.log(`[Map] update → lat=${lat.toFixed(5)} lon=${lon.toFixed(5)} acc=${accuracy}`);
    const pos = [lat, lon];
    markerRef.current?.setLatLng(pos);
    circleRef.current?.setLatLng(pos);
    circleRef.current?.setRadius(accuracy || 0);
    mapRef.current.setView(pos, 16, { animate: true });
  }, [lat, lon, accuracy]);

  // ── Invalidate size when shown ─────────────────────────────────────────────
  useEffect(() => {
    if (visible && mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 150);
    }
  }, [visible]);

  return (
    <div
      style={{
        position:      "fixed",
        bottom:        16,
        right:         16,
        zIndex:        60,
        display:       "flex",
        flexDirection: "column",
        alignItems:    "flex-end",
        gap:           6,
      }}
    >
      {/* Map container */}
      <div
        ref={containerRef}
        style={{
          width:        310,
          height:       200,
          borderRadius: 3,
          overflow:     "hidden",
          border:       "1px solid #21262d",
          display:      visible ? "block" : "none",
        }}
      />

      {/* Toggle button */}
      <button
        onClick={onToggle}
        title="Toggle Map"
        style={{
          background:   "rgba(13,17,23,0.9)",
          border:       "1px solid #30363d",
          borderRadius: 3,
          width:        34,
          height:       34,
          color:        "#8b949e",
          cursor:       "pointer",
          fontSize:     14,
          display:      "flex",
          alignItems:   "center",
          justifyContent: "center",
          transition:   "color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#e6edf3")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#8b949e")}
      >
        ◎
      </button>
    </div>
  );
}
