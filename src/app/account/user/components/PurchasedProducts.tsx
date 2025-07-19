'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

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
                return 'Con bao hanh';
            case 'expired':
                return 'Het bao hanh';
            case 'expiring':
                return 'Sap het han';
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
                <h2 className="text-2xl font-bold mb-6">San pham da dang ky bao hanh</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            className="bg-[#1a2332] rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            {/* Product Image */}
                            <div className="w-full h-48 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">Hinh san pham</span>
                            </div>

                            {/* Product Info */}
                            <div className="space-y-3">
                                <h3 className="text-lg font-semibold text-white">{product.name}</h3>

                                <div className="text-sm text-gray-400 space-y-1">
                                    <p>
                                        <span className="font-medium">Serial:</span> {product.serial}
                                    </p>
                                    <p>
                                        <span className="font-medium">Ngay mua:</span> {product.purchaseDate}
                                    </p>
                                    <p>
                                        <span className="font-medium">Dai ly:</span> {product.dealer}
                                    </p>
                                </div>

                                {/* Status */}
                                <div
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.warrantyStatus)}`}
                                >
                                    {getStatusText(product.warrantyStatus)}
                                </div>

                                {/* Warranty Info */}
                                <div className="bg-[#0c131d] p-3 rounded-lg border border-gray-600">
                                    <p className="text-sm text-gray-300 mb-1">
                                        <span className="font-medium">Bao hanh den:</span> {product.warrantyEndDate}
                                    </p>
                                    {product.warrantyStatus === 'active' && (
                                        <p className="text-sm text-green-400">Con lai {product.remainingDays} ngay</p>
                                    )}
                                    {product.warrantyStatus === 'expiring' && (
                                        <p className="text-sm text-yellow-400">
                                            Sap het han trong {product.remainingDays} ngay
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setSelectedProduct(product)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2"
                                    >
                                        Xem chi tiet
                                    </Button>
                                    {product.warrantyStatus === 'active' && (
                                        <Button variant="outline" className="flex-1 text-sm py-2">
                                            Bao hanh
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
                        className="bg-[#1a2332] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">Chi tiet san pham</h3>
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
                            <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                                <span className="text-gray-500">Hinh san pham</span>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-xl font-semibold text-white mb-2">{selectedProduct.name}</h4>
                                    <div
                                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedProduct.warrantyStatus)}`}
                                    >
                                        {getStatusText(selectedProduct.warrantyStatus)}
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">Serial:</span> {selectedProduct.serial}
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">Ngay mua:</span>{' '}
                                        {selectedProduct.purchaseDate}
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">Noi mua:</span>{' '}
                                        {selectedProduct.dealer}
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">Gia ban le:</span>{' '}
                                        {formatPrice(selectedProduct.price)}
                                    </p>
                                    <p className="text-gray-300">
                                        <span className="font-medium text-white">Bao hanh den:</span>{' '}
                                        {selectedProduct.warrantyEndDate}
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                        onClick={() => {
                                            setSelectedProduct(null);
                                            onWarrantyExtension?.(selectedProduct);
                                        }}
                                    >
                                        Gia han bao hanh
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setSelectedProduct(null);
                                            onWarrantyRequest?.(selectedProduct);
                                        }}
                                    >
                                        Yeu cau bao hanh
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
