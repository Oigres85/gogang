import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const UPSERT_INTERVAL = 10_000;       // 10 secondi
const STALE_MS        = 10 * 60_000;  // 10 minuti → auto-cleanup

/**
 * @param {object|null} userCoords - { latitude, longitude }
 * @param {string|null} userId     - UUID Supabase Auth
 * @param {function}    onPulse    - callback(lat, lng) quando arriva un GO LIVE
 * @returns {{ gangers: Array, sendPulse: function }}
 */
export function useGogangRealtime(userCoords, userId, onPulse) {
  const [gangers, setGangers] = useState([]);
  const coordsRef     = useRef(userCoords);
  const onPulseRef    = useRef(onPulse);
  const pulseChRef    = useRef(null);

  // Mantieni ref sempre aggiornate senza ricreare effetti
  useEffect(() => { coordsRef.current  = userCoords; }, [userCoords]);
  useEffect(() => { onPulseRef.current = onPulse;    }, [onPulse]);

  // ── 1. Upsert posizione ogni 10s ─────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const push = async () => {
      const c = coordsRef.current;
      if (!c) return;
      await supabase.from("locations").upsert(
        { user_id: userId, lat: c.latitude, lng: c.longitude, last_seen: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    };

    push();
    const t = setInterval(push, UPSERT_INTERVAL);
    return () => clearInterval(t);
  }, [userId]);

  // ── 2. Auto-cleanup locale ogni 30s ──────────────────────────────────────
  // Rimuove dalla UI i Ganger il cui last_seen supera 10 minuti,
  // indipendentemente da eventuali eventi Realtime mancanti.
  useEffect(() => {
    const t = setInterval(() => {
      const cutoff = Date.now() - STALE_MS;
      setGangers(prev => prev.filter(g => new Date(g.last_seen).getTime() > cutoff));
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  // ── 3. Fetch iniziale (solo record freschi) + Realtime ───────────────────
  useEffect(() => {
    if (!userId) return;

    const localMap = new Map();
    const apply    = () => setGangers(Array.from(localMap.values()));
    const cutoffISO = () => new Date(Date.now() - STALE_MS).toISOString();

    // Solo utenti attivi negli ultimi 10 minuti
    supabase
      .from("locations")
      .select("*")
      .neq("user_id", userId)
      .gt("last_seen", cutoffISO())
      .then(({ data }) => {
        if (!data) return;
        data.forEach(r => localMap.set(r.user_id, r));
        apply();
      });

    const channel = supabase
      .channel("gogang-locations")
      .on("postgres_changes", { event: "*", schema: "public", table: "locations" },
        ({ eventType, new: n, old: o }) => {
          const id = n?.user_id ?? o?.user_id;
          if (id === userId) return;

          if (eventType === "DELETE") {
            localMap.delete(o.user_id);
          } else {
            // Ignora aggiornamenti stale in realtime
            new Date(n.last_seen).getTime() > Date.now() - STALE_MS
              ? localMap.set(n.user_id, n)
              : localMap.delete(n.user_id);
          }
          apply();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  // ── 4. Canale broadcast GO LIVE ───────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const ch = supabase
      .channel("gogang-pulses", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "pulse" }, ({ payload }) => {
        onPulseRef.current?.(payload.lat, payload.lng, "#ff2d87");
      })
      .subscribe();

    pulseChRef.current = ch;
    return () => {
      supabase.removeChannel(ch);
      pulseChRef.current = null;
    };
  }, [userId]);

  // ── sendPulse (chiamato da GO LIVE) ──────────────────────────────────────
  const sendPulse = useCallback(() => {
    const c = coordsRef.current;
    if (!c || !pulseChRef.current) return;

    pulseChRef.current.send({
      type: "broadcast",
      event: "pulse",
      payload: { user_id: userId, lat: c.latitude, lng: c.longitude },
    });

    // Mostra subito il pulse anche sulla propria mappa
    onPulseRef.current?.(c.latitude, c.longitude, "#00ffe7");
  }, [userId]);

  return { gangers, sendPulse };
}
