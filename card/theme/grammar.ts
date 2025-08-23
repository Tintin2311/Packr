export const GRAMMAR = {
  Feu:         { article: "Le",  noun: "feu" },
  Eau:         { article: "L'",  noun: "eau", apostrophe: true },
  "Électricité": { article: "L'",  noun: "électricité", apostrophe: true },
  Plante:      { article: "La",  noun: "plante" },
  Glace:       { article: "La",  noun: "glace" },
  Terre:       { article: "La",  noun: "terre" },
  "Ténèbres":  { article: "Les", noun: "ténèbres", plural: true },
  "Lumière":   { article: "La",  noun: "lumière" },
} as const;

export function prefixFor(el: string) {
  const g: any = (GRAMMAR as any)[el];
  if (!g) return 'Cela me correspond car ';
  const verb = g.plural ? 'me correspondent car ' : 'me correspond car ';
  return `${g.article}${g.apostrophe ? '' : ' '}${g.noun} ${verb}`;
}