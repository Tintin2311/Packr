// card/theme/rarity.ts
export type Rarity = 'bronze' | 'argent' | 'diamant' | 'legend';

export const RARITY = {
  bronze: {
    label: 'BRONZE',
    border: '#bd7a2f',
    borderInner: '#e1a45d',
    badgeBg: '#bd7a2f',
    badgeText: '#111',
    halo: 'rgba(189,122,47,0.35)',
  },
  argent: {
    label: 'ARGENT',
    border: '#bfc6ce',
    borderInner: '#eef3f7',
    badgeBg: '#bfc6ce',
    badgeText: '#111',
    halo: 'rgba(191,198,206,0.25)',
  },
  diamant: {
    label: 'DIAMANT',
    border: '#86d0ff',
    borderInner: '#dff2ff',
    badgeBg: '#86d0ff',
    badgeText: '#0a2a3a',
    halo: 'rgba(134,208,255,0.28)',
  },
  legend: {
    label: 'LÉGENDAIRE',
    border: '#f04d4d',
    borderInner: '#ff9a9a',
    badgeBg: '#f04d4d',
    badgeText: '#111',
    halo: 'rgba(240,77,77,0.28)',
  },
} as const;

export const getRarityStyle  = (r: Rarity) => RARITY[r];
export const getRarityLabel  = (r: Rarity) => RARITY[r].label;
export const getRarityBorder = (r: Rarity) => RARITY[r].border;
