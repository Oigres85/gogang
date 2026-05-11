import "react-native-url-polyfill/auto";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { supabase } from "./src/lib/supabaseClient";
import MapScreen from "./src/screens/MapScreen";

// ── CSS Mapbox e PWA manifest — iniettati subito, prima del primo render ────
if (typeof document !== "undefined") {
  if (!document.getElementById("mbx-gl-css")) {
    const link = document.createElement("link");
    link.id   = "mbx-gl-css";
    link.rel  = "stylesheet";
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.23.1/mapbox-gl.css";
    document.head.appendChild(link);
  }
  if (!document.querySelector('link[rel="manifest"]')) {
    const m = document.createElement("link");
    m.rel  = "manifest";
    m.href = "/manifest.json";
    document.head.appendChild(m);
  }
}

export default function App() {
  const [userId, setUserId] = useState(null);

  // ── Auth: signInAnonymously al primo avvio ────────────────────────────────
  // Dà all'utente un'identità UUID persistente (salvata in AsyncStorage)
  // senza richiedere email/password.
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) { setUserId(user.id); return; }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data?.user) setUserId(data.user.id);
    };
    init();
  }, []);

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <MapScreen userId={userId} />
    </>
  );
}
