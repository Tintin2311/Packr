// card/builder/PhotoCropModal.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  PanResponder,
  Pressable,
} from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

type Props = {
  visible: boolean;
  imageUri: string;
  /** frame aspect = width / height (should match the card photo window) */
  frameAspect: number;
  /** output width (px) */
  outputWidth?: number; // default 1200
  onCancel: () => void;
  onDone: (croppedUri: string) => void;
};

export default function PhotoCropModal({
  visible,
  imageUri,
  frameAspect,
  outputWidth = 1200,
  onCancel,
  onDone,
}: Props) {
  const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
  const frameW = Math.min(SCREEN_W - 32, 360);
  const frameH = Math.round(frameW / Math.max(0.1, frameAspect));

  const [imgW, setImgW] = useState(0);
  const [imgH, setImgH] = useState(0);

  const baseScaleRef = useRef(1);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  // load natural size
  useEffect(() => {
    if (!visible) return;
    Image.getSize(imageUri, (w, h) => {
      setImgW(w);
      setImgH(h);
      // fit image inside frame initially (contain)
      const s = Math.max(frameW / w, frameH / h);
      baseScaleRef.current = s;
      setScale(1);
      setTx(0);
      setTy(0);
    });
  }, [visible, imageUri, frameW, frameH]);

  // drag
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => {
        setTx((prev) => prev + g.dx);
        setTy((prev) => prev + g.dy);
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // keep image covering the frame (no empty bars)
  useEffect(() => {
    const currentScale = baseScaleRef.current * scale;
    const displayedW = imgW * currentScale;
    const displayedH = imgH * currentScale;

    const maxOffsetX = Math.max(0, (displayedW - frameW) / 2);
    const maxOffsetY = Math.max(0, (displayedH - frameH) / 2);

    setTx((x) => Math.max(-maxOffsetX, Math.min(maxOffsetX, x)));
    setTy((y) => Math.max(-maxOffsetY, Math.min(maxOffsetY, y)));
  }, [scale, imgW, imgH, frameW, frameH]);

  const crop = async () => {
    if (!imgW || !imgH) return;

    const currentScale = baseScaleRef.current * scale;
    const displayedW = imgW * currentScale;
    const displayedH = imgH * currentScale;

    // tx/ty are offsets around center. Convert frame center -> image coords.
    // Container and frame share same center, so:
    const originX = (displayedW - frameW) / 2 - tx;
    const originY = (displayedH - frameH) / 2 - ty;

    // back to natural pixels
    const factor = imgW / displayedW; // = 1/(currentScale)
    const cropX = Math.max(0, Math.round(originX * factor));
    const cropY = Math.max(0, Math.round(originY * factor));
    const cropW = Math.min(imgW - cropX, Math.round(frameW * factor));
    const cropH = Math.min(imgH - cropY, Math.round(frameH * factor));

    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } },
       { resize: { width: outputWidth } }],
      { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
    );

    onDone(result.uri);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { width: frameW + 32 }]}>
          <Text style={styles.title}>Ajuster la photo</Text>

          <View style={[styles.frame, { width: frameW, height: frameH }]} {...pan.panHandlers}>
            {/* image */}
            {Boolean(imgW && imgH) && (
              <Image
                source={{ uri: imageUri }}
                resizeMode="cover"
                style={{
                  width: imgW * baseScaleRef.current * scale,
                  height: imgH * baseScaleRef.current * scale,
                  transform: [{ translateX: tx }, { translateY: ty }],
                }}
              />
            )}
            {/* frame mask */}
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.mask]}>
              <View style={[styles.innerBorder]} />
            </View>
          </View>

          {/* zoom slider (simple) */}
          <View style={styles.sliderRow}>
            <Pressable style={styles.btn} onPress={() => setScale((s) => Math.max(1, +(s - 0.1).toFixed(2)))}>
              <Text style={styles.btnText}>−</Text>
            </Pressable>
            <Text style={{ color: '#fff' }}>Zoom: {(scale).toFixed(2)}×</Text>
            <Pressable style={styles.btn} onPress={() => setScale((s) => Math.min(4, +(s + 0.1).toFixed(2)))}>
              <Text style={styles.btnText}>＋</Text>
            </Pressable>
          </View>

          {/* actions */}
          <View style={styles.actions}>
            <Pressable style={styles.ghost} onPress={onCancel}>
              <Text style={styles.ghostText}>Annuler</Text>
            </Pressable>
            <Pressable style={styles.primary} onPress={crop}>
              <Text style={styles.primaryText}>Utiliser</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#141922',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '90%',
  },
  title: { color: '#fff', fontWeight: '800', fontSize: 16, marginBottom: 10 },
  frame: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mask: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  innerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 12,
    margin: 2,
  },
  sliderRow: {
    marginTop: 12,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  actions: {
    marginTop: 14,
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  ghost: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    borderRadius: 12,
  },
  ghostText: { color: '#fff', textAlign: 'center', fontWeight: '600' },
  primary: {
    flex: 1,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryText: { color: '#0a0f14', textAlign: 'center', fontWeight: '800' },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
