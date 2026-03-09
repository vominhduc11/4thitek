'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiPackage } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { apiService } from '@/services/apiService';
import { parseImageUrl } from '@/utils/media';
import { useLanguage } from '@/context/LanguageContext';

type ProductCard = {
    id: string;
    name: string;
    sku?: string;
    shortDescription: string;
    image: string;
};

export default function ProductSeries() {
    const { t } = useLanguage();
    const [products, setProducts] = useState<ProductCard[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<ProductCard | null>(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const response = await apiService.fetchHomepageProducts();
                const nextProducts = (response.data ?? []).map((product) => ({
                    id: String(product.id),
                    name: product.name,
                    sku: product.sku,
                    shortDescription: product.shortDescription,
                    image: parseImageUrl(product.image),
                }));
                setProducts(nextProducts);
                setSelectedProduct(nextProducts[0] ?? null);
            } catch (error) {
                console.error('Error fetching homepage products:', error);
                setProducts([]);
                setSelectedProduct(null);
            }
        };

        void loadProducts();
    }, []);

    return (
        <section className="bg-[#0c131d] text-white py-16 lg:py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0c131d] to-[#1a1f2e] opacity-50"></div>
            <div className="absolute top-20 right-10 w-96 h-96 bg-[#4FC8FF]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#00D4FF]/5 rounded-full blur-3xl"></div>

            <div className="ml-0 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                            {t('products.showcase.titlePrimary')}{' '}
                            <span className="bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] bg-clip-text text-transparent">
                                {t('products.showcase.titleHighlight')}
                            </span>
                        </h2>
                        <div className="w-32 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full mb-6"></div>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            {t('products.showcase.description')}
                        </p>
                    </motion.div>

                    {products.length === 0 ? (
                        <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-gray-400">
                            {t('products.loadingMessage')}
                        </div>
                    ) : (
                        <>
                            <motion.div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-16" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} viewport={{ once: true }}>
                                {products.map((product, index) => {
                                    const isSelected = selectedProduct?.id === product.id;
                                    return (
                                        <motion.button
                                            key={product.id}
                                            onClick={() => setSelectedProduct(product)}
                                            className={`relative p-4 rounded-xl border transition-all duration-300 overflow-hidden group ${isSelected ? 'border-[#4FC8FF] bg-[#4FC8FF]/10' : 'border-gray-600 hover:border-[#4FC8FF]/50'}`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.08 }}
                                        >
                                            <div className="aspect-square mb-3 flex items-center justify-center rounded-xl bg-white/5">
                                                {product.image ? (
                                                    <Image src={product.image} alt={product.name} width={80} height={80} className="object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                                                ) : (
                                                    <FiPackage className="h-10 w-10 text-gray-500" />
                                                )}
                                            </div>
                                            <div className="text-center">
                                                <h4 className={`text-xs font-medium mb-1 line-clamp-2 ${isSelected ? 'text-[#4FC8FF]' : 'text-gray-300 group-hover:text-white'}`}>{product.name}</h4>
                                                <p className="text-xs text-gray-500 line-clamp-1">{product.sku || '4ThiTek'}</p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {selectedProduct ? (
                                    <motion.div key={selectedProduct.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.5 }} className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                                        <div className="space-y-8">
                                            <div>
                                                <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-[#4FC8FF]">{selectedProduct.name}</h3>
                                                <p className="text-lg text-gray-300 leading-relaxed mb-6">{selectedProduct.shortDescription}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-4">
                                                <Link href={`/products/${selectedProduct.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#00d4ff] px-6 py-3 font-semibold text-[#0c131d] transition hover:bg-[#38dfff]">
                                                    {t('products.showcase.cta')}
                                                    <FiArrowRight className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        </div>

                                        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8">
                                            <div className="relative aspect-square">
                                                {selectedProduct.image ? (
                                                    <Image src={selectedProduct.image} alt={selectedProduct.name} fill className="object-contain" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center rounded-3xl border border-dashed border-white/10 text-gray-500">
                                                        <FiPackage className="h-12 w-12" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
