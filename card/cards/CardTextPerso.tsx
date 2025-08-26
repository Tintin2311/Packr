// card/cards/CardTextPerso.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';

type Props = {
  prefix: string;            // "Le feu me correspond car"
  value: string;             // texte utilisateur (sans le préfixe)
  onChange: (t: string) => void;
  width: number;             // largeur utile intérieure
  editable?: boolean;
  totalLinesMax?: number;    // défaut 6 (prefix + texte)
  fontSize?: number;         // défaut 13
  lineHeight?: number;       // défaut 19
  accentBorderColor?: string;// bordure quand plein
};

const FONT_FAMILY =
  Platform.select({ ios: 'System', android: 'sans-serif', web: 'system-ui', default: 'system-ui' }) || undefined;

const WEB_TEXT: any =
  Platform.OS === 'web'
    ? { wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }
    : null;

export default function CardTextPerso({
  prefix,
  value,
  onChange,
  width,
  editable = true,
  totalLinesMax = 6,
  fontSize = 13,
  lineHeight = 19,
  accentBorderColor = '#bd7a2f',
}: Props) {
  const [prefixLines, setPrefixLines] = useState(1);
  const maxUserLines = Math.max(0, totalLinesMax - prefixLines);
  const fixedHeight = maxUserLines * lineHeight;

  const [text, setText] = useState(value);
  const [atCapacity, setAtCapacity] = useState(false);

  const lastAcceptedRef = useRef(value);
  const prevTextRef = useRef(value);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    lastAcceptedRef.current = value;
    prevTextRef.current = value;
    setText(value);
    setAtCapacity(false);
  }, [value]);

  const onPrefixLayout = useCallback((e: any) => {
    const lines = e?.nativeEvent?.lines as Array<{ text: string }> | undefined;
    if (lines?.length) setPrefixLines(lines.length);
  }, []);

  const onChangeText = useCallback(
    (next: string) => {
      if (!editable || maxUserLines === 0) return;
      prevTextRef.current = text;

      const isDeletion = next.length < text.length;
      if (isDeletion) { setText(next); return; }
      if (atCapacity) return;

      setText(next.replace(/^[ \t]+/, ''));
    },
    [editable, maxUserLines, text, atCapacity]
  );

  const onContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      if (maxUserLines === 0) return;
      const h = e?.nativeEvent?.contentSize?.height ?? 0;
      const lines = Math.max(1, Math.round(h / lineHeight));

      if (lines <= maxUserLines) {
        if (text !== lastAcceptedRef.current) { lastAcceptedRef.current = text; onChange(text); }
        setAtCapacity(lines === maxUserLines);
      } else {
        const revert = prevTextRef.current ?? lastAcceptedRef.current ?? '';
        if (revert !== text) {
          setText(revert);
          setAtCapacity(true);
          requestAnimationFrame(() => {
            const end = revert.length;
            (inputRef.current as any)?.setNativeProps?.({ selection: { start: end, end } });
          });
        } else {
          setAtCapacity(true);
        }
      }
    },
    [maxUserLines, lineHeight, text, onChange]
  );

  const onKeyPress = useCallback(
    (e: any) => {
      if (e?.nativeEvent?.key === 'Enter' && atCapacity) e.preventDefault?.();
    },
    [atCapacity]
  );

  return (
    <View style={styles.box}>
      <Text
        style={[styles.prefix, WEB_TEXT, { fontSize, lineHeight, fontFamily: FONT_FAMILY }]}
        onTextLayout={onPrefixLayout}
      >
        {prefix}
      </Text>

      {editable && maxUserLines > 0 && (
        <TextInput
          ref={inputRef}
          value={text}
          onChangeText={onChangeText}
          onContentSizeChange={onContentSizeChange}
          onKeyPress={onKeyPress}
          multiline
          numberOfLines={maxUserLines}
          scrollEnabled={false}
          style={[
            styles.input,
            WEB_TEXT,
            {
              width,
              height: fixedHeight,
              maxHeight: fixedHeight,
              fontSize,
              lineHeight,
              fontFamily: FONT_FAMILY,
            },
            Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : undefined,
            atCapacity ? { borderColor: accentBorderColor, borderWidth: 1 } : null,
          ]}
          placeholder="Écrivez ici…"
          placeholderTextColor={atCapacity ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.6)'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
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
    marginBottom: 4,
  },
  input: {
    color: '#ffffff',
    textAlignVertical: 'top',
    includeFontPadding: false,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});
