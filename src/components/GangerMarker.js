import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLOR = "#ff2d87";

export default function GangerMarker() {
  return (
    <View style={styles.container}>
      <View style={styles.pulse} />
      <View style={styles.iconWrapper}>
        <Ionicons name="person" size={16} color="#fff" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    cursor: "default",
  },
  pulse: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLOR,
    opacity: 0.2,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLOR,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: COLOR,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
});
