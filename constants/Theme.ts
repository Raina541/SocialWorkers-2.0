export const Colors = {
  light: {
    // Brand (Blue)
    brandForeground1: '#0f6cbd',
    brandForeground2: '#115ea3',
    brandBackground: '#0f6cbd',
    brandBackgroundHover: '#1172cb',
    brandBackgroundPressed: '#115ea3',
    brandBackgroundSelected: '#0f6cbd',
    brandBackgroundSubtle: '#ebf3fc',
    brandBackgroundSubtleHover: '#e0ecfa',
    brandBackgroundSubtlePressed: '#cfe0f7',

    // Neutrals
    neutralForeground1: '#242424',
    neutralForeground2: '#424242',
    neutralForeground3: '#616161',
    neutralForegroundDisabled: '#bdbdbd',
    neutralForegroundOnBrand: '#ffffff',
    
    neutralBackground1: '#ffffff',
    neutralBackground2: '#f5f5f5',
    neutralBackground3: '#f0f0f0',
    neutralBackgroundPressed: '#e0e0e0',
    neutralBackgroundOverlay: 'rgba(0, 0, 0, 0.4)',
    neutralBackgroundDisabled: '#f0f0f0',

    neutralStroke1: '#d2d2d2',
    neutralStroke2: '#e0e0e0',
    neutralStrokeAccessible: '#616161',
    neutralStrokeDisabled: '#e0e0e0',

    // Semantic Intent
    dangerForeground1: '#c41818',
    dangerBackground: '#c41818',
    dangerBackgroundSubtle: '#fde7e9',
    
    warningForeground1: '#d86109',
    warningBackground: '#d86109',
    warningBackgroundSubtle: '#fff4ce',

    successForeground1: '#107c41',
    successBackground: '#107c41',
    successBackgroundSubtle: '#dff6dd',

    infoForeground1: '#616161',
    infoBackground: '#616161',
    infoBackgroundSubtle: '#f5f5f5',
  },
  dark: {
    // Brand (Blue)
    brandForeground1: '#479ef5',
    brandForeground2: '#2886e2',
    brandBackground: '#1172cb',
    brandBackgroundHover: '#1f85ec',
    brandBackgroundPressed: '#115ea3',
    brandBackgroundSelected: '#1172cb',
    brandBackgroundSubtle: '#10253f',
    brandBackgroundSubtleHover: '#153256',
    brandBackgroundSubtlePressed: '#1b3f6c',

    // Neutrals
    neutralForeground1: '#ffffff',
    neutralForeground2: '#d6d6d6',
    neutralForeground3: '#adadad',
    neutralForegroundDisabled: '#5c5c5c',
    neutralForegroundOnBrand: '#ffffff',
    
    neutralBackground1: '#141414',
    neutralBackground2: '#1f1f1f',
    neutralBackground3: '#292929',
    neutralBackgroundPressed: '#333333',
    neutralBackgroundOverlay: 'rgba(0, 0, 0, 0.6)',
    neutralBackgroundDisabled: '#292929',

    neutralStroke1: '#404040',
    neutralStroke2: '#333333',
    neutralStrokeAccessible: '#9e9e9e',
    neutralStrokeDisabled: '#292929',

    // Semantic Intent
    dangerForeground1: '#fe5c5c',
    dangerBackground: '#d83b01',
    dangerBackgroundSubtle: '#3f1011',
    
    warningForeground1: '#ffaa44',
    warningBackground: '#d86109',
    warningBackgroundSubtle: '#432918',

    successForeground1: '#54b054',
    successBackground: '#107c41',
    successBackgroundSubtle: '#0b2f12',

    infoForeground1: '#adadad',
    infoBackground: '#292929',
    infoBackgroundSubtle: '#1f1f1f',
  }
};

export const Spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const Typography = {
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  captionStrong: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  bodyStrong: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
};

export const Shapes = {
  rounded: 6,
  circular: 999,
  square: 0,
};
