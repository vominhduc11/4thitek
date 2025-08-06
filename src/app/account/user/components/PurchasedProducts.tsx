'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface Product {
    id: string;
    name: string;
    serial: string;
    purchaseDate: string;
    warrantyStatus: 'active' | 'expired' | 'expiring';
    warrantyEndDate: string;
    remainingDays: number;
    image: string;
    price: number;
    dealer: string;
}

interface PurchasedProductsProps {
    onWarrantyExtension?: (product: Product) => void;
    onWarrantyRequest?: (product: Product) => void;
}

const PurchasedProducts = ({ onWarrantyExtension, onWarrantyRequest }: PurchasedProductsProps) => {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const { t } = useLanguage();

    // Mock data - trong thực tế sẽ lấy từ API
    const mockProducts: Product[] = [
        {
            id: '1',
            name: 'Laptop Gaming 4T Pro',
            serial: 'ABC123456',
            purchaseDate: '15/03/2023',
            warrantyStatus: 'active',
            warrantyEndDate: '15/03/2025',
            remainingDays: 245,
            image: '/products/product1.png',
            price: 25000000,
            dealer: 'Sieu thi dien may XYZ'
        },
        {
            id: '2',
            name: 'Man hinh Gaming 4T Ultra',
            serial: 'DEF789012',
            purchaseDate: '10/01/2022',
            warrantyStatus: 'expired',
            warrantyEndDate: '10/01/2024',
            remainingDays: 0,
            image: '/products/product2.png',
            price: 8000000,
            dealer: 'Cua hang cong nghe ABC'
        },
        {
            id: '3',
            name: 'Chuot Gaming 4T Elite',
            serial: 'GHI456789',
            purchaseDate: '20/11/2023',
            warrantyStatus: 'expiring',
            warrantyEndDate: '20/11/2024',
            remainingDays: 30,
            image: '/products/product3.png',
            price: 1200000,
            dealer: 'Cua hang game gear'
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'text-green-400 bg-green-900/30';
            case 'expired':
                return 'text-red-400 bg-red-900/30';
            case 'expiring':
                return 'text-yellow-400 bg-yellow-900/30';
            default:
                return 'text-gray-400 bg-gray-800/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return t('account.active');
            case 'expired':
                return t('account.expired');
            case 'expiring':
                return t('account.expiring');
            default:
                return 'Khong xac dinh';
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h2 className="text-xl font-bold mb-6 text-white">{t('account.registeredProducts')}</h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {mockProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            className="bg-[#0c131d]/50 rounded-xl p-5 border border-gray-700/40 hover:border-gray-600/60 transition-all duration-300 hover:shadow-lg backdrop-blur-sm group"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            whileHover={{ scale: 1.01 }}
                        >
                            {/* Product Image */}
                            <div className="w-full h-40 bg-gray-800/50 rounded-lg mb-4 flex items-center justify-center border border-gray-700/30 group-hover:border-gray-600/50 transition-all duration-300">
                                <span className="text-gray-500 text-xs">{t('account.productImage')}</span>
                            </div>

                            {/* Product Info */}
                            <div className="space-y-3">
                                <h3 className="text-base font-semibold text-white group-hover:text-blue-300 transition-colors duration-300 line-clamp-2">{product.name}</h3>

                                <div className="text-xs text-gray-400 space-y-1">
                                    <p>
                                        <span className="font-medium text-gray-300">{t('account.serial')}:</span> {product.serial}
                                    </p>
                                    <p>
                                        <span className="font-medium text-gray-300">{t('account.purchaseDate')}:</span> {product.purchaseDate}
                                    </p>
                                    <p className="truncate">
                                        <span className="font-medium text-gray-300">{t('account.dealer')}:</span> {product.dealer}
                                    </p>
                                </div>

                                {/* Status */}
                                <div
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.warrantyStatus)}`}
                                >
                                    {getStatusText(product.warrantyStatus)}
                                </div>

                                {/* Warranty Info */}
                                <div className="bg-[#1a2332]/40 p-3 rounded-lg border border-gray-600/30">
                                    <p className="text-xs text-gray-300 mb-1">
                                        <span className="font-medium">{t('account.warrantyUntil')}:</span> {product.warrantyEndDate}
                                    </p>
                                    {product.warrantyStatus === 'active' && (
                                        <p className="text-xs text-green-400">{product.remainingDays} {t('account.remainingDays')}</p>
                                    )}
                                    {product.warrantyStatus === 'expiring' && (
                                        <p className="text-xs text-yellow-400">
                                            {t('account.expiringIn')} {product.remainingDays} {t('account.days')}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setSelectedProduct(product)}
                                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 text-xs py-2 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300"
                                    >
                                        {t('account.viewDetails')}
                                    </Button>
                                    {product.warrantyStatus === 'active' && (
                                        <Button
                                            variant="outline"
                                            className="flex-1 text-xs py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 border-green-500/30 hover:border-green-400/50"
                                        >
                                            {t('account.warranty')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <motion.div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedProduct(null)}
                >
                    <motion.div
                        className="bg-[#1a2332]/90 backdrop-blur-md rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">{t('account.productDetails')}</h3>
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="w-full h-64 bg-gray-800/50 rounded-lg flex items-center justify-center border border-gray-700/30">
                                <span className="text-gray-500 text-sm">{t('account.productImage')}</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-white mb-2">{selectedProduct.name}</h4>
                                    <div
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProduct.warrantyStatus)}`}
                                    >
                                        {getStatusText(selectedProduct.warrantyStatus)}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">{t('account.serial')}:</span> {selectedProduct.serial}
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">{t('account.purchaseDate')}:</span>{' '}
                                        {selectedProduct.purchaseDate}
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">{t('account.purchaseLocation')}:</span>{' '}
                                        {selectedProduct.dealer}
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">{t('account.retailPrice')}:</span>{' '}
                                        {formatPrice(selectedProduct.price)}
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">{t('account.warrantyUntil')}:</span>{' '}
                                        {selectedProduct.warrantyEndDate}
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50"
                                        onClick={() => {
                                            setSelectedProduct(null);
                                            onWarrantyExtension?.(selectedProduct);
                                        }}
                                    >
                                        {t('account.extendWarranty')}
                                    </Button>
                                    <Button
                                        className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 hover:text-orange-300 border border-orange-500/30 hover:border-orange-400/50"
                                        onClick={() => {
                                            setSelectedProduct(null);
                                            onWarrantyRequest?.(selectedProduct);
                                        }}
                                    >
                                        {t('account.requestWarranty')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default PurchasedProducts;
