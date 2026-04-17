// src/theme.ts — Tokens de diseño MODENACEAC 6XSIM
// Optimizado para tablet Android 10" vertical (1200×1920 px típico)

export const Colors = {
  // Primarios
  blue:      '#185FA5',
  blueLight: '#E6F1FB',
  blueMid:   '#378ADD',
  blueDark:  '#0C447C',

  // Secundarios
  green:     '#1D9E75',
  greenLight:'#E1F5EE',
  greenDark: '#085041',

  purple:    '#534AB7',
  purpleLight:'#EEEDFE',

  amber:     '#BA7517',
  amberLight:'#FAEEDA',

  red:       '#A32D2D',
  redLight:  '#FCEBEB',
  redBorder: '#F09595',

  // Neutros
  gray:      '#5F5E5A',
  grayLight: '#F1EFE8',
  grayBorder:'#D3D1C7',
  grayMid:   '#B4B2A9',

  // Base
  white:     '#FFFFFF',
  background:'#F5F4F0',
  text:      '#1A1A18',
  textMuted: '#5F5E5A',
} as const;

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 28,
} as const;

export const Radius = {
  sm:  6,
  md:  8,
  lg:  12,
  xl:  16,
  full: 999,
} as const;

export const FontSize = {
  xxs: 9,
  xs:  10,
  sm:  11,
  md:  13,
  lg:  15,
  xl:  18,
  xxl: 22,
  h1:  28,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium:  '500' as const,
  bold:    '600' as const,
} as const;

// Tablet 10" vertical: 760dp ancho × 1240dp alto (approx)
export const Layout = {
  tabBarHeight:    60,
  statusBarHeight: 50,
  navPadding:      16,
  contentPadding:  14,
  cardRadius:      Radius.lg,
} as const;
