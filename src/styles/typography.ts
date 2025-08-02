// Typography Design System for 4THITEK Website
// Centralized typography tokens for consistent styling across components

export const typographyScale = {
  // Display sizes (for hero titles and main headings)
  'display-xl': 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl',
  'display-lg': 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl', 
  'display-md': 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl',
  'display-sm': 'text-xl md:text-2xl lg:text-3xl xl:text-4xl',
  
  // Heading sizes (for section headers)
  'heading-xl': 'text-lg md:text-xl lg:text-2xl',
  'heading-lg': 'text-base md:text-lg lg:text-xl',
  'heading-md': 'text-sm md:text-base lg:text-lg',
  'heading-sm': 'text-xs md:text-sm lg:text-base',
  
  // Body text sizes
  'body-xl': 'text-base md:text-lg lg:text-xl',
  'body-lg': 'text-sm md:text-base lg:text-lg',
  'body-md': 'text-xs md:text-sm lg:text-base',
  'body-sm': 'text-xs md:text-sm',
  
  // Caption and small text
  'caption-lg': 'text-xs md:text-sm',
  'caption': 'text-xs',
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
  // Primary font for most text
  'primary': 'font-sans',
  
  // For special headings or brand elements
  'mono': 'font-mono',
  
  // For serif text if needed
  'serif': 'font-serif',
} as const;

export const textColors = {
  // Primary text colors
  'primary': 'text-white',
  'secondary': 'text-gray-300',
  'tertiary': 'text-gray-400', 
  'muted': 'text-gray-500',
  
  // Brand colors
  'brand': 'text-[#4FC8FF]',
  
  // Interactive states
  'hover-primary': 'hover:text-white',
  'hover-brand': 'hover:text-[#4FC8FF]',
  'hover-secondary': 'hover:text-gray-300',
  
  // Status colors
  'success': 'text-green-400',
  'warning': 'text-yellow-400',
  'error': 'text-red-400',
} as const;

// Component-specific typography combinations
export const typographyComponents = {
  // Hero sections
  hero: {
    title: `${typographyScale['display-xl']} ${fontWeights.title} ${textColors.primary}`,
    subtitle: `${typographyScale['body-xl']} ${fontWeights.body} ${textColors.secondary}`,
    cta: `${typographyScale['body-lg']} ${fontWeights.ui}`,
  },
  
  // Section headers
  section: {
    title: `${typographyScale['display-md']} ${fontWeights.title} ${textColors.primary}`,
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
    primary: `${typographyScale['body-lg']} ${fontWeights.ui} ${textColors.secondary} ${textColors['hover-primary']}`,
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
    title: `${typographyScale['display-lg']} ${fontWeights.title} ${textColors.primary}`,
    heading: `${typographyScale['heading-xl']} ${fontWeights.heading} ${textColors.primary}`,
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

// Responsive typography utilities
export const responsiveTextUtils = {
  // Standard 3-breakpoint responsive scale
  'scale-sm': 'text-sm md:text-base lg:text-lg',
  'scale-md': 'text-base md:text-lg lg:text-xl',
  'scale-lg': 'text-lg md:text-xl lg:text-2xl',
  'scale-xl': 'text-xl md:text-2xl lg:text-3xl',
  'scale-2xl': 'text-2xl md:text-3xl lg:text-4xl',
} as const;