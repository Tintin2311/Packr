// screens/CollectionScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
export default function CollectionScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Ma collection</Text>
      <Text style={styles.sub}>Tes cartes sauvegardées s’affichent ici.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0a0f14", padding: 16 },
  title: { color: "#fff", fontWeight: "700", fontSize: 18, marginBottom: 8 },
  sub: { color: "rgba(255,255,255,0.7)" },
});
