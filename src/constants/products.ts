// Shared product series constants to ensure consistency across pages

export const SERIES_LIST = ['SX SERIES', 'S SERIES', 'G SERIES', 'G+ SERIES'] as const;

export type SeriesType = (typeof SERIES_LIST)[number];

export const SERIES_INFO = {
    'SX SERIES': {
        label: 'SX SERIES',
        displayName: 'SX Series',
        category: 'Premium',
        description: 'Premium communication devices with advanced features and superior build quality.',
        productCount: 5
    },
    'S SERIES': {
        label: 'S SERIES',
        displayName: 'S Series',
        category: 'Professional',
        description: 'Professional-grade communication solutions for everyday use.',
        productCount: 4
    },
    'G SERIES': {
        label: 'G SERIES',
        displayName: 'G Series',
        category: 'Advanced',
        description: 'Advanced communication systems with military-grade durability.',
        productCount: 4
    },
    'G+ SERIES': {
        label: 'G+ SERIES',
        displayName: 'G+ Series',
        category: 'Ultimate',
        description: 'Ultimate performance communication devices with cutting-edge technology.',
        productCount: 5
    }
} as const;

export const TOTAL_PRODUCTS = Object.values(SERIES_INFO).reduce((sum, series) => sum + series.productCount, 0);
