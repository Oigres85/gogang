import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLOR = "#00ffe7";

export default function UserMarker() {
  return (
    <View style={styles.container}>
      <View style={styles.pulse} />
      <View
        style={styles.iconWrapper}
        // boxShadow funziona su web via react-native-web
        // @ts-ignore
        dataSet={{ marker: "user" }}
      >
        <Ionicons name="person" size={18} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 48,
    cursor: "default",
  },
  pulse: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLOR,
    opacity: 0.25,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLOR,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    // Expo web traduce shadowColor/shadowRadius in box-shadow
    shadowColor: COLOR,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
