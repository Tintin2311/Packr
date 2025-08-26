// card/cards/ProfileCard.tsx
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Platform,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ELEMENTS, type ElementKey } from '../theme/elements';
import { GRAMMAR } from '../theme/grammar';
import { RARITY, type Rarity } from '../theme/rarity';

/* --- Constantes visuelles --- */
const CARD_W = 300;
const CARD_H = 500;
const MEDIA_RATIO = 0.42;           // hauteur zone photo
const PAD_SIDE = 10;

const REASON_FONT_SIZE = 13;
const REASON_LINE_HEIGHT = 19;
const TOTAL_LINES_MAX = 6;          // Préfixe + saisie

const FONT_FAMILY =
  Platform.select({ ios: 'System', android: 'sans-serif', web: 'system-ui', default: 'system-ui' }) || undefined;

const WEB_TEXT: any =
  Platform.OS === 'web'
    ? { wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }
    : null;

/* --- Props --- */
type Props = {
  element: ElementKey;
  avatarUrl?: string;
  displayName: string;
  age?: number | null;
  city?: string;
  reason?: string;          // uniquement la suite (sans le préfixe)
  size?: number;            // largeur carte
  editable?: boolean;       // activer/désactiver l’édition
  rarity?: Rarity;       // bordure BRONZE/ARGENT/DIAMANT/LEGEND
  onChangeReason?: (txt: string) => void;
};

