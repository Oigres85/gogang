export default {
  expo: {
    name: "GOGANG",
    slug: "gogang",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a1a",
    },
    plugins: [
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission:
            "GOGANG usa la tua posizione per mostrarti sulla mappa con gli altri giocatori.",
        },
      ],
    ],
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/favicon.png",
      // PWA manifest fields
      name: "GOGANG",
      shortName: "GOGANG",
      description: "Social Map Game — trova i tuoi amici sulla mappa in tempo reale.",
      lang: "it",
      themeColor: "#00ffe7",
      backgroundColor: "#0a0a1a",
      display: "standalone",
      orientation: "portrait",
      startUrl: "/",
      scope: "/",
    },
  },
};
