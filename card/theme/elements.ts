// card/theme/elements.ts
import type { ColorValue } from 'react-native';

export type ElementKey =
  | 'Feu'
  | 'Eau'
  | 'Électricité'
  | 'Plante'
  | 'Glace'
  | 'Terre'
  | 'Ténèbres'
  | 'Lumière'; // ← Vent supprimé

type ElementTheme = {
  // Tuple immuable (au moins 2 couleurs) pour LinearGradient
  gradient: readonly [ColorValue, ColorValue];
};

export const ELEMENTS: Record<ElementKey, ElementTheme> = {
  Feu:         { gradient: ['#842306ff', '#e01313ff'] as const },
  Eau:         { gradient: ['#031c2eff', '#2c85c0ff'] as const },
  Électricité: { gradient: ['#ffd54d', '#c88b00'] as const },
  Plante:      { gradient: ['#163312ff', '#2f8935ff'] as const },
  Glace:       { gradient: ['#9ad7ff', '#94b8d2ff'] as const },
  Terre:       { gradient: ['#1f0f02a2', '#5f3b24'] as const },
  Ténèbres:    { gradient: ['#343a40', '#0d1117'] as const },
  Lumière:     { gradient: ['#e0d7c2ff', '#ffffffff'] as const },
};
