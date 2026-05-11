# Progetto: GOGANG
## Visione
Un "Social Map Game" per ragazzi (10-14 anni). Non è una semplice mappa, è un mondo virtuale sovrapposto alla realtà dove gli utenti sono Avatar 3D (stile Roblox/Minecraft) che si muovono in tempo reale.

## Stack Tecnologico
- **Frontend:** React Native (Expo)
- **Mappe:** Mapbox (per stile gaming personalizzato)
- **Backend/Database:** Supabase (Realtime Enabled)
- **Auth:** Supabase Auth

## Credenziali & Endpoint (Environment)
- **Supabase URL:** https://pgkhxeazcoihyxtiqldr.supabase.co
- **Supabase Anon Key:** [INSERISCI_TUA_ANON_KEY]
- **Mapbox Token:** [EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN in .env]

## Roadmap Operativa (Fase 1: MVP)
1. **Setup Expo:** Inizializzazione progetto con gestione variabili d'ambiente.
2. **Mappa Reale:** Integrazione Mapbox con uno stile "Dark/Gaming".
3. **Real-time Engine:** Tracking della posizione GPS e invio a Supabase ogni 10-15 secondi.
4. **Social Layer:** Visualizzazione degli altri utenti connessi sulla mappa come Marker personalizzati.
5. **Ghost Mode:** Funzionalità di privacy immediata.