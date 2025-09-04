// card/theme/grammar.ts
import type { ElementKey } from './elements';

type Grammar = {
  article: string;
  noun: string;
  apostrophe?: boolean;
  plural?: boolean;
};

export const GRAMMAR: Record<ElementKey, Grammar> = {
  Feu:         { article: 'Le',  noun: 'feu' },
  Eau:         { article: "L'",  noun: 'eau', apostrophe: true },
  Électricité: { article: "L'",  noun: 'électricité', apostrophe: true },
  Plante:      { article: 'La',  noun: 'plante' },
  Glace:       { article: 'La',  noun: 'glace' },
  Terre:       { article: 'La',  noun: 'terre' },
  Ténèbres:    { article: 'Les', noun: 'ténèbres', plural: true },
  Lumière:     { article: 'La',  noun: 'lumière' },
};
