// Typography Design System for 4THITEK Website
// Centralized typography tokens for consistent styling across components

export const typographyScale = {
  'display-xl': 'text-4xl md:text-5xl lg:text-6xl xl:text-[3.75rem] 2xl:text-[4.5rem]',
  'display-lg': 'text-3xl md:text-4xl lg:text-[2.8rem] xl:text-[3.4rem] 2xl:text-[4rem]',
  'display-md': 'text-2xl md:text-3xl lg:text-[2.25rem] xl:text-[2.75rem]',
  'display-sm': 'text-xl md:text-2xl lg:text-[2rem]',
  'heading-xl': 'text-[1.625rem] md:text-[2rem] lg:text-[2.25rem]',
  'heading-lg': 'text-xl md:text-2xl lg:text-[1.75rem]',
  'heading-md': 'text-lg md:text-xl lg:text-[1.625rem]',
  'heading-sm': 'text-base md:text-lg lg:text-xl',
  'body-xl': 'text-lg md:text-xl lg:text-2xl',
  'body-lg': 'text-base md:text-lg lg:text-xl',
  'body-md': 'text-sm md:text-base lg:text-lg',
  'body-sm': 'text-sm md:text-base',
  'caption-lg': 'text-sm md:text-base',
  'caption': 'text-xs md:text-sm',
} as const;

export const fontWeights = {
  // For main titles and primary headings
  'title': 'font-bold',
  
  // For section headers and subheadings
  'heading': 'font-semibold', 
  
  // For UI elements, buttons, labels, navigation
  'ui': 'font-medium',
  
  // For body text and descriptions
  'body': 'font-normal',
} as const;

export const fontFamilies = {
  'primary': 'font-sans',
  'mono': 'font-sans',
  'serif': 'font-serif',
} as const;

export const textColors = {
  'primary': 'text-white',
  'secondary': 'text-[var(--text-secondary)]',
  'tertiary': 'text-[var(--text-muted)]',
  'muted': 'text-[var(--text-muted)]',
  'brand': 'text-[var(--brand-blue)]',
  'hover-primary': 'hover:text-white',
  'hover-brand': 'hover:text-[var(--brand-blue)]',
  'hover-secondary': 'hover:text-[var(--text-secondary)]',
  'success': 'text-[var(--success)]',
  'warning': 'text-[var(--support-lime)]',
  'error': 'text-rose-300',
} as const;

// Component-specific typography combinations
export const typographyComponents = {
  // Hero sections
  hero: {
    title: `${typographyScale['display-xl']} ${fontFamilies.serif} ${fontWeights.title} ${textColors.primary}`,
    subtitle: `${typographyScale['body-xl']} ${fontWeights.body} ${textColors.secondary}`,
    cta: `${typographyScale['body-lg']} ${fontWeights.ui} uppercase tracking-[0.18em]`,
  },
  
  // Section headers
  section: {
    title: `${typographyScale['display-md']} ${fontFamilies.serif} ${fontWeights.title} ${textColors.primary}`,
    subtitle: `${typographyScale['body-lg']} ${fontWeights.body} ${textColors.secondary}`,
  },
  
  // Cards and grid items
  card: {
    title: `${typographyScale['heading-xl']} ${fontWeights.heading} ${textColors.primary}`,
    description: `${typographyScale['body-md']} ${fontWeights.body} ${textColors.secondary}`,
    metadata: `${typographyScale.caption} ${fontWeights.ui} ${textColors.muted}`,
  },
  
  // Forms
  form: {
    label: `${typographyScale['body-md']} ${fontWeights.ui} ${textColors.secondary}`,
    input: `${typographyScale['body-lg']} ${fontWeights.body} ${textColors.primary}`,
    button: `${typographyScale['body-lg']} ${fontWeights.ui}`,
    helper: `${typographyScale.caption} ${fontWeights.body} ${textColors.muted}`,
  },
  
  // Navigation
  navigation: {
    primary: `${typographyScale['body-lg']} ${fontWeights.ui} uppercase tracking-[0.12em] ${textColors.secondary} ${textColors['hover-primary']}`,
    secondary: `${typographyScale['body-md']} ${fontWeights.ui} ${textColors.tertiary} ${textColors['hover-secondary']}`,
    breadcrumb: `${typographyScale.caption} ${fontWeights.ui} ${textColors.muted}`,
  },
  
  // Footer
  footer: {
    heading: `${typographyScale['heading-md']} ${fontWeights.heading} ${textColors.primary}`,
    link: `${typographyScale['body-md']} ${fontWeights.body} ${textColors.secondary} ${textColors['hover-primary']}`,
    copyright: `${typographyScale.caption} ${fontWeights.body} ${textColors.muted}`,
  },
  
  // Blog and content
  content: {
    title: `${typographyScale['display-lg']} ${fontFamilies.serif} ${fontWeights.title} ${textColors.primary}`,
    heading: `${typographyScale['heading-xl']} ${fontFamilies.serif} ${fontWeights.heading} ${textColors.primary}`,
    body: `${typographyScale['body-lg']} ${fontWeights.body} ${textColors.secondary}`,
    caption: `${typographyScale.caption} ${fontWeights.body} ${textColors.muted}`,
  },
} as const;

// Utility function to get typography classes
export const getTypographyClasses = (
  size: keyof typeof typographyScale,
  weight?: keyof typeof fontWeights,
  color?: keyof typeof textColors,
  family?: keyof typeof fontFamilies
): string => {
  const classes: string[] = [typographyScale[size]];
  
  if (weight) classes.push(fontWeights[weight]);
  if (color) classes.push(textColors[color]);
  if (family) classes.push(fontFamilies[family]);
  
  return classes.join(' ');
};

// Responsive typography utilities - Enhanced for ultra-wide screens
export const responsiveTextUtils = {
  'scale-xs': 'text-xs sm:text-sm md:text-base',
  'scale-sm': 'text-sm md:text-base lg:text-lg',
  'scale-md': 'text-base md:text-lg lg:text-xl',
  'scale-lg': 'text-lg md:text-xl lg:text-2xl xl:text-[1.75rem]',
  'scale-xl': 'text-xl md:text-2xl lg:text-3xl xl:text-[2.5rem]',
  'scale-2xl': 'text-2xl md:text-3xl lg:text-4xl xl:text-[3rem]',
  'scale-3xl': 'text-3xl md:text-4xl lg:text-5xl xl:text-[3.5rem]',
} as const;

// Ultra-wide screen spacing utilities
export const ultraWideSpacing = {
  'container-padding': 'px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20',
  'section-spacing': 'py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24',
  'grid-gap-sm': 'gap-4 lg:gap-6 xl:gap-8',
  'grid-gap-md': 'gap-6 lg:gap-8 xl:gap-10',
  'grid-gap-lg': 'gap-8 lg:gap-10 xl:gap-12',
  'content-width-sm': 'max-w-2xl xl:max-w-3xl',
  'content-width-md': 'max-w-4xl xl:max-w-5xl',
  'content-width-lg': 'max-w-6xl xl:max-w-7xl',
  'content-width-xl': 'max-w-7xl 2xl:max-w-[1440px]',
} as const;
