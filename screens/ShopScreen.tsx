// screens/ShopScreen.tsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ShopScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.txt}>Bonjour depuis Shop 👋</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0f14" },
  txt: { color: "#fff", fontSize: 22, fontWeight: "700" },
});
