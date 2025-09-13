// card/theme/RarityBorder.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { getRarityStyle, type Rarity } from './rarity';

type Props = {
  rarity: Rarity;
  width: number;
  height: number;
  radius: number;
  strokeW?: number;
  inset?: number;
  showBadge?: boolean;
  badgeText?: string;
  badgeAlign?: 'left' | 'right';
  badgeOffset?: { top?: number; side?: number };
  style?: ViewStyle;
};

export default function RarityBorder({
  rarity,
  width,
  height,
  radius,
  strokeW = 4,
  inset = 0,
  showBadge = true,
  badgeText,
  badgeAlign = 'right',
  badgeOffset = { top: 8, side: 10 },
  style,
}: Props) {
  const s = getRarityStyle(rarity);
  const innerInset = inset + strokeW;
  const innerR = Math.max(0, radius - 2);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      {/* halo */}
      <View
        style={[
          styles.abs,
          {
            width,
            height,
            borderRadius: radius + 8,
            shadowColor: s.border,
            shadowOpacity: 0.35,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
          },
        ]}
      />

      {/* trait principal */}
      <View
        style={[
          styles.abs,
          {
            left: inset,
            top: inset,
            width: width - inset * 2,
            height: height - inset * 2,
            borderRadius: radius,
            borderWidth: strokeW,
            borderColor: s.border,
          },
        ]}
      />

      {/* liseré intérieur */}
      <View
        style={[
          styles.abs,
          {
            left: innerInset,
            top: innerInset,
            width: width - innerInset * 2,
            height: height - innerInset * 2,
            borderRadius: innerR,
            borderWidth: 1,
            borderColor: s.borderInner,
            opacity: 0.9,
          },
        ]}
      />

      {showBadge && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: s.badgeBg,
              top: badgeOffset.top ?? 8,
              [badgeAlign === 'right' ? 'right' : 'left']: badgeOffset.side ?? 10,
            },
          ]}
        >
          <Text style={[styles.badgeTxt, { color: s.badgeText }]}>
            {(badgeText ?? s.label).toUpperCase()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },
  badge: {
    position: 'absolute',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeTxt: { fontWeight: '900', fontSize: 12, letterSpacing: 0.25 },
});
