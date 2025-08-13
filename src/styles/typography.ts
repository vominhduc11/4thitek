// Typography Design System for 4THITEK Website
// Centralized typography tokens for consistent styling across components

export const typographyScale = {
  // Display sizes (for hero titles and main headings) - Enhanced for ultra-wide screens
  'display-xl': 'text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl 3xl:text-9xl 4xl:text-[6rem] 5xl:text-[7rem]',
  'display-lg': 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl 4xl:text-9xl 5xl:text-[6rem]', 
  'display-md': 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl 4xl:text-8xl 5xl:text-9xl',
  'display-sm': 'text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl 4xl:text-7xl 5xl:text-8xl',
  
  // Heading sizes (for section headers) - Enhanced for ultra-wide screens
  'heading-xl': 'text-lg md:text-xl lg:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl 5xl:text-6xl',
  'heading-lg': 'text-base md:text-lg lg:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl',
  'heading-md': 'text-sm md:text-base lg:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl 5xl:text-4xl',
  'heading-sm': 'text-xs md:text-sm lg:text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl 5xl:text-3xl',
  
  // Body text sizes - Enhanced for ultra-wide screens
  'body-xl': 'text-base md:text-lg lg:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl',
  'body-lg': 'text-sm md:text-base lg:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl 5xl:text-4xl',
  'body-md': 'text-xs md:text-sm lg:text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl 5xl:text-3xl',
  'body-sm': 'text-xs md:text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl 5xl:text-2xl',
  
  // Caption and small text - Enhanced for ultra-wide screens
  'caption-lg': 'text-xs md:text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl 5xl:text-2xl',
  'caption': 'text-xs 2xl:text-sm 3xl:text-base 4xl:text-lg 5xl:text-xl',
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

// Responsive typography utilities - Enhanced for ultra-wide screens
export const responsiveTextUtils = {
  // Comprehensive responsive scales for all screen sizes
  'scale-xs': 'text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl',
  'scale-sm': 'text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl',
  'scale-md': 'text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl 5xl:text-6xl',
  'scale-lg': 'text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl 3xl:text-5xl 4xl:text-6xl 5xl:text-7xl',
  'scale-xl': 'text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl 4xl:text-7xl 5xl:text-8xl',
  'scale-2xl': 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl 4xl:text-8xl 5xl:text-9xl',
  'scale-3xl': 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl 4xl:text-9xl 5xl:text-[6rem]',
} as const;

// Ultra-wide screen spacing utilities
export const ultraWideSpacing = {
  // Container padding that scales with screen size
  'container-padding': 'px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 3xl:px-24 4xl:px-32 5xl:px-40',
  
  // Section spacing that scales with screen size
  'section-spacing': 'py-8 sm:py-12 md:py-16 lg:py-20 xl:py-24 2xl:py-28 3xl:py-32 4xl:py-40 5xl:py-48',
  
  // Grid gaps that scale with screen size
  'grid-gap-sm': 'gap-4 lg:gap-6 2xl:gap-8 3xl:gap-10 4xl:gap-12 5xl:gap-16',
  'grid-gap-md': 'gap-6 lg:gap-8 2xl:gap-10 3xl:gap-12 4xl:gap-16 5xl:gap-20',
  'grid-gap-lg': 'gap-8 lg:gap-10 2xl:gap-12 3xl:gap-16 4xl:gap-20 5xl:gap-24',
  
  // Content max-widths for ultra-wide screens
  'content-width-sm': 'max-w-2xl 3xl:max-w-3xl 4xl:max-w-4xl 5xl:max-w-5xl',
  'content-width-md': 'max-w-4xl 3xl:max-w-5xl 4xl:max-w-6xl 5xl:max-w-7xl',
  'content-width-lg': 'max-w-6xl 3xl:max-w-7xl 4xl:max-w-[2000px] 5xl:max-w-[2400px]',
  'content-width-xl': 'max-w-7xl 4xl:max-w-[2400px] 5xl:max-w-[2800px]',
} as const;