export default function ProfileCard({
  element,
  avatarUrl,
  displayName,
  age,
  city,
  reason = '',
  size = CARD_W,
  editable = true,
  rarity = 'bronze',
  onChangeReason,
}: Props) {
  /* --- Dimensions carte --- */
  const width = size;
  const height = (CARD_H / CARD_W) * size;
  const mediaH = height * MEDIA_RATIO;

  /* --- Texte statique (préfixe) --- */
  const g = (GRAMMAR as any)[element] || {};
  const verb = g?.plural ? 'me correspondent car' : 'me correspond car';
  const prefix = `${g?.article}${g?.apostrophe ? '' : ' '}${g?.noun} ${verb}`;

  /* --- Meta (âge · ville) --- */
  const meta = useMemo(() => {
    const p: string[] = [];
    if (age != null) p.push(String(age));
    if (city) p.push(city);
    return p.join(' · ');
  }, [age, city]);

  /* --- Dégradé de l’élément (fond de TOUTE la carte) --- */
  const elementColors = useMemo<[string, string]>(
    () => (ELEMENTS[element]?.gradient ?? ['#222', '#111']) as [string, string],
    [element]
  );

  /* --- Mesure des lignes du préfixe --- */
  const [prefixLines, setPrefixLines] = useState(1);
  const onPrefixLayout = useCallback((e: any) => {
    const lines = e?.nativeEvent?.lines as Array<{ text: string }> | undefined;
    if (lines?.length) setPrefixLines(lines.length);
  }, []);

  /* --- Lignes réservées à l’utilisateur --- */
  const inputMaxLines = Math.max(1, TOTAL_LINES_MAX - prefixLines); // au moins 1 ligne pour éviter blocages
  const usableWidthInsideBox = width - 2 * PAD_SIDE - 2 * 10;       // 10 = padding horizontal de la box
  const inputFixedHeight = inputMaxLines * REASON_LINE_HEIGHT;

  /* --- Saisie protégée (jamais d’effacement total) --- */
  const [text, setText] = useState(reason);
  const [atCapacity, setAtCapacity] = useState(false);
  const acceptedRef = useRef(text);    // dernier texte valide
  const prevRef = useRef(text);        // snapshot avant la frappe

  // réinitialiser la protection si la place utile change (ex: le préfixe passe sur 2 lignes)
  useEffect(() => {
    acceptedRef.current = text;
    prevRef.current = text;
    setAtCapacity(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMaxLines]);

  // autoriser la prop “reason” à hydrater
  useEffect(() => {
    setText(reason);
    acceptedRef.current = reason;
    prevRef.current = reason;
    setAtCapacity(false);
  }, [reason]);

  const onChangeText = useCallback(
    (next: string) => {
      if (!editable) return;
      prevRef.current = text;
      setText(next); // on laisse React recalculer la hauteur, le blocage se fait dans onContentSizeChange
    },
    [editable, text]
  );

  const onContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      const h = e?.nativeEvent?.contentSize?.height ?? 0;
      const lines = Math.max(1, Math.round(h / REASON_LINE_HEIGHT));

      if (lines <= inputMaxLines) {
        // OK : on valide ce texte
        if (text !== acceptedRef.current) {
          acceptedRef.current = text;
          onChangeReason?.(text);
        }
        setAtCapacity(lines === inputMaxLines);
        return;
      }

      // Dépassement : on revient au snapshot d’avant la frappe (sans jamais vider)
      const revert = prevRef.current ?? acceptedRef.current ?? '';
      if (revert !== text) {
        setText(revert);
        setAtCapacity(true);
      } else {
        setAtCapacity(true);
      }
    },
    [inputMaxLines, text, onChangeReason]
  );

  const onKeyPress = useCallback(
    (e: any) => {
      if (!editable) return;
      if (e?.nativeEvent?.key === 'Enter' && atCapacity) {
        // on empêche d’aller à la 7e ligne
        e.preventDefault?.();
      }
    },
    [editable, atCapacity]
  );

  const borderColor = RARITY[rarity].border;

  /* --- Render --- */
  return (
    <View style={{ width, alignItems: 'center' }}>
      <View style={[styles.card, { width, height, borderColor }]}>
        {/* Fond uni piloté par l’élément */}
        <LinearGradient
          colors={elementColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Bandeau (élément + rareté) */}
        <View style={styles.topChips}>
          <View style={styles.elementChip}>
            <Text style={styles.elementTxt}>
              {g?.article}
              {g?.apostrophe ? '' : ' '}
              {g?.noun?.toLowerCase()}
            </Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{rarity.toUpperCase()}</Text>
          </View>
        </View>

        {/* Zone photo */}
        <View style={{ height: mediaH, paddingHorizontal: 8, paddingBottom: 8, paddingTop: 4 }}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              resizeMode="cover"
              style={{ flex: 1, borderRadius: 12, width: '100%', borderWidth: StyleSheet.hairlineWidth, borderColor }}
            />
          ) : (
            <View style={[styles.photoPh, { borderColor }]}>
              <Text style={{ color: '#eedfd7' }}>Photo ?</Text>
            </View>
          )}
        </View>

        {/* Bas de carte */}
        <View style={{ paddingHorizontal: PAD_SIDE, paddingTop: 8, flex: 1 }}>
          <Text style={styles.name}>{displayName || 'Moi'}</Text>
          {!!meta && <Text style={styles.meta}>{meta}</Text>}

          {/* Encadré raison : pas de Pressable qui vole le focus — le TextInput est directement interactif */}
          <View style={styles.reasonBox}>
            <View style={{ width: usableWidthInsideBox }}>
              <Text style={[styles.prefix, WEB_TEXT]} onTextLayout={onPrefixLayout}>
                {prefix}
              </Text>

              <TextInput
                value={text}
                onChangeText={onChangeText}
                onContentSizeChange={onContentSizeChange}
                onKeyPress={onKeyPress}
                editable={editable}
                multiline
                numberOfLines={inputMaxLines}       // hauteur visuelle fixée
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
                  atCapacity ? { borderColor, borderWidth: 1 } : null,
                ]}
                placeholder="Écrivez ici…"
                placeholderTextColor={atCapacity ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.6)'}
              />
            </View>
          </View>

          <View style={{ flex: 1 }} />
        </View>
      </View>
    </View>
  );
}

/* --- Styles --- */
const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 2,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  topChips: {
    height: 36,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  elementChip: {
    backgroundColor: 'rgba(0,0,0,0.24)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  elementTxt: { color: '#fff', fontWeight: '800', fontSize: 12 },
  badge: { backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { color: '#000', fontWeight: '900', fontSize: 12 },

  photoPh: {
    flex: 1,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: { color: '#fff', fontWeight: '800', fontSize: 16 },
  meta: { color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  reasonBox: {
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.20)',
    borderColor: 'rgba(0,0,0,0.25)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  prefix: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: REASON_FONT_SIZE,
    lineHeight: REASON_LINE_HEIGHT,
    fontFamily: FONT_FAMILY,
    marginBottom: 4,
  },
  reasonInput: {
    color: '#ffffff',
    fontSize: REASON_FONT_SIZE,
    lineHeight: REASON_LINE_HEIGHT,
    textAlignVertical: 'top',
    fontFamily: FONT_FAMILY,
    includeFontPadding: false,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});
