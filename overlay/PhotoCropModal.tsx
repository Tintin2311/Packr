// overlay/PhotoCropModal.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  PanResponder,
  Pressable,
  Platform,
  ActivityIndicator,
} from 'react-native';

export type CropState = {
  scale: number;
  translateX: number;
  translateY: number;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (crop: CropState) => void;
  imageUri: string;

  // Cadre d’aperçu = fenêtre exacte de la carte (zone photo)
  frameWidth: number;
  frameHeight: number;
  frameBorderRadius?: number;

  // options
  showGrid?: boolean; // grille 3x3
};

const MAX_SCALE = 5;
const PAN_DAMPING = 0.55; // < 1 => moins sensible
const PAN_THRESHOLD = 4;  // seuil d’activation
const DOUBLE_TAP_DELAY = 250;

export default function PhotoCropModal({
  visible,
  onClose,
  onConfirm,
  imageUri,
  frameWidth,
  frameHeight,
  frameBorderRadius = 12,
  showGrid = true,
}: Props) {
  const [imgW, setImgW] = useState<number | null>(null);
  const [imgH, setImgH] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // état de cadrage
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // initial snapshot pour reset
  const initRef = useRef<CropState | null>(null);

  // refs pinch
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const pinchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // double tap
  const lastTapRef = useRef<number>(0);

  // charger dimensions
  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    Image.getSize(
      imageUri,
      (w, h) => {
        setImgW(w);
        setImgH(h);
        setLoading(false);
      },
      () => {
        // fallback
        setImgW(1000);
        setImgH(1500);
        setLoading(false);
      }
    );
  }, [imageUri, visible]);

  // scale minimal pour "cover"
  const coverScale = useMemo(() => {
    if (!imgW || !imgH) return 1;
    return Math.max(frameWidth / imgW, frameHeight / imgH);
  }, [imgW, imgH, frameWidth, frameHeight]);

  // init cadrage à l’ouverture
  useEffect(() => {
    if (!visible || !imgW || !imgH) return;
    const s = coverScale;
    setScale(s);
    setTx(0);
    setTy(0);
    initRef.current = { scale: s, translateX: 0, translateY: 0 };
  }, [visible, imgW, imgH, coverScale]);

  // bornes pour pan
  const clampXY = useCallback(
    (x: number, y: number, s: number) => {
      if (!imgW || !imgH) return { x, y };
      const halfW = (imgW * s - frameWidth) / 2;
      const halfH = (imgH * s - frameHeight) / 2;
      const maxX = Math.max(0, halfW);
      const maxY = Math.max(0, halfH);
      return {
        x: Math.min(maxX, Math.max(-maxX, x)),
        y: Math.min(maxY, Math.max(-maxY, y)),
      };
    },
    [imgW, imgH, frameWidth, frameHeight]
  );

  const setScaleClamped = useCallback(
    (next: number) => Math.min(MAX_SCALE, Math.max(coverScale, next)),
    [coverScale]
  );

  // util : coordonnées centre pinch dans le cadre
  const pinchCenter = useCallback((touches: readonly any[]) => {
    const [a, b] = touches as any[];
    return { x: (a.pageX + b.pageX) / 2, y: (a.pageY + b.pageY) / 2 };
  }, []);

  // convertir coord absolue -> locale cadre
  const toLocal = useCallback(
    (g: { x: number; y: number }) => {
      // centre du cadre à l’écran ≈ non nécessaire: on travaille en delta (relative)
      // ici on renvoie juste le point au centre du cadre pour la formule
      // car les deltas appliqués sur tx/ty suffisent.
      const localX = g.x - 0; // simplification, on corrige via deltaTx/deltaTy
      const localY = g.y - 0;
      return { x: localX, y: localY };
    },
    []
  );

  // ajuster pan pour zoom centré sur un point (p)
  const zoomAtPoint = useCallback(
    (targetScale: number, p?: { x: number; y: number }) => {
      const newScale = setScaleClamped(targetScale);
      if (!imgW || !imgH) {
        setScale(newScale);
        return;
      }

      // centre du cadre (en px)
      const cx = frameWidth / 2;
      const cy = frameHeight / 2;

      // point cible (par défaut centre du cadre)
      const px = p?.x ?? cx;
      const py = p?.y ?? cy;

      // différence de scale
      const ds = newScale / scale;

      // pour conserver le point (px,py) visuellement stable, on ajuste tx/ty
      // formule standard : tx' = (tx + (px - cx)) * ds - (px - cx)
      const ntx = (tx + (px - cx)) * ds - (px - cx);
      const nty = (ty + (py - cy)) * ds - (py - cy);

      const { x, y } = clampXY(ntx, nty, newScale);
      setScale(newScale);
      setTx(x);
      setTy(y);
    },
    [clampXY, frameHeight, frameWidth, imgW, imgH, scale, setScaleClamped, tx, ty]
  );

  // PanResponder
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (evt, g) =>
          Math.abs(g.dx) > PAN_THRESHOLD ||
          Math.abs(g.dy) > PAN_THRESHOLD ||
          (evt.nativeEvent.touches?.length ?? 0) >= 2,
        onMoveShouldSetPanResponder: (evt, g) =>
          Math.abs(g.dx) > PAN_THRESHOLD ||
          Math.abs(g.dy) > PAN_THRESHOLD ||
          (evt.nativeEvent.touches?.length ?? 0) >= 2,

        onPanResponderGrant: (evt) => {
          const touches = (evt.nativeEvent as any).touches as any[] | undefined;
          const now = Date.now();

          // double tap (un seul doigt)
          if ((touches?.length ?? 0) === 1) {
            if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
              // toggle zoom centré sur le tap
              const t = touches![0];
              const p = toLocal({ x: t.pageX, y: t.pageY });
              const next = scale < coverScale * 1.8 ? scale * 2 : coverScale; // zoom in/out
              zoomAtPoint(next, p);
            }
            lastTapRef.current = now;
          }

          // pinch init
          if ((touches?.length ?? 0) >= 2) {
            pinchStartDistRef.current = distance(touches!);
            pinchStartScaleRef.current = scale;
            const c = pinchCenter(touches!);
            pinchCenterRef.current = c;
          } else {
            pinchStartDistRef.current = null;
            pinchCenterRef.current = null;
          }
        },

        onPanResponderMove: (evt, gestureState) => {
          const touches = (evt.nativeEvent as any).touches as any[] | undefined;

          if (touches && touches.length >= 2) {
            // PINCH
            const d = distance(touches);
            if (pinchStartDistRef.current) {
              const raw = (d / pinchStartDistRef.current) * pinchStartScaleRef.current;
              const p = pinchCenterRef.current
                ? toLocal(pinchCenterRef.current)
                : { x: frameWidth / 2, y: frameHeight / 2 };
              zoomAtPoint(raw, p);
            }
          } else {
            // PAN
            const nextX = tx + gestureState.dx * PAN_DAMPING;
            const nextY = ty + gestureState.dy * PAN_DAMPING;
            const { x, y } = clampXY(nextX, nextY, scale);
            setTx(x);
            setTy(y);
          }
        },

        onPanResponderRelease: () => {
          pinchStartDistRef.current = null;
          pinchCenterRef.current = null;
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [clampXY, frameHeight, frameWidth, scale, toLocal, tx, ty, zoomAtPoint, coverScale]
  );

  // Zoom molette (web)
  const onWheel = useCallback(
    (e: any) => {
      if (Platform.OS !== 'web') return;
      e.preventDefault?.();
      const delta = e.deltaY;
      const factor = delta > 0 ? 0.9 : 1.1;
      const rect = e.currentTarget.getBoundingClientRect?.();
      const px = rect ? e.clientX - rect.left : frameWidth / 2;
      const py = rect ? e.clientY - rect.top : frameHeight / 2;
      zoomAtPoint(scale * factor, { x: px, y: py });
    },
    [frameHeight, frameWidth, scale, zoomAtPoint]
  );

  const reset = useCallback(() => {
    const init = initRef.current;
    if (init) {
      setScale(init.scale);
      setTx(init.translateX);
      setTy(init.translateY);
    } else {
      setScale(coverScale);
      setTx(0);
      setTy(0);
    }
  }, [coverScale]);

  const confirm = useCallback(() => {
    onConfirm({ scale, translateX: tx, translateY: ty });
  }, [onConfirm, scale, tx, ty]);

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Recadrer</Text>
            <Text style={styles.scaleBadge}>×{scale.toFixed(2)}</Text>
          </View>

          <View
            style={[
              styles.frame,
              { width: frameWidth, height: frameHeight, borderRadius: frameBorderRadius },
            ]}
          >
            <View
              style={{ width: frameWidth, height: frameHeight, overflow: 'hidden', borderRadius: frameBorderRadius }}
              {...panResponder.panHandlers}
              // @ts-ignore (RN Web)
              onWheel={onWheel}
            >
              {loading || !imgW || !imgH ? (
                <View style={styles.loaderBox}>
                  <ActivityIndicator />
                </View>
              ) : (
                <>
                  <Image
                    source={{ uri: imageUri }}
                    style={{
                      width: imgW * scale,
                      height: imgH * scale,
                      transform: [
                        { translateX: tx + (frameWidth - imgW * scale) / 2 },
                        { translateY: ty + (frameHeight - imgH * scale) / 2 },
                      ],
                    }}
                    resizeMode="cover"
                  />
                  {showGrid && <GridOverlay />}
                </>
              )}
            </View>
          </View>

          <View style={styles.controlsRow}>
            <Pressable style={styles.ctrl} onPress={() => zoomAtPoint(scale * 0.9)}>
              <Text style={styles.ctrlTxt}>−</Text>
            </Pressable>
            <Pressable style={styles.ctrl} onPress={reset}>
              <Text style={styles.ctrlTxt}>Reset</Text>
            </Pressable>
            <Pressable style={styles.ctrl} onPress={() => zoomAtPoint(scale * 1.1)}>
              <Text style={styles.ctrlTxt}>+</Text>
            </Pressable>
          </View>

          <View style={styles.actionsRow}>
            <Pressable style={styles.btn} onPress={onClose}>
              <Text style={styles.btnTxt}>Annuler</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.btnPrimary]} onPress={confirm}>
              <Text style={[styles.btnTxt, styles.btnPrimaryTxt]}>Valider</Text>
            </Pressable>
          </View>

          <Text style={styles.hint}>
            Pince pour zoomer, glisse pour déplacer. Double-tap pour zoom rapide. Molette activée sur web.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

/* —————— Helpers —————— */

function distance(touches: readonly any[]) {
  const [a, b] = touches as any[];
  const dx = a.pageX - b.pageX;
  const dy = a.pageY - b.pageY;
  return Math.hypot(dx, dy);
}

function GridOverlay() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* lignes verticales */}
      <View style={[styles.gridLine, { left: '33.333%' }]} />
      <View style={[styles.gridLine, { left: '66.666%' }]} />
      {/* lignes horizontales */}
      <View style={[styles.gridLineH, { top: '33.333%' }]} />
      <View style={[styles.gridLineH, { top: '66.666%' }]} />
    </View>
  );
}

/* —————— Styles —————— */

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    backgroundColor: '#0b0f19',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scaleBadge: {
    color: '#0b0f19',
    backgroundColor: '#ffffff',
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  frame: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  ctrl: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    minWidth: 64,
    alignItems: 'center',
  },
  ctrlTxt: { color: '#fff', fontWeight: '700' },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  btnTxt: { color: '#fff', fontWeight: '700' },
  btnPrimary: { backgroundColor: '#ffffff' },
  btnPrimaryTxt: { color: '#000' },
  hint: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' },

  gridLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
