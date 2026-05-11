# GOGANG — Setup Guide

## 1. Installa le dipendenze
```bash
npm install
```

## 2. Configura l'ambiente
Il file `.env` è già popolato con le chiavi dal progetto Supabase `pgkhxeazcoihyxtiqldr`.

## 3. Supabase — Esegui la migrazione SQL
Vai su **Supabase Dashboard → SQL Editor** ed esegui:
```
supabase/migrations/001_locations.sql
```

## 4. Prebuild (richiesto da @rnmapbox/maps)
`@rnmapbox/maps` è un modulo nativo — non gira su Expo Go.
Devi fare il prebuild per generare le cartelle `ios/` e `android/`:
```bash
npx expo prebuild
```

## 5. Avvia su iOS Simulator
```bash
npx expo run:ios
```

## 5b. Avvia su Android Emulator
```bash
npx expo run:android
```

## Note importanti
- Il **Mapbox Download Token** in `app.config.js` serve per scaricare gli SDK nativi durante il prebuild.
  Assicurati che il token `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` abbia lo scope `DOWNLOADS:READ` nelle impostazioni Mapbox.
- Per il Social Layer (Fase 2), aggiornare la RLS policy `locations_read_others` e aggiungere
  la subscription Supabase Realtime su `MapScreen.js`.
