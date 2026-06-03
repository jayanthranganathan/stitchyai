export type ThemeColors = {
  primary: string;
  primaryDark: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  danger: string;
  success: string;
};

export type ThemeId = 'neon-bazaar' | 'royale-kanjivaram' | 'saffron-harvest' | 'sage-terra' | 'blush-couture';

export type ThemeDef = {
  id: ThemeId;
  name: string;
  description: string;
  colors: ThemeColors;
  swatches: string[]; // 3 representative colors for the picker swatch
};

export const THEMES: Record<ThemeId, ThemeDef> = {
  'neon-bazaar': {
    id: 'neon-bazaar',
    name: 'Neon Bazaar',
    description: 'Electric violet & hot pink on soft lavender',
    swatches: ['#F5F0FF', '#7C3AED', '#EC4899'],
    colors: {
      primary: '#7C3AED',
      primaryDark: '#6D28D9',
      accent: '#EC4899',
      background: '#F5F0FF',
      surface: '#FFFFFF',
      text: '#1A1033',
      textMuted: '#7C6F9A',
      border: '#EDE8FF',
      danger: '#DC2626',
      success: '#059669',
    },
  },
  'royale-kanjivaram': {
    id: 'royale-kanjivaram',
    name: 'Royale Kanjivaram',
    description: '24k gold on midnight navy — heritage luxury',
    swatches: ['#0E0C2F', '#D4AF37', '#F5ECD7'],
    colors: {
      primary: '#D4AF37',
      primaryDark: '#B8941F',
      accent: '#F0CB6A',
      background: '#0E0C2F',
      surface: '#1A1850',
      text: '#F5ECD7',
      textMuted: '#9A8B6A',
      border: '#2A2560',
      danger: '#E57373',
      success: '#4CAF82',
    },
  },
  'saffron-harvest': {
    id: 'saffron-harvest',
    name: 'Saffron Harvest',
    description: 'Bold saffron orange — South Indian festive',
    swatches: ['#FFF8EE', '#E65C00', '#F5C89A'],
    colors: {
      primary: '#E65C00',
      primaryDark: '#CC5200',
      accent: '#F5C89A',
      background: '#FFF8EE',
      surface: '#FFFFFF',
      text: '#1A1108',
      textMuted: '#8A7060',
      border: '#F5C89A',
      danger: '#B3261E',
      success: '#1F7A4D',
    },
  },
  'sage-terra': {
    id: 'sage-terra',
    name: 'Sage & Terra',
    description: 'Forest green & terracotta — artisan craft',
    swatches: ['#F5F0E8', '#2F4A3C', '#C17D5C'],
    colors: {
      primary: '#2F4A3C',
      primaryDark: '#1F3028',
      accent: '#C17D5C',
      background: '#F5F0E8',
      surface: '#FFFFFF',
      text: '#1F2D1F',
      textMuted: '#7A8F7A',
      border: '#D9CDB8',
      danger: '#B3261E',
      success: '#2F4A3C',
    },
  },
  'blush-couture': {
    id: 'blush-couture',
    name: 'Blush Couture',
    description: 'Deep rose & champagne — premium boutique',
    swatches: ['#FDF6F3', '#8B2B3E', '#F5C4A1'],
    colors: {
      primary: '#8B2B3E',
      primaryDark: '#6B1F2E',
      accent: '#F5C4A1',
      background: '#FDF6F3',
      surface: '#FFFFFF',
      text: '#2A0A12',
      textMuted: '#9B7A85',
      border: '#E8C4C4',
      danger: '#B3261E',
      success: '#1F7A4D',
    },
  },
};

export const THEME_ORDER: ThemeId[] = [
  'neon-bazaar',
  'royale-kanjivaram',
  'saffron-harvest',
  'sage-terra',
  'blush-couture',
];
