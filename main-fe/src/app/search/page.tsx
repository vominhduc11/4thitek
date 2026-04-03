'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowLeft, FiArrowRight, FiBookOpen, FiFilter, FiPackage, FiSearch, FiX } from 'react-icons/fi';
import Hero from '@/components/ui/Hero';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import { useDebounce } from '@/hooks/useDebounce';
import { buildBlogPath, buildProductPath } from '@/lib/slug';
import { apiService } from '@/services/apiService';
import { parseImageUrl } from '@/utils/media';

interface SearchResult {
    type: 'product' | 'blog';
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    href: string;
    category?: string;
}

const sectionVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5
        }
    }
};

function SearchContent() {
    const { t, getTranslation } = useLanguage();
    const router = useRouter();
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'products' | 'blogs'>('all');
    const [searchInput, setSearchInput] = useState(query);

    const debouncedSearchInput = useDebounce(searchInput, 500);

    useEffect(() => {
        const searchQuery = debouncedSearchInput.trim();

        if (!searchQuery) {
            setResults([]);
            return;
        }

        const performSearch = async () => {
            setIsLoading(true);
            try {
                const response = await apiService.search(searchQuery, 20);

                if (!response.success) {
                    console.error('Search failed:', response.error);
                    setResults([]);
                    return;
                }

                const searchResults: SearchResult[] = [];
                const data = response.data ?? { products: [], blogs: [] };

                data.products.forEach(
                    (product: { id: string | number; name: string; shortDescription: string; image: string }) => {
                        const productId = product.id?.toString().trim();
                        if (!productId) {
                            return;
                        }

                        searchResults.push({
                            type: 'product',
                            id: productId,
                            title: product.name,
                            subtitle: product.shortDescription,
                            image: parseImageUrl(product.image),
                            href: buildProductPath(productId, product.name),
                            category: t('search.type.product')
                        });
                    }
                );

                data.blogs.forEach(
                    (blog: {
                        id: string | number;
                        title: string;
                        description: string;
                        image: string;
                        category?: string;
                    }) => {
                        const blogId = blog.id?.toString().trim();
                        if (!blogId) {
                            return;
                        }

                        searchResults.push({
                            type: 'blog',
                            id: blogId,
                            title: blog.title,
                            subtitle: blog.description,
                            image: parseImageUrl(blog.image),
                            href: buildBlogPath(blogId, blog.title),
                            category: blog.category || t('search.type.blog')
                        });
                    }
                );

                setResults(searchResults);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        void performSearch();
    }, [debouncedSearchInput, t]);

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    const filteredResults = useMemo(() => {
        return results.filter((result) => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'products') return result.type === 'product';
            if (activeFilter === 'blogs') return result.type === 'blog';
            return true;
        });
    }, [results, activeFilter]);

    const handleSearch = (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedInput = searchInput.trim();
        if (trimmedInput) {
            router.push(`/search?q=${encodeURIComponent(trimmedInput)}`);
            return;
        }

        router.push('/search');
    };

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('search.page.breadcrumb'), active: true }
    ];

    const productCount = results.filter((result) => result.type === 'product').length;
    const blogCount = results.filter((result) => result.type === 'blog').length;
    const defaultSuggestions = (getTranslation('search.page.suggestions.default') as string[]) || [];
    const noResultsSuggestions = (getTranslation('search.page.suggestions.noResults') as string[]) || [];
    const filterTabs = [
        { id: 'all', label: t('search.tabs.all'), count: results.length },
        { id: 'products', label: t('search.tabs.products'), count: productCount },
        { id: 'blogs', label: t('search.tabs.blogs'), count: blogCount }
    ] as const;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#06111B] text-white">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-topo opacity-35" />
                <div className="absolute left-[-8rem] top-20 h-72 w-72 rounded-full bg-[rgba(41,171,226,0.16)] blur-3xl" />
                <div className="absolute bottom-24 right-[-6rem] h-80 w-80 rounded-full bg-[rgba(0,113,188,0.16)] blur-3xl" />
            </div>

            <Hero
                breadcrumbItems={breadcrumbItems}
                breadcrumbWrapperClassName="ml-0 sm:ml-16 md:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
            />

            <section className="relative py-10 sm:py-12 md:py-16">
                <div className="brand-shell ml-0 space-y-8 sm:ml-16 md:ml-20">
                    <motion.div
                        className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
                        initial="hidden"
                        animate="visible"
                        variants={sectionVariants}
                    >
                        <div className="space-y-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:text-white"
                                aria-label={t('search.page.backHomeAria')}
                            >
                                <FiArrowLeft className="h-4 w-4" />
                                {t('nav.home')}
                            </Link>
                            <div className="max-w-3xl space-y-3">
                                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--brand-blue)]">
                                    TK HiTek Discovery
                                </p>
                                <h1 className="font-serif text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                                    {t('search.page.resultsTitle')}
                                </h1>
                                <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                                    Search products and content in one place while keeping the same road-ready,
                                    high-clarity TK HiTek visual language.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] px-4 py-2 text-sm text-[var(--text-secondary)] shadow-[0_18px_42px_rgba(0,113,188,0.12)]">
                            <FiFilter className="h-4 w-4 text-[var(--brand-blue)]" />
                            <span>{filteredResults.length} results visible</span>
                        </div>
                    </motion.div>

                    <motion.form
                        onSubmit={handleSearch}
                        className="brand-card rounded-[30px] p-4 sm:p-5"
                        initial="hidden"
                        animate="visible"
                        variants={sectionVariants}
                    >
                        <div className="relative">
                            <FiSearch
                                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                                style={{
                                    color: searchInput ? 'var(--brand-blue)' : 'var(--text-muted)'
                                }}
                            />
                            <Input
                                type="text"
                                placeholder={t('search.placeholder')}
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                className="h-14 rounded-full border-[var(--brand-border)] pl-12 pr-12 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                            />
                            <AnimatePresence>
                                {searchInput && (
                                    <motion.button
                                        key="clear"
                                        type="button"
                                        onClick={() => setSearchInput('')}
                                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-transparent text-[var(--text-muted)] transition-all duration-200 hover:border-[var(--brand-border)] hover:bg-[rgba(41,171,226,0.1)] hover:text-[var(--text-primary)]"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                    >
                                        <FiX className="h-4 w-4" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.form>

                    <AnimatePresence mode="wait">
                        {debouncedSearchInput ? (
                            <motion.div
                                key="search-meta"
                                className="space-y-5"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                            {t('search.page.queryLabel')}
                                        </p>
                                        <p className="text-lg font-semibold text-[var(--text-primary)] sm:text-xl">
                                            <span className="bg-[linear-gradient(135deg,var(--brand-gradient-start),var(--brand-gradient-end))] bg-clip-text text-transparent">
                                                &ldquo;{debouncedSearchInput}&rdquo;
                                            </span>
                                        </p>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {t('search.page.resultsCount').replace(
                                                '{count}',
                                                String(filteredResults.length)
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {filterTabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveFilter(tab.id)}
                                                className={`inline-flex h-11 items-center rounded-full px-4 text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-200 sm:text-sm ${
                                                    activeFilter === tab.id
                                                        ? 'brand-button-primary shadow-[0_18px_42px_rgba(0,113,188,0.18)]'
                                                        : 'brand-button-secondary text-[var(--text-secondary)] hover:text-white'
                                                }`}
                                            >
                                                {tab.label} ({tab.count})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="search-empty"
                                className="brand-card rounded-[32px] p-8 text-center sm:p-10"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                                transition={{ duration: 0.25 }}
                            >
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.12)] shadow-[0_0_0_12px_rgba(41,171,226,0.04)]">
                                    <FiSearch className="h-9 w-9 text-[var(--brand-blue)]" />
                                </div>
                                <h2 className="mt-6 font-serif text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
                                    {t('search.page.emptyTitle')}
                                </h2>
                                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                                    {t('search.page.emptyBody')}
                                </p>
                                <div className="mt-8 flex flex-wrap justify-center gap-3">
                                    {defaultSuggestions.map((suggestion) => (
                                        <button
                                            key={suggestion}
                                            type="button"
                                            onClick={() => router.push(`/search?q=${encodeURIComponent(suggestion)}`)}
                                            className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.12)] hover:text-white"
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="min-h-[320px]">
                        {isLoading ? (
                            <motion.div
                                className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.08
                                        }
                                    }
                                }}
                            >
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <motion.div
                                        key={`skeleton-${index}`}
                                        className="brand-card rounded-[28px] p-4 sm:p-5"
                                        variants={sectionVariants}
                                    >
                                        <div className="aspect-[16/10] rounded-[22px] bg-[linear-gradient(135deg,rgba(63,72,86,0.36),rgba(17,30,45,0.72))] animate-pulse" />
                                        <div className="mt-5 space-y-3">
                                            <div className="h-4 w-24 rounded-full bg-[rgba(41,171,226,0.18)] animate-pulse" />
                                            <div className="h-5 rounded-full bg-white/8 animate-pulse" />
                                            <div className="h-4 w-5/6 rounded-full bg-white/6 animate-pulse" />
                                            <div className="h-4 w-2/3 rounded-full bg-white/6 animate-pulse" />
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : debouncedSearchInput && filteredResults.length > 0 ? (
                            <motion.div
                                className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: {
                                            staggerChildren: 0.08
                                        }
                                    }
                                }}
                            >
                                {filteredResults.map((result) => {
                                    const Icon = result.type === 'product' ? FiPackage : FiBookOpen;
                                    const toneClass =
                                        result.type === 'product'
                                            ? 'border-[rgba(41,171,226,0.32)] bg-[rgba(41,171,226,0.14)] text-[var(--brand-blue)]'
                                            : 'border-[rgba(5,167,175,0.28)] bg-[rgba(5,167,175,0.14)] text-[var(--support-teal)]';

                                    return (
                                        <motion.article
                                            key={`${result.type}-${result.id}`}
                                            variants={sectionVariants}
                                            whileHover={{ y: -6 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Link
                                                href={result.href}
                                                className="brand-card group flex h-full flex-col rounded-[28px] p-4 transition-all duration-300 hover:border-[var(--brand-border-strong)] hover:shadow-[0_24px_44px_rgba(0,113,188,0.18)] sm:p-5"
                                            >
                                                <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] border border-[var(--brand-border)] bg-[linear-gradient(135deg,rgba(17,30,45,0.88),rgba(7,17,27,0.94))]">
                                                    {result.image ? (
                                                        <Image
                                                            src={result.image}
                                                            alt={result.title}
                                                            fill
                                                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <Icon className="h-10 w-10 text-[var(--brand-blue)]" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,27,0.04),rgba(6,17,27,0.68))]" />
                                                    <span
                                                        className={`absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${toneClass}`}
                                                    >
                                                        <Icon className="h-3.5 w-3.5" />
                                                        {result.type === 'product'
                                                            ? t('search.type.product')
                                                            : t('search.type.blog')}
                                                    </span>
                                                </div>

                                                <div className="mt-5 flex flex-1 flex-col">
                                                    <h3 className="text-lg font-semibold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--brand-blue)]">
                                                        {result.title}
                                                    </h3>
                                                    {result.subtitle && (
                                                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-secondary)]">
                                                            {result.subtitle}
                                                        </p>
                                                    )}
                                                    <div className="mt-4 flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-blue)]" />
                                                            {result.category}
                                                        </div>
                                                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-blue)]">
                                                            Open
                                                            <FiArrowRight className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </motion.article>
                                    );
                                })}
                            </motion.div>
                        ) : debouncedSearchInput ? (
                            <motion.div
                                className="brand-card rounded-[32px] p-8 text-center sm:p-10"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)]">
                                    <FiSearch className="h-9 w-9 text-[var(--text-muted)]" />
                                </div>
                                <h2 className="mt-6 font-serif text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
                                    {t('search.page.noResultsTitle')}
                                </h2>
                                <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">
                                    {t('search.page.noResultsBody').replace('{query}', debouncedSearchInput)}
                                </p>
                                <div className="mt-8 flex flex-wrap justify-center gap-3">
                                    {noResultsSuggestions.map((suggestion) => (
                                        <Link
                                            key={suggestion}
                                            href={`/search?q=${encodeURIComponent(suggestion)}`}
                                            className="inline-flex items-center rounded-full border border-[var(--brand-border)] bg-[rgba(41,171,226,0.08)] px-4 py-2 text-sm font-medium text-[var(--brand-blue)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.16)] hover:text-white"
                                        >
                                            {suggestion}
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        ) : null}
                    </div>
                </div>
            </section>
        </div>
    );
}

function SearchFallback() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#06111B] px-4 text-white">
            <div className="brand-card rounded-[28px] px-8 py-10 text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
                <p className="mt-4 text-sm text-[var(--text-secondary)]">Loading search experience...</p>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchFallback />}>
            <SearchContent />
        </Suspense>
    );
}
