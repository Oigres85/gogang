import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useGogangRealtime } from "../hooks/useGogangRealtime";

const MAPBOX_TOKEN   = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
const MAPBOX_VERSION = "3.23.1";
const CDN            = `https://api.mapbox.com/mapbox-gl-js/v${MAPBOX_VERSION}`;
const PULSE_COOLDOWN = 30_000; // 30 secondi tra un GO LIVE e il successivo

// ── Carica mapbox-gl dal CDN (una sola volta, evita Metro bundling) ──────────
let _mbxPromise = null;
function loadMapboxGL() {
  if (_mbxPromise) return _mbxPromise;
  _mbxPromise = new Promise((resolve, reject) => {
    if (window.mapboxgl) { resolve(window.mapboxgl); return; }
    const script = document.createElement("script");
    script.src     = `${CDN}/mapbox-gl.js`;
    script.onload  = () => resolve(window.mapboxgl);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return _mbxPromise;
}

// ── Avatar SVG stile Roblox/gaming ─────────────────────────────────────────
function makeAvatarEl(color) {
  const el = document.createElement("div");
  el.style.cssText = `
    width:38px; height:46px; cursor:default;
    filter: drop-shadow(0 0 9px ${color}cc);
  `;
  el.innerHTML = `
    <svg width="38" height="46" viewBox="0 0 38 46" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="19" cy="20" rx="20" ry="20" fill="${color}" opacity="0.14"/>
      <rect x="5"  y="1"  width="28" height="30" rx="5" fill="${color}"/>
      <rect x="7"  y="3"  width="24" height="12" rx="4" fill="white" opacity="0.2"/>
      <rect x="9"  y="9"  width="7"  height="9"  rx="2.5" fill="white"/>
      <rect x="22" y="9"  width="7"  height="9"  rx="2.5" fill="white"/>
      <rect x="11" y="11" width="3"  height="5"  rx="1.5" fill="#111"/>
      <rect x="24" y="11" width="3"  height="5"  rx="1.5" fill="#111"/>
      <rect x="11" y="23" width="16" height="5"  rx="2.5" fill="white" opacity="0.88"/>
      <rect x="8"  y="33" width="22" height="12" rx="4" fill="${color}" opacity="0.72"/>
      <rect x="8"  y="38" width="22" height="2"  fill="white" opacity="0.18"/>
    </svg>`;
  return el;
}

// ── Animazione GO LIVE (3 anelli sonar) ─────────────────────────────────────
let _pulseCSS = false;
function injectPulseCSS() {
  if (_pulseCSS) return;
  _pulseCSS = true;
  const s = document.createElement("style");
  s.textContent = `
    @keyframes gg-ring {
      0%   { width:0;     height:0;     margin:0;      border-width:5px; opacity:.95; }
      100% { width:280px; height:280px; margin:-140px; border-width:1px; opacity:0;  }
    }
    .gg-ring {
      position:absolute; border-radius:50%;
      animation: gg-ring 1.6s cubic-bezier(.2,.8,.4,1) forwards;
      pointer-events:none;
    }`;
  document.head.appendChild(s);
}

function addPulseToMap(map, lng, lat, color = "#00ffe7") {
  injectPulseCSS();
  const markers = [0, 1, 2].map(i => {
    const ring = document.createElement("div");
    ring.className  = "gg-ring";
    ring.style.cssText = `border:3px solid ${color}; animation-delay:${i * 0.45}s;`;
    const wrap = document.createElement("div");
    wrap.style.cssText = "position:relative;width:0;height:0;overflow:visible;";
    wrap.appendChild(ring);
    return new window.mapboxgl.Marker({ element: wrap, anchor: "center" })
      .setLngLat([lng, lat])
      .addTo(map);
  });
  setTimeout(() => markers.forEach(m => m.remove()), 5_200);
}

// ── Componente ───────────────────────────────────────────────────────────────
export default function MapScreen({ userId }) {
  const divRef      = useRef(null);
  const mapRef      = useRef(null);
  const selfMarker  = useRef(null);
  const gangerMkrs  = useRef({});
  const lastPulse   = useRef(0);

  const [userCoords, setUserCoords] = useState(null);
  const [gpsError,   setGpsError]   = useState(false);
  const [mapReady,   setMapReady]   = useState(false);
  const [pulsing,    setPulsing]    = useState(false); // feedback visivo GO LIVE

  // Callback stabile passato al hook — riceve pulse dagli altri Ganger
  const onPulse = useCallback((lat, lng, color) => {
    if (!mapRef.current || !window.mapboxgl) return;
    addPulseToMap(mapRef.current, lng, lat, color);
  }, []);

  const { gangers, sendPulse } = useGogangRealtime(userCoords, userId, onPulse);

  // ── Init mappa ──────────────────────────────────────────────────────────
  useEffect(() => {
    let destroyed = false;
    loadMapboxGL()
      .then(mapboxgl => {
        if (destroyed || mapRef.current || !divRef.current) return;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const m = new mapboxgl.Map({
          container: divRef.current,
          style:     "mapbox://styles/mapbox/dark-v11",
          center:    [12.4964, 41.9028],
          zoom:      5,
          attributionControl: false,
        });
        m.addControl(new mapboxgl.NavigationControl(),   "bottom-right");
        m.addControl(new mapboxgl.GeolocateControl({
          positionOptions:   { enableHighAccuracy: true },
          trackUserLocation: true,
          showUserHeading:   true,
        }), "bottom-right");
        m.on("load", () => { if (!destroyed) setMapReady(true); });
        mapRef.current = m;
      })
      .catch(err => console.error("Mapbox load error:", err));

    return () => { destroyed = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // ── GPS ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator?.geolocation) { setGpsError(true); return; }
    let first = true;
    const id = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const c = { latitude: coords.latitude, longitude: coords.longitude };
        setUserCoords(c);
        if (first && mapRef.current) {
          mapRef.current.flyTo({ center: [c.longitude, c.latitude], zoom: 15 });
          first = false;
        }
      },
      () => setGpsError(true),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ── Marker — utente corrente ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !userCoords || !window.mapboxgl) return;
    const [lng, lat] = [userCoords.longitude, userCoords.latitude];
    if (selfMarker.current) {
      selfMarker.current.setLngLat([lng, lat]);
    } else {
      selfMarker.current = new window.mapboxgl.Marker({ element: makeAvatarEl("#00ffe7"), anchor: "bottom" })
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    }
  }, [userCoords, mapReady]);

  // ── Marker — altri Ganger ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !window.mapboxgl) return;
    const live = new Set(gangers.map(g => g.user_id));

    Object.keys(gangerMkrs.current).forEach(id => {
      if (!live.has(id)) { gangerMkrs.current[id].remove(); delete gangerMkrs.current[id]; }
    });
    gangers.forEach(g => {
      if (gangerMkrs.current[g.user_id]) {
        gangerMkrs.current[g.user_id].setLngLat([g.lng, g.lat]);
      } else {
        gangerMkrs.current[g.user_id] = new window.mapboxgl.Marker({ element: makeAvatarEl("#ff2d87"), anchor: "bottom" })
          .setLngLat([g.lng, g.lat])
          .addTo(mapRef.current);
      }
    });
  }, [gangers, mapReady]);

  // ── GO LIVE handler ──────────────────────────────────────────────────────
  const handleGoLive = useCallback(() => {
    const now = Date.now();
    if (now - lastPulse.current < PULSE_COOLDOWN) return;
    lastPulse.current = now;
    setPulsing(true);
    sendPulse();
    setTimeout(() => setPulsing(false), PULSE_COOLDOWN);
  }, [sendPulse]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* Canvas mappa — <div> nativo per mapbox-gl */}
      <div ref={divRef} style={styles.mapDiv} />

      {/* HUD */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.title}>GOGANG</Text>
        <Text style={styles.online}>
          ONLINE <Text style={styles.onlineCount}>{gangers.length + (userId ? 1 : 0)}</Text>
        </Text>
        {userCoords && (
          <Text style={styles.coords}>
            {userCoords.latitude.toFixed(5)}, {userCoords.longitude.toFixed(5)}
          </Text>
        )}
      </View>

      {/* ── GO LIVE button ── */}
      <TouchableOpacity
        style={[styles.goLiveBtn, pulsing && styles.goLiveBtnActive]}
        onPress={handleGoLive}
        activeOpacity={0.75}
      >
        <Text style={styles.goLiveIcon}>{pulsing ? "📡" : "⚡"}</Text>
        <Text style={styles.goLiveTxt}>{pulsing ? "IN ONDA" : "GO LIVE"}</Text>
      </TouchableOpacity>

      {/* Banner GPS */}
      {gpsError && (
        <View style={styles.errorBanner} pointerEvents="none">
          <Text style={styles.errorText}>
            Abilita la geolocalizzazione nel browser per apparire sulla mappa.
          </Text>
        </View>
      )}

      {/* Legenda */}
      <View style={styles.legend} pointerEvents="none">
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: "#00ffe7" }]} />
          <Text style={styles.legendLabel}>TU</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: "#ff2d87" }]} />
          <Text style={styles.legendLabel}>
            GANGER{gangers.length > 0 ? ` ×${gangers.length}` : ""}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100vw", height: "100vh",
    overflow: "hidden", backgroundColor: "#0a0a1a", position: "relative",
  },
  mapDiv: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    width: "100%", height: "100%",
  },

  hud: {
    position: "absolute", top: 20, left: 0, right: 0,
    alignItems: "center", zIndex: 10, pointerEvents: "none",
  },
  title: {
    color: "#00ffe7", fontSize: 24, fontWeight: "900", letterSpacing: 8,
    textShadow: "0 0 16px #00ffe7",
  },
  online:      { color: "#ffffff70", fontSize: 11, letterSpacing: 2, marginTop: 4 },
  onlineCount: { color: "#00ffe7", fontWeight: "700" },
  coords:      { color: "#ffffff25", fontSize: 9, letterSpacing: 1, marginTop: 2 },

  // GO LIVE
  goLiveBtn: {
    position: "absolute", bottom: 48, left: 20,
    zIndex: 20,
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#0a0a1a", borderRadius: 28,
    paddingVertical: 14, paddingHorizontal: 22,
    borderWidth: 2, borderColor: "#00ffe7",
    shadowColor: "#00ffe7", shadowOpacity: 0.6,
    shadowRadius: 12, shadowOffset: { width: 0, height: 0 },
  },
  goLiveBtnActive: {
    borderColor: "#ff2d87",
    shadowColor: "#ff2d87",
    backgroundColor: "#1a0010",
  },
  goLiveIcon: { fontSize: 18 },
  goLiveTxt: {
    color: "#00ffe7", fontSize: 13, fontWeight: "800", letterSpacing: 3,
  },

  errorBanner: {
    position: "absolute", bottom: 120, left: 16, right: 16, zIndex: 20,
    backgroundColor: "#ff2d8799", borderRadius: 8,
    padding: 12, alignItems: "center", pointerEvents: "none",
  },
  errorText: { color: "#fff", fontSize: 13 },

  legend: {
    position: "absolute", bottom: 48, right: 16, zIndex: 10,
    backgroundColor: "#0a0a1acc", borderRadius: 10,
    paddingVertical: 8, paddingHorizontal: 12, gap: 6,
    borderWidth: 1, borderColor: "#ffffff15", pointerEvents: "none",
  },
  legendRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  dot:         { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: "#ffffffa0", fontSize: 10, letterSpacing: 1, fontWeight: "600" },
});
