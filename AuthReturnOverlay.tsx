// AuthReturnOverlay.tsx
import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated, Easing } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Props = {
  visible: boolean;
  gradient: [string, string];
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  subtitle?: string;
};

export default function AuthReturnOverlay({
  visible,
  gradient,
  onCancel,
  onConfirm,
  title = "Retour à l’accueil ?",
  subtitle = "Tu vas quitter ce formulaire.",
}: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    spin.setValue(0);
    const anim = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [visible, spin]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.card,
          { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }, { scale: 1.05 }] },
        ]}
      >
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card} />
      </Animated.View>

      <View style={styles.panel}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        <View style={styles.row}>
          <Pressable onPress={onCancel} style={[styles.btn, { backgroundColor: "rgba(255,255,255,0.10)" }]}>
            <Text style={styles.btnTxt}>Rester</Text>
          </Pressable>
          <Pressable onPress={onConfirm} style={[styles.btn, { backgroundColor: "#ef4444" }]}>
            <Text style={styles.btnTxt}>Retour à l’accueil</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const CARD_W = 180;
const CARD_H = 240;

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 20 },
  card: { width: CARD_W, height: CARD_H, borderRadius: 16 },
  panel: { marginTop: 16, width: 340, maxWidth: "96%", backgroundColor: "rgba(11, 15, 25, 0.9)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", padding: 14 },
  title: { color: "#fff", fontWeight: "900", fontSize: 18, textAlign: "center" },
  subtitle: { color: "#c8d0e4", marginTop: 6, marginBottom: 10, textAlign: "center", fontSize: 13 },
  row: { flexDirection: "row", gap: 10, justifyContent: "center" },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  btnTxt: { color: "#fff", fontWeight: "800" },
});
