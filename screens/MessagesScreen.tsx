// screens/MessagesScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MessagesScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Bonjour depuis Messages 👋</Text>
      <Text style={styles.sub}>Retrouve tes matchs et conversations ici.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0f14", padding: 16 },
  title: { color: "#fff", fontWeight: "800", fontSize: 20, marginBottom: 8 },
  sub: { color: "rgba(255,255,255,0.7)" },
});
