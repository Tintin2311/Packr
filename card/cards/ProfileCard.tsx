// card/cards/ProfileCard.tsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Platform,
  Pressable,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ELEMENTS, type ElementKey } from '../theme/elements';
import { GRAMMAR } from '../theme/grammar';
import { type Rarity } from '../theme/rarity';
import RarityBorder from '../theme/RarityBorder';

/* ===== Réglages ===== */
const MEDIA_RATIO   = 0.46; // hauteur de la zone media (0–1)
const PHOTO_PADDING = 8;    // padding horizontal autour de la photo (px)
/** + = on RÉTRÉCIT la zone cliquable depuis les bords, - = on l'AGRANDIT */
const TOUCH_INSET   = { top: 1, right: 1, bottom: 1, left: 1 };
/** Laisse à true le temps d’ajuster visuellement la zone. */
const DEBUG_TOUCH_SHOW = true;

/* ===== Dimensions / typo ===== */
const CARD_W = 300;
const CARD_H = 500;
const PAD_SIDE = 10;

const FRAME_RADIUS = 16;
const FRAME_STROKE = 2;
const FRAME_INSET = 0;

const REASON_FONT_SIZE = 13;
const REASON_LINE_HEIGHT = 19;
const TOTAL_LINES_MAX = 6;

const FONT_FAMILY =
  Platform.select({ ios: 'System', android: 'sans-serif', web: 'system-ui', default: 'system-ui' }) ||
  undefined;

const WEB_TEXT: any =
  Platform.OS === 'web'
    ? { wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }
    : null;

/* Asset décor “Eau” */
const EAU_BG_URL =
  'https://crckgttdlrrebswkvoor.supabase.co/storage/v1/object/public/images/carte%20design/fondEau.png';

type Insets = { top?: number; right?: number; bottom?: number; left?: number };

type Props = {
  element: ElementKey;
  avatarUrl?: string;
  displayName: string;
  age?: number | null;
  city?: string;
  reason?: string;
  description?: string;

  size?: number;
  editable?: boolean;
  rarity?: Rarity;

  onChangeReason?: (txt: string) => void;
  onPhotoPress?: () => void;

  mediaRatio?: number;
  photoPadding?: number;
  touchInset?: Insets; // + = rétrécir, - = agrandir
};

