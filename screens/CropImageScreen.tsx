// screens/CropImageScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Image as RNImage,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImageManipulator from "expo-image-manipulator";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";

/**
 * Route params:
 * - uri: string (image source)
 * - aspect?: [number, number] (ex: [1,1] carré, [4,5] portrait, [16,9] paysage)
 * - onDone: (croppedUri: string) => void
 */
type RouteParams = {
  uri: string;
  aspect?: [number, number];
  onDone?: (croppedUri: string) => void;
};

export default function CropImageScreen() {
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const { width: screenW, height: screenH } = useWindowDimensions();

  const uri: string = params?.uri;
  const aspect: [number, number] = params?.aspect ?? [1, 1];
  const onDone: ((u: string) => void) | undefined = params?.onDone;

  const [imgW, setImgW] = useState<number | null>(null);
  const [imgH, setImgH] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  // Zone de recadrage (carré par défaut) : largeur limitée à l’écran
  const cropW = Math.min(screenW - 24, 360);
  const cropH = Math.round(cropW * (aspect[1] / aspect[0])); // cropH = cropW * (h/w)

  // Position/scale contrôlés par gestes
  const scale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  // Échelle minimale pour couvrir la zone de crop
  const [minScale, setMinScale] = useState(1);
  const maxScale = 6; // tu peux monter à 8–10 si tu veux zoomer plus

  // On charge la taille réelle de l'image pour faire les maths
  useEffect(() => {
    let mounted = true;
    RNImage.getSize(
      uri,
      (w, h) => {
        if (!mounted) return;
        setImgW(w);
        setImgH(h);
      },
      () => {
        // fallback
        setImgW(1000);
        setImgH(1000);
      }
    );
    return () => { mounted = false; };
  }, [uri]);

  // Calcule l’échelle de base pour “cover” la zone de crop
  useEffect(() => {
    if (!imgW || !imgH) return;
    const base = Math.max(cropW / imgW, cropH / imgH);
    setMinScale(base);
    scale.value = base;       // on démarre à base
    // on centre l'image au départ
    const displayW = imgW * base;
    const displayH = imgH * base;
    tx.value = (cropW - displayW) / 2;
    ty.value = (cropH - displayH) / 2;
  }, [imgW, imgH, cropW, cropH, scale, tx, ty]);

  // Fonctions de clamp pour empêcher des trous dans le cadre
  const clampTranslate = useCallback((s: number, x: number, y: number) => {
    if (!imgW || !imgH) return { x, y };
    const displayW = imgW * s;
    const displayH = imgH * s;

    const minX = cropW - displayW;
    const maxX = 0;
    const minY = cropH - displayH;
    const maxY = 0;

    const cx = Math.min(maxX, Math.max(minX, x));
    const cy = Math.min(maxY, Math.max(minY, y));
    return { x: cx, y: cy };
  }, [imgW, imgH, cropW, cropH]);

  // Gestes: pinch + pan
  const pan = Gesture.Pan()
    .onChange((e) => {
      const nx = tx.value + e.changeX;
      const ny = ty.value + e.changeY;
      const { x, y } = clampTranslate(scale.value, nx, ny);
      tx.value = x;
      ty.value = y;
    });

  const pinch = Gesture.Pinch()
    .onChange((e) => {
      let nextScale = scale.value * e.scale;
      nextScale = Math.max(minScale, Math.min(maxScale, nextScale));
      // Conserver le centre visuel: simple approche = recalc clamp
      const ratio = nextScale / scale.value;
      const dx = (cropW / 2 - tx.value) * (ratio - 1);
      const dy = (cropH / 2 - ty.value) * (ratio - 1);
      let nx = tx.value - dx;
      let ny = ty.value - dy;

      const { x, y } = clampTranslate(nextScale, nx, ny);
      scale.value = nextScale;
      tx.value = x;
      ty.value = y;
    });

  const composed = Gesture.Simultaneous(pan, pinch);

  const imgStyle = useAnimatedStyle(() => {
    return {
      width: imgW ? imgW * scale.value : undefined,
      height: imgH ? imgH * scale.value : undefined,
      transform: [{ translateX: tx.value }, { translateY: ty.value }],
    };
  });

  // Quadrillage (règle des tiers) — simple overlay
  const Grid = useMemo(() => {
    return (
      <View pointerEvents="none" style={styles.grid}>
        {/* vertical */}
        <View style={[styles.gridLine, { left: cropW / 3 }]} />
        <View style={[styles.gridLine, { left: (cropW * 2) / 3 }]} />
        {/* horizontal */}
        <View style={[styles.gridLineH, { top: cropH / 3 }]} />
        <View style={[styles.gridLineH, { top: (cropH * 2) / 3 }]} />
      </View>
    );
  }, [cropW, cropH]);

  // Lancer le crop → renvoyer à l’écran précédent
  const doCrop = useCallback(async () => {
    if (!imgW || !imgH) return;
    setBusy(true);
    try {
      // Affichage actuel
      const s = scale.value;
      const x = tx.value;
      const y = ty.value;

      // Mapping zone crop -> coordonnées source (en pixels d’origine)
      // top-left de l'image dans le cadre = (x, y)
      // taille affichée = (imgW*s, imgH*s)
      const originX = Math.max(0, Math.min(imgW - 1, Math.round(Math.max(0, -x) / s)));
      const originY = Math.max(0, Math.min(imgH - 1, Math.round(Math.max(0, -y) / s)));
      const cropWidthSrc = Math.round(cropW / s);
      const cropHeightSrc = Math.round(cropH / s);

      const boundedW = Math.max(1, Math.min(imgW - originX, cropWidthSrc));
      const boundedH = Math.max(1, Math.min(imgH - originY, cropHeightSrc));

      const actions: ImageManipulator.Action[] = [
        { crop: { originX, originY, width: boundedW, height: boundedH } },
      ];

      // Optionnel: forcer un format carré exact si tu veux respecter l'aspect même si l'image manque
      // (ici on fait déjà le clamp, donc OK)

      const result = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      if (onDone) onDone(result.uri);
      nav.goBack();
    } catch (e: any) {
      // petit fallback: on annule si erreur
      nav.goBack();
    } finally {
      setBusy(false);
    }
  }, [cropW, cropH, imgW, imgH, nav, onDone, scale, tx, ty, uri]);

  if (!imgW || !imgH) {
    return (
      <SafeAreaView style={[styles.fill, styles.center]}>
        <ActivityIndicator />
        <Text style={{ color: "#fff", marginTop: 6 }}>Chargement…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.fill]}>
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} style={styles.hBtn}>
          <Text style={styles.hBtnText}>Annuler</Text>
        </Pressable>
        <Text style={styles.hTitle}>Recadrer</Text>
        <Pressable onPress={busy ? undefined : doCrop} style={[styles.hBtn, busy && { opacity: 0.6 }]}>
          <Text style={[styles.hBtnText, { fontWeight: "800" }]}>Valider</Text>
        </Pressable>
      </View>

      <View style={styles.cropWrapOuter}>
        <View
          style={[
            styles.cropWrap,
            { width: cropW, height: cropH, borderRadius: 12 },
          ]}
        >
          {/* image manipulable */}
          <GestureDetector gesture={composed}>
            <Animated.Image
              source={{ uri }}
              style={[styles.img, imgStyle]}
              resizeMode="cover"
            />
          </GestureDetector>

          {/* overlay assombri + fenêtre */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {/* bords assombris */}
            <View style={[styles.dim, { top: -9999, bottom: cropH }]} />
            <View style={[styles.dim, { top: cropH, bottom: -9999 }]} />
            <View style={[styles.dim, { left: -9999, right: cropW }]} />
            <View style={[styles.dim, { left: cropW, right: -9999 }]} />
          </View>

          {/* cadre + grille */}
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.7)" },
            ]}
          />
          {Grid}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0a0f14" },
  center: { alignItems: "center", justifyContent: "center" },

  header: {
    height: 48,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  hBtnText: { color: "#fff" },
  hTitle: { color: "#fff", fontWeight: "800" },

  cropWrapOuter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  cropWrap: {
    overflow: "hidden",
    backgroundColor: "#000",
  },
  img: {
    position: "absolute",
    left: 0,
    top: 0,
  },

  dim: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  grid: {
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
  },
  gridLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  gridLineH: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
