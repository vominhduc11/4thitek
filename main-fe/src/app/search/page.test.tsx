/* eslint-disable @next/next/no-img-element, react/display-name */
// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SearchPage from './page';

const { searchParamsState, pushMock, searchMock, translateMock, getTranslationMock } = vi.hoisted(() => ({
    searchParamsState: { value: '' },
    pushMock: vi.fn(),
    searchMock: vi.fn(),
    translateMock: (key: string) =>
        (
            {
                'nav.home': 'Home',
                'search.page.breadcrumb': 'Search',
                'search.page.backHomeAria': 'Back home',
                'search.page.resultsTitle': 'Search results',
                'search.page.emptyTitle': 'Start searching',
                'search.page.emptyBody': 'Enter a keyword to search products and blogs.',
                'search.page.noResultsTitle': 'No results',
                'search.page.noResultsBody': 'No matches for {query}',
                'search.page.queryLabel': 'Query',
                'search.page.resultsCount': '{count} results',
                'search.placeholder': 'Search products and blogs',
                'search.tabs.all': 'All',
                'search.tabs.products': 'Products',
                'search.tabs.blogs': 'Blogs',
                'search.type.product': 'Product',
                'search.type.blog': 'Blog'
            } as Record<string, string>
        )[key] ?? key,
    getTranslationMock: (key: string) =>
        (
            {
                'search.page.suggestions.default': ['SCS', 'Bluetooth'],
                'search.page.suggestions.noResults': ['Helmet', 'Review']
            } as Record<string, string[]>
        )[key] ?? []
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock
    }),
    useSearchParams: () => new URLSearchParams(searchParamsState.value)
}));

vi.mock('next/link', () => ({
    default: ({
        href,
        children,
        ...props
    }: {
        href: string;
        children: React.ReactNode;
    }) => (
        <a href={href} {...props}>
            {children}
        </a>
    )
}));

vi.mock('next/image', () => ({
    default: (props: {
        src: string;
        alt: string;
        fill?: boolean;
    }) => {
        const { src, alt, fill, ...rest } = props;
        void fill;
        return <img src={src} alt={alt} {...rest} />;
    }
}));

vi.mock('framer-motion', () => {
    const createMotion = (tag: keyof React.JSX.IntrinsicElements) =>
        (props: React.PropsWithChildren<Record<string, unknown>>) => {
            const { children, ...rest } = props;
            const safeProps = { ...rest };
            delete safeProps.whileHover;
            delete safeProps.variants;
            delete safeProps.initial;
            delete safeProps.animate;
            delete safeProps.exit;
            delete safeProps.transition;
            return React.createElement(tag, safeProps, children);
        };

    return {
        AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        motion: {
            div: createMotion('div'),
            form: createMotion('form'),
            article: createMotion('article'),
            button: createMotion('button')
        }
    };
});

vi.mock('@/components/ui/AvoidSidebar', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

vi.mock('@/components/ui/Hero', () => ({
    default: () => <div data-testid="hero" />
}));

vi.mock('@/context/LanguageContext', () => ({
    useLanguage: () => ({
        t: translateMock,
        getTranslation: getTranslationMock
    })
}));

vi.mock('@/services/apiService', () => ({
    apiService: {
        search: searchMock
    }
}));

vi.mock('@/hooks/useDebounce', () => ({
    useDebounce: <T,>(value: T) => value
}));

describe('SearchPage', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        searchParamsState.value = '';
        pushMock.mockReset();
        searchMock.mockReset();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        cleanup();
        consoleErrorSpy.mockRestore();
    });

    it('renders the empty search state when there is no query', () => {
        render(<SearchPage />);

        expect(screen.getByText('Start searching')).toBeTruthy();
        expect(screen.getByRole('button', { name: 'SCS' })).toBeTruthy();
        expect(searchMock).not.toHaveBeenCalled();
    });

    it('loads results for the debounced query and lets the user filter to products only', async () => {
        searchParamsState.value = 'q=headset';
        let resolveSearch: ((value: unknown) => void) | null = null;
        searchMock.mockImplementation(
            () =>
                new Promise((resolve) => {
                    resolveSearch = resolve;
                })
        );

        const user = userEvent.setup();
        const { container } = render(<SearchPage />);

        await waitFor(() => {
            expect(searchMock).toHaveBeenCalledWith('headset', 20);
        });

        expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);

        resolveSearch?.({
            success: true,
            data: {
                products: [
                    {
                        id: 101,
                        name: 'SCS S10',
                        shortDescription: 'Wireless headset',
                        image: '/product.png'
                    }
                ],
                blogs: [
                    {
                        id: 202,
                        title: 'Helmet review',
                        description: 'Field notes',
                        image: '/blog.png',
                        category: 'Guides'
                    }
                ]
            }
        });

        await screen.findByText('SCS S10');
        expect(screen.getByText('Helmet review')).toBeTruthy();

        await user.click(screen.getByRole('button', { name: 'Products (1)' }));

        expect(screen.getByText('SCS S10')).toBeTruthy();
        expect(screen.queryByText('Helmet review')).toBeNull();
    });

    it('falls back to the no-results state when the upstream search fails', async () => {
        searchParamsState.value = 'q=unknown';
        searchMock.mockResolvedValue({
            success: false,
            error: 'Search failed',
            data: {
                products: [],
                blogs: []
            }
        });

        render(<SearchPage />);

        await waitFor(() => {
            expect(searchMock).toHaveBeenCalledWith('unknown', 20);
        });

        expect(await screen.findByText('No results')).toBeTruthy();
        expect(screen.getByText('No matches for unknown')).toBeTruthy();
    });

    it('pushes the right route when the user submits a query or clears it', async () => {
        const user = userEvent.setup();
        searchMock.mockResolvedValue({
            success: true,
            data: {
                products: [],
                blogs: []
            }
        });
        render(<SearchPage />);

        const input = screen.getByPlaceholderText('Search products and blogs');
        await user.type(input, 'smart helmet');
        fireEvent.submit(input.closest('form')!);

        expect(pushMock).toHaveBeenCalledWith('/search?q=smart%20helmet');

        await user.clear(input);
        fireEvent.submit(input.closest('form')!);

        expect(pushMock).toHaveBeenCalledWith('/search');
    });
});
