'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ExtensionPlan {
    id: string;
    duration: string;
    price: number;
    features: string[];
    popular?: boolean;
}

const WarrantyExtension = () => {
    const [selectedProduct, setSelectedProduct] = useState('');
    const [selectedPlan, setSelectedPlan] = useState<ExtensionPlan | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const eligibleProducts = [
        { id: '1', name: 'Laptop Gaming 4T Pro', serial: 'ABC123456', expiry: '15/03/2025' },
        { id: '3', name: 'Chuot Gaming 4T Elite', serial: 'GHI456789', expiry: '20/11/2024' }
    ];

    const extensionPlans: ExtensionPlan[] = [
        {
            id: '1',
            duration: '6 thang',
            price: 500000,
            features: ['Ho tro ky thuat', 'Sua chua mien phi', 'Doi linh kien']
        },
        {
            id: '2',
            duration: '1 nam',
            price: 800000,
            features: ['Ho tro ky thuat', 'Sua chua mien phi', 'Doi linh kien', 'Bao hanh tai nha'],
            popular: true
        },
        {
            id: '3',
            duration: '2 nam',
            price: 1200000,
            features: ['Ho tro ky thuat', 'Sua chua mien phi', 'Doi linh kien', 'Bao hanh tai nha', 'Uu tien ho tro']
        }
    ];

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    const handleExtension = async () => {
        if (!selectedProduct || !selectedPlan) return;

        setIsLoading(true);
        try {
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            alert('Gia han bao hanh thanh cong!');
        } catch {
            alert('Co loi xay ra, vui long thu lai!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h2 className="text-2xl font-bold mb-6">Gia han bao hanh</h2>

                {/* Product Selection */}
                <div className="bg-[#1a2332] rounded-lg p-6 border border-gray-700 mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Chon san pham</h3>

                    <div className="space-y-3">
                        {eligibleProducts.map((product, index) => (
                            <motion.div
                                key={product.id}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                                    selectedProduct === product.id
                                        ? 'border-blue-500 bg-blue-900/20'
                                        : 'border-gray-600 hover:border-gray-500'
                                }`}
                                onClick={() => setSelectedProduct(product.id)}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-white">{product.name}</h4>
                                        <p className="text-sm text-gray-400">Serial: {product.serial}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">Het han:</p>
                                        <p className="text-sm font-medium text-white">{product.expiry}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Extension Plans */}
                {selectedProduct && (
                    <motion.div
                        className="bg-[#1a2332] rounded-lg p-6 border border-gray-700 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Chon goi gia han</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {extensionPlans.map((plan, index) => (
                                <motion.div
                                    key={plan.id}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 relative ${
                                        selectedPlan?.id === plan.id
                                            ? 'border-blue-500 bg-blue-900/20'
                                            : 'border-gray-600 hover:border-gray-500'
                                    }`}
                                    onClick={() => setSelectedPlan(plan)}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                                            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                                Pho bien
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center mb-4">
                                        <h4 className="font-semibold text-white text-lg">{plan.duration}</h4>
                                        <p className="text-2xl font-bold text-blue-400">{formatPrice(plan.price)}</p>
                                    </div>

                                    <ul className="space-y-2">
                                        {plan.features.map((feature, featureIndex) => (
                                            <li
                                                key={featureIndex}
                                                className="text-sm text-gray-300 flex items-center gap-2"
                                            >
                                                <span className="text-green-400">✓</span>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Payment Form */}
                {selectedProduct && selectedPlan && (
                    <motion.div
                        className="bg-[#1a2332] rounded-lg p-6 border border-gray-700"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h3 className="text-lg font-semibold text-white mb-4">Thong tin thanh toan</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Ten chu the</label>
                                    <Input placeholder="Nhap ten chu the" className="w-full" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">So the</label>
                                    <Input placeholder="1234 5678 9012 3456" className="w-full" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Thang/Nam
                                        </label>
                                        <Input placeholder="MM/YY" className="w-full" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">CVV</label>
                                        <Input placeholder="123" className="w-full" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#0c131d] p-4 rounded-lg border border-gray-600">
                                <h4 className="font-medium text-white mb-3">Tong ket don hang</h4>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">San pham:</span>
                                        <span className="text-white">
                                            {eligibleProducts.find((p) => p.id === selectedProduct)?.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Goi gia han:</span>
                                        <span className="text-white">{selectedPlan.duration}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">VAT (10%):</span>
                                        <span className="text-white">{formatPrice(selectedPlan.price * 0.1)}</span>
                                    </div>
                                    <hr className="border-gray-600" />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span className="text-white">Tong cong:</span>
                                        <span className="text-blue-400">{formatPrice(selectedPlan.price * 1.1)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-4">
                            <Button
                                onClick={handleExtension}
                                disabled={isLoading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Dang xu ly...
                                    </div>
                                ) : (
                                    'Xac nhan gia han'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className="px-6"
                                onClick={() => {
                                    setSelectedProduct('');
                                    setSelectedPlan(null);
                                }}
                            >
                                Huy
                            </Button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default WarrantyExtension;
