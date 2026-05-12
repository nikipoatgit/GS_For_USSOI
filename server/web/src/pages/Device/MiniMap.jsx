// features/map/MiniMap.jsx
// Leaflet-based mini GPS map. Initialises once; updates position on new telemetry.
// Requires Leaflet to be loaded in the page (window.L).
// Visual style: compact dark overlay aligned with the Device page shell.

import { useRef, useEffect, useState } from "react";
import { C, FONT } from "../../shared/theme.js";

const LEAFLET_CSS_ID = "leaflet-css";
const LEAFLET_SCRIPT_ID = "leaflet-js";
const LEAFLET_CSS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS_URL = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";

let leafletLoadPromise = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadPromise) return leafletLoadPromise;

  if (!document.getElementById(LEAFLET_CSS_ID)) {
    const link = document.createElement("link");
    link.id = LEAFLET_CSS_ID;
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS_URL;
    document.head.appendChild(link);
  }

  leafletLoadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(LEAFLET_SCRIPT_ID);

    if (existing) {
      existing.addEventListener("load", () => resolve(window.L), { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = LEAFLET_SCRIPT_ID;
    script.src = LEAFLET_JS_URL;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return leafletLoadPromise;
}

function hasPosition(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon);
}

const T = {
  primary:          C.blue,
  primaryContainer: "#2c6cd3",
  onPrimary:        "#ffffff",
  surface:          C.surface,
  surfaceDim:       C.lineMd,
  surfaceVariant:   C.raised,
  onSurface:        C.t0,
  onSurfaceVariant: C.t1,
  error:            C.red,
  radius:           18,
  font:             FONT,
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  root: {
    position:      "fixed",
    bottom:        16,
    right:         16,
    zIndex:        60,
    display:       "flex",
    flexDirection: "column",
    alignItems:    "flex-end",
    gap:           12,
    fontFamily:    T.font,
  },
  panel: (visible) => ({
    width:         320,
    height:        256,
    borderRadius:  T.radius,
    overflow:      "hidden",
    border:        `1px solid ${T.surfaceDim}`,
    boxShadow:     "0 18px 46px rgba(0,0,0,0.4)",
    display:       visible ? "block" : "none",
    position:      "relative",
    background:    T.surface,
    transition:    "box-shadow 0.2s ease",
  }),
  mapContainer: {
    width:  "100%",
    height: "100%",
  },
  overlayControls: {
    position:      "absolute",
    bottom:        12,
    right:         12,
    zIndex:        1000,
    display:       "flex",
    flexDirection: "column",
    gap:           8,
  },
  iconBtn: {
    width:           32,
    height:          32,
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    background:      "rgba(13,17,23,0.88)",
    backdropFilter:  "blur(4px)",
    border:          `1px solid ${T.surfaceDim}`,
    borderRadius:    12,
    cursor:          "pointer",
    boxShadow:       "0 8px 18px rgba(0,0,0,0.22)",
    transition:      "background 0.15s, transform 0.1s",
    padding:         0,
    color:           T.onSurfaceVariant,
  },
  toggleBtn: {
    width:           48,
    height:          48,
    display:         "flex",
    alignItems:      "center",
    justifyContent:  "center",
    background:      T.primary,
    color:           T.onPrimary,
    border:          "none",
    borderRadius:    "50%",
    cursor:          "pointer",
    boxShadow:       "0 8px 22px rgba(78,143,239,0.3)",
    transition:      "background 0.15s, box-shadow 0.15s, transform 0.1s",
    padding:         0,
  },
};

// Inline Material Symbol (uses Google Fonts icon font loaded in page)
function Icon({ name, size = 20, color }) {
  return (
      <span
          className="material-symbols-outlined"
          style={{
            fontSize:   size,
            lineHeight: 1,
            color:      color || "inherit",
            userSelect: "none",
            // Fallback text if font isn't loaded
            fontFamily: "'Material Symbols Outlined', monospace",
          }}
      >
      {name}
    </span>
  );
}

// ─── MiniMap ──────────────────────────────────────────────────────────────────
export function MiniMap({ lat, lon, accuracy, visible, onToggle }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const circleRef    = useRef(null);
  const latestPositionRef = useRef({ lat, lon, accuracy });
  const [autoCenter, setAutoCenter] = useState(true);
  const [leafletReady, setLeafletReady] = useState(Boolean(window.L));
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    latestPositionRef.current = { lat, lon, accuracy };
  }, [lat, lon, accuracy]);

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (!cancelled && L) setLeafletReady(true);
      })
      .catch((e) => {
        console.error("[MiniMap] failed to load Leaflet", e);
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Initialise map once after Leaflet is available.
  useEffect(() => {
    if (!leafletReady || !window.L || mapRef.current || !containerRef.current) return;
    const L    = window.L;
    const initialPosition = latestPositionRef.current;
    const hasInitialPosition = hasPosition(initialPosition.lat, initialPosition.lon);
    const iLat = hasInitialPosition ? initialPosition.lat : 20.5937;
    const iLon = hasInitialPosition ? initialPosition.lon : 78.9629;

    const map = L.map(containerRef.current, {
      center:           [iLat, iLon],
      zoom:             16,
      minZoom:          1,
      maxZoom:          22,
      zoomControl:      false,
      attributionControl: false,
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

    const hybrid = L.layerGroup([satellite, labels]);
    hybrid.addTo(map);

    // Keep original layer control for keyboard/a11y
    L.control.layers({
      "Street":    osm,
      "Satellite": satellite,
      "Hybrid":    hybrid,
    }).addTo(map);

    const icon = L.divIcon({
      html: `<div style="
        width:10px;height:10px;
        background:${T.error};
        border:2px solid #fff;
        border-radius:50%;
        box-shadow:0 0 4px rgba(0,0,0,0.3);
      "></div>`,
      className: "",
      iconSize:   [10, 10],
      iconAnchor: [5, 5],
    });

    markerRef.current = L.marker([iLat, iLon], { icon }).addTo(map);
    circleRef.current = L.circle([iLat, iLon], {
      radius:      initialPosition.accuracy || 0,
      color:       T.primary,
      weight:      1,
      fillColor:   T.primary,
      fillOpacity: 0.1,
    }).addTo(map);

    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, [leafletReady]);

  // Update position on new telemetry
  useEffect(() => {
    if (!mapRef.current || !hasPosition(lat, lon)) return;
    const pos = [lat, lon];
    markerRef.current?.setLatLng(pos);
    circleRef.current?.setLatLng(pos);
    circleRef.current?.setRadius(accuracy || 0);
    if (autoCenter) {
      mapRef.current.setView(pos, mapRef.current.getZoom(), { animate: true });
    }
  }, [lat, lon, accuracy, autoCenter]);

  // Invalidate size when panel becomes visible
  useEffect(() => {
    if (visible && mapRef.current) {
      setTimeout(() => mapRef.current?.invalidateSize(), 150);
    }
  }, [visible]);

  // Recenter handler
  const handleRecenter = () => {
    if (!mapRef.current || !hasPosition(lat, lon)) return;
    mapRef.current.setView([lat, lon], 16, { animate: true });
  };

  return (
      <div style={styles.root}>
        {/* Map panel */}
        <div style={styles.panel(visible)}>
          {/* Leaflet map */}
          <div ref={containerRef} style={styles.mapContainer} />

          {loadFailed && (
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                textAlign: "center",
                color: T.onSurfaceVariant,
                background: T.surface,
                fontSize: 12,
                fontWeight: 600,
                zIndex: 900,
              }}>
                Map library failed to load
              </div>
          )}

          {/* Overlay: recenter + layer toggle */}
          <div style={styles.overlayControls}>
            <button
                style={{ ...styles.iconBtn, color: T.primary }}
                onClick={handleRecenter}
                title="Re-center"
                aria-label="Re-center map"
            >
              <Icon name="my_location" size={18} color={T.primary} />
            </button>
            <button
                style={{
                  ...styles.iconBtn,
                  color: autoCenter ? T.primary : T.onSurfaceVariant,
                  background: autoCenter ? "rgba(13,31,58,0.92)" : styles.iconBtn.background,
                }}
                onClick={() => setAutoCenter(v => !v)}
                title={autoCenter ? "Auto center on" : "Auto center off"}
                aria-label={autoCenter ? "Disable auto center" : "Enable auto center"}
            >
              <Icon name={autoCenter ? "near_me" : "near_me_disabled"} size={18} />
            </button>
          </div>
        </div>

        {/* FAB toggle button */}
        <button
            style={styles.toggleBtn}
            onClick={onToggle}
            title={visible ? "Hide map" : "Show map"}
            aria-label={visible ? "Hide map" : "Show map"}
            onMouseEnter={e => {
              e.currentTarget.style.background = T.primaryContainer;
              e.currentTarget.style.boxShadow  = "0 10px 28px rgba(78,143,239,0.4)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = T.primary;
              e.currentTarget.style.boxShadow  = "0 8px 22px rgba(78,143,239,0.3)";
            }}
        >
          <Icon name={visible ? "map" : "location_on"} size={24} color={T.onPrimary} />
        </button>
      </div>
  );
}