export default function ProfileCard({
  element,
  avatarUrl,
  displayName,
  age,
  city,
  reason,
  description,
  size = CARD_W,
  editable = true,
  rarity = 'bronze',
  onChangeReason,
  onPhotoPress,
  mediaRatio,
  photoPadding,
  touchInset,
}: Props) {
  /* --- dimensions calculées --- */
  const width = size;
  const height = (CARD_H / CARD_W) * size;
  const ratio  = typeof mediaRatio === 'number' ? mediaRatio : MEDIA_RATIO;
  const pPad   = typeof photoPadding === 'number' ? photoPadding : PHOTO_PADDING;
  const inset  = { ...TOUCH_INSET, ...(touchInset || {}) } as Required<Insets>;
  const mediaH = height * ratio;

  /* --- grammaire & meta --- */
  const g = (GRAMMAR as any)[element] || {};
  const verb = g?.plural ? 'me correspondent car' : 'me correspond car';
  const prefix = `${g?.article}${g?.apostrophe ? '' : ' '}${g?.noun} ${verb}`;

  const meta = useMemo(() => {
    const p: string[] = [];
    if (age != null) p.push(String(age));
    if (city) p.push(city);
    return p.join(' · ');
  }, [age, city]);

  const elementColors = useMemo<[string, string]>(
    () => (ELEMENTS[element]?.gradient ?? ['#1b2630', '#0e1720']) as [string, string],
    [element]
  );

  /* --- état texte --- */
  const initialText = reason ?? description ?? '';
  const [text, setText] = useState(initialText);
  const [prefixLines, setPrefixLines] = useState(1);
  const [atCapacity, setAtCapacity] = useState(false);
  const acceptedRef = useRef(text);
  const prevRef = useRef(text);

  const onPrefixLayout = useCallback((e: any) => {
    const lines = e?.nativeEvent?.lines as Array<{ text: string }> | undefined;
    if (lines?.length) setPrefixLines(lines.length);
  }, []);

  const inputMaxLines = useMemo(
    () => Math.max(1, TOTAL_LINES_MAX - prefixLines),
    [prefixLines]
  );
  const usableWidthInsideBox = width - 2 * PAD_SIDE - 2 * 10;
  const inputFixedHeight = inputMaxLines * REASON_LINE_HEIGHT;

  useEffect(() => {
    acceptedRef.current = text;
    prevRef.current = text;
    setAtCapacity(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMaxLines]);

  useEffect(() => {
    const base = reason ?? description ?? '';
    setText(base);
    acceptedRef.current = base;
    prevRef.current = base;
    setAtCapacity(false);
  }, [reason, description]);

  const onChangeText = useCallback((next: string) => {
    if (!editable) return;
    prevRef.current = text;
    setText(next);
  }, [editable, text]);

  const onContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const h = e?.nativeEvent?.contentSize?.height ?? 0;
      const lines = Math.max(1, Math.round(h / REASON_LINE_HEIGHT));
      if (lines <= inputMaxLines) {
        if (text !== acceptedRef.current) {
          acceptedRef.current = text;
          onChangeReason?.(text);
        }
        setAtCapacity(lines === inputMaxLines);
        return;
      }
      const revert = prevRef.current ?? acceptedRef.current ?? '';
      if (revert !== text) setText(revert);
      setAtCapacity(true);
    },
    [inputMaxLines, text, onChangeReason]
  );

  const onKeyPress = useCallback((e: any) => {
    if (!editable) return;
    if (e?.nativeEvent?.key === 'Enter' && atCapacity) e.preventDefault?.();
  }, [editable, atCapacity]);

  const showEauBg = element === 'Eau';

  // Empêche juste la propagation sur web
  const webStopProps =
    Platform.OS === 'web'
      ? ({ onClickCapture: (e: any) => { e.stopPropagation(); } } as any)
      : {};

  // Style d'overlay basé sur des insets absolus
  const overlayStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top:    inset.top    ?? 0,
      left:   inset.left   ?? 0,
      right:  inset.right  ?? 0,
      bottom: inset.bottom ?? 0,
    }),
    [inset.top, inset.left, inset.right, inset.bottom]
  );

  return (
    <View style={{ width, alignItems: 'center' }}>
      <View style={[styles.cardWrapper, { width, height }]}>
        <View style={[styles.card, { width, height, borderRadius: FRAME_RADIUS }]}>
          {/* fond dégradé par élément */}
          <LinearGradient
            colors={elementColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* texture “eau” */}
          {showEauBg && (
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { borderRadius: FRAME_RADIUS, overflow: 'hidden' }]}
            >
              <Image
                source={{ uri: EAU_BG_URL }}
                resizeMode="cover"
                style={[
                  StyleSheet.absoluteFillObject,
                  { top: -8, bottom: -8, left: -8, right: -8, transform: [{ scale: 1.08 }], opacity: 0.5 },
                ]}
              />
            </View>
          )}

          {/* glacis */}
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(0,0,0,0.08)']}
            start={{ x: 0, y: 0.7 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* chip élément */}
          <View style={styles.topChips}>
            <View style={styles.elementChip}>
              <Text style={styles.elementTxt}>
                {g?.article}
                {g?.apostrophe ? '' : ' '}
                {g?.noun?.toLowerCase()}
              </Text>
            </View>
          </View>

          {/* === ZONE PHOTO === */}
          <View style={{ height: mediaH, paddingHorizontal: pPad, paddingBottom: 8, paddingTop: 4 }}>
            {/* WRAP non clipé, position:relative (reçoit l'overlay) */}
            <View style={{ flex: 1, position: 'relative' }} {...webStopProps}>
              {/* CLIP arrondi qui contient l'image */}
              <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} resizeMode="cover" style={{ flex: 1, width: '100%' }} />
                ) : (
                  <View style={styles.photoPh}><Text style={{ color: '#eedfd7' }}>Photo ?</Text></View>
                )}
              </View>

              {/* OVERLAY cliquable posé avec des INSETS (top/left/right/bottom) */}
              <Pressable
                style={[StyleSheet.absoluteFillObject, overlayStyle, { zIndex: 12 }]}
                onPress={onPhotoPress}
                android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)' } : undefined}
                {...webStopProps}
              />

              {DEBUG_TOUCH_SHOW && (
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    overlayStyle,
                    { backgroundColor: 'rgba(255,0,0,0.22)', borderWidth: 1, borderColor: 'red', borderRadius: 6, zIndex: 11 },
                  ]}
                />
              )}
            </View>
          </View>

          {/* === TEXTE === */}
          <View style={{ paddingHorizontal: PAD_SIDE, paddingTop: 8, flex: 1 }}>
            <Text style={styles.name}>{displayName || 'Moi'}</Text>
            {!!meta && <Text style={styles.meta}>{meta}</Text>}

            <View style={styles.reasonBox}>
              <View style={{ width: usableWidthInsideBox }}>
                <Text style={[styles.prefix, WEB_TEXT]} onTextLayout={onPrefixLayout}>{prefix}</Text>

                {editable ? (
                  <TextInput
                    value={text}
                    onChangeText={onChangeText}
                    onContentSizeChange={onContentSizeChange}
                    onKeyPress={onKeyPress}
                    editable
                    multiline
                    numberOfLines={inputMaxLines}
                    scrollEnabled={false}
                    style={[
                      styles.reasonInput,
                      WEB_TEXT,
                      {
                        width: usableWidthInsideBox,
                        height: inputFixedHeight,
                        maxHeight: inputFixedHeight,
                        overflow: 'hidden',
                      },
                      Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
                    ]}
                    placeholder="Écrivez ici…"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                  />
                ) : (
                  <Text
                    style={[
                      styles.reasonReadonly,
                      WEB_TEXT,
                      { width: usableWidthInsideBox, minHeight: inputFixedHeight, lineHeight: REASON_LINE_HEIGHT },
                    ]}
                    numberOfLines={inputMaxLines}
                  >
                    {text?.trim().length ? text : 'Écrivez ici…'}
                  </Text>
                )}
              </View>
            </View>

            <View style={{ flex: 1 }} />
          </View>
        </View>

        {/* bordure rareté */}
        <RarityBorder
          rarity={rarity}
          width={width}
          height={height}
          radius={FRAME_RADIUS}
          strokeW={FRAME_STROKE}
          inset={FRAME_INSET}
          showBadge
          badgeText={rarity.toUpperCase()}
          badgeAlign="right"
          badgeOffset={{ top: 8, side: 10 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: { position: 'relative' },
  card: { overflow: 'hidden', borderWidth: 0, borderRadius: 16, backgroundColor: '#0b1016' },

  topChips: {
    height: 36, paddingHorizontal: 10, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  elementChip: {
    backgroundColor: 'rgba(0,0,0,0.24)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 0,
  },
  elementTxt: { color: '#fff', fontWeight: '800', fontSize: 12 },

  photoPh: {
    flex: 1, borderRadius: 12, borderWidth: 0, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  name: { color: '#fff', fontWeight: '800', fontSize: 16 },
  meta: { color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  reasonBox: { marginTop: 8, backgroundColor: 'rgba(0,0,0,0.20)', borderWidth: 0, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8 },
  prefix: { color: '#fff', fontWeight: '700', fontSize: REASON_FONT_SIZE, lineHeight: REASON_LINE_HEIGHT, fontFamily: FONT_FAMILY, marginBottom: 4 },
  reasonInput: {
    color: '#fff', fontSize: REASON_FONT_SIZE, lineHeight: REASON_LINE_HEIGHT, textAlignVertical: 'top',
    fontFamily: FONT_FAMILY, includeFontPadding: false, paddingTop: 0, paddingRight: 0, paddingBottom: 0, paddingLeft: 0,
    backgroundColor: 'transparent', borderWidth: 0,
  },
  reasonReadonly: { color: '#fff', fontSize: REASON_FONT_SIZE, fontFamily: FONT_FAMILY, opacity: 0.95 },
});
