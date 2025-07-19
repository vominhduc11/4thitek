'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WarrantyFormProps {
    onSubmit: (data: { serialNumber: string; invoiceNumber: string }) => void;
}

const WarrantyForm: React.FC<WarrantyFormProps> = ({ onSubmit }) => {
    const [serialNumber, setSerialNumber] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serialNumber.trim()) {
            alert('Vui long nhap so serial');
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit({ serialNumber, invoiceNumber });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="max-w-2xl mx-auto bg-[#1a2332] p-8 rounded-lg shadow-lg border border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <motion.h2
                className="text-2xl font-bold text-center mb-6 text-white"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                Nhap thong tin kiem tra
            </motion.h2>

            <motion.form
                onSubmit={handleSubmit}
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-300 mb-2">
                        So Serial <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="serialNumber"
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="Nhap so serial san pham"
                        required
                        className="w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                        So serial thuong duoc in tren nhan san pham hoac hop dung
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <label htmlFor="invoiceNumber" className="block text-sm font-medium text-gray-300 mb-2">
                        So hoa don (tuy chon)
                    </label>
                    <Input
                        id="invoiceNumber"
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="Nhap so hoa don (neu co)"
                        className="w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
                    />
                    <p className="text-sm text-gray-400 mt-1">So hoa don giup tra cuu chinh xac hon</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:hover:scale-100"
                    >
                        {isLoading ? (
                            <motion.div
                                className="flex items-center justify-center gap-2"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Dang kiem tra...
                            </motion.div>
                        ) : (
                            'Kiem tra bao hanh'
                        )}
                    </Button>
                </motion.div>
            </motion.form>

            <motion.div
                className="mt-6 p-4 bg-[#0c131d] rounded-lg border border-gray-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
            >
                <h3 className="font-semibold text-gray-300 mb-2">Luu y:</h3>
                <motion.ul
                    className="text-sm text-gray-400 space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                >
                    <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.9 }}
                    >
                        • So serial la bat buoc de kiem tra bao hanh
                    </motion.li>
                    <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 1.0 }}
                    >
                        • Thong tin bao hanh se hien thi ngay sau khi kiem tra
                    </motion.li>
                    <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 1.1 }}
                    >
                        • Lien he bo phan ho tro neu gap van de
                    </motion.li>
                </motion.ul>
            </motion.div>
        </motion.div>
    );
};

export default WarrantyForm;
