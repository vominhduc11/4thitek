'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface WarrantyRequest {
    id: string;
    productName: string;
    serial: string;
    issue: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    date: string;
    estimatedCompletion?: string;
}

const WarrantyRequest = () => {
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [issue, setIssue] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const eligibleProducts = [
        { id: '1', name: 'Laptop Gaming 4T Pro', serial: 'ABC123456' },
        { id: '3', name: 'Chuot Gaming 4T Elite', serial: 'GHI456789' }
    ];

    const commonIssues = [
        'Khong bat duoc nguon',
        'Loi man hinh',
        'Loi ban phim',
        'Loi chuot',
        'Loi am thanh',
        'Loi ket noi',
        'Khac'
    ];

    const mockRequests: WarrantyRequest[] = [
        {
            id: '1',
            productName: 'Laptop Gaming 4T Pro',
            serial: 'ABC123456',
            issue: 'Loi man hinh',
            priority: 'high',
            status: 'processing',
            date: '15/10/2023',
            estimatedCompletion: '22/10/2023'
        },
        {
            id: '2',
            productName: 'Chuot Gaming 4T Elite',
            serial: 'GHI456789',
            issue: 'Loi nut bam',
            priority: 'medium',
            status: 'completed',
            date: '01/09/2023'
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'text-yellow-400 bg-yellow-900/30';
            case 'processing':
                return 'text-blue-400 bg-blue-900/30';
            case 'completed':
                return 'text-green-400 bg-green-900/30';
            case 'cancelled':
                return 'text-red-400 bg-red-900/30';
            default:
                return 'text-gray-400 bg-gray-800/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending':
                return 'Cho xu ly';
            case 'processing':
                return 'Dang xu ly';
            case 'completed':
                return 'Hoan thanh';
            case 'cancelled':
                return 'Da huy';
            default:
                return 'Khong xac dinh';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'low':
                return 'text-gray-400';
            case 'medium':
                return 'text-yellow-400';
            case 'high':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    const getPriorityText = (priority: string) => {
        switch (priority) {
            case 'low':
                return 'Thap';
            case 'medium':
                return 'Trung binh';
            case 'high':
                return 'Cao';
            default:
                return 'Khong xac dinh';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct || !issue) return;

        setIsSubmitting(true);
        try {
            // Mock API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            alert('Gui yeu cau bao hanh thanh cong!');
            setShowNewRequest(false);
            setSelectedProduct('');
            setIssue('');
            setDescription('');
            setPriority('medium');
        } catch {
            alert('Co loi xay ra, vui long thu lai!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Yeu cau bao hanh</h2>
                    <Button onClick={() => setShowNewRequest(true)} className="bg-blue-600 hover:bg-blue-700">
                        Tao yeu cau moi
                    </Button>
                </div>

                {/* Request History */}
                <div className="space-y-4">
                    {mockRequests.map((request, index) => (
                        <motion.div
                            key={request.id}
                            className="bg-[#1a2332] rounded-lg p-6 border border-gray-700"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="font-semibold text-white">{request.productName}</h3>
                                    <p className="text-sm text-gray-400">Serial: {request.serial}</p>
                                </div>
                                <div className="text-right">
                                    <div
                                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}
                                    >
                                        {getStatusText(request.status)}
                                    </div>
                                    <p className="text-sm text-gray-400 mt-1">{request.date}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        <span className="text-gray-400">Van de:</span>
                                        <span className="text-white ml-2">{request.issue}</span>
                                    </p>
                                    <p className="text-sm">
                                        <span className="text-gray-400">Uu tien:</span>
                                        <span className={`ml-2 ${getPriorityColor(request.priority)}`}>
                                            {getPriorityText(request.priority)}
                                        </span>
                                    </p>
                                </div>

                                {request.estimatedCompletion && (
                                    <div>
                                        <p className="text-sm">
                                            <span className="text-gray-400">Du kien hoan thanh:</span>
                                            <span className="text-white ml-2">{request.estimatedCompletion}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {request.status === 'processing' && (
                                <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700">
                                    <p className="text-sm text-blue-300">
                                        ℹ️ Yeu cau cua ban dang duoc xu ly. Chung toi se lien he ban trong thoi gian som
                                        nhat.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                {/* New Request Modal */}
                {showNewRequest && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setShowNewRequest(false)}
                    >
                        <motion.div
                            className="bg-[#1a2332] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-white">Tao yeu cau bao hanh</h3>
                                <button
                                    onClick={() => setShowNewRequest(false)}
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

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Chon san pham
                                    </label>
                                    <select
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        className="w-full bg-[#0c131d] border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Chon san pham</option>
                                        {eligibleProducts.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} - {product.serial}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Van de gap phai
                                    </label>
                                    <select
                                        value={issue}
                                        onChange={(e) => setIssue(e.target.value)}
                                        className="w-full bg-[#0c131d] border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Chon van de</option>
                                        {commonIssues.map((commonIssue) => (
                                            <option key={commonIssue} value={commonIssue}>
                                                {commonIssue}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Mo ta chi tiet
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Mo ta chi tiet van de ban gap phai..."
                                        className="w-full bg-[#0c131d] border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32 resize-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Muc do uu tien
                                    </label>
                                    <div className="flex gap-4">
                                        {[
                                            { value: 'low', label: 'Thap', color: 'text-gray-400' },
                                            { value: 'medium', label: 'Trung binh', color: 'text-yellow-400' },
                                            { value: 'high', label: 'Cao', color: 'text-red-400' }
                                        ].map((option) => (
                                            <label
                                                key={option.value}
                                                className="flex items-center gap-2 cursor-pointer"
                                            >
                                                <input
                                                    type="radio"
                                                    name="priority"
                                                    value={option.value}
                                                    checked={priority === option.value}
                                                    onChange={(e) =>
                                                        setPriority(e.target.value as 'low' | 'medium' | 'high')
                                                    }
                                                    className="text-blue-600"
                                                />
                                                <span className={`text-sm ${option.color}`}>{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Dang gui...
                                            </div>
                                        ) : (
                                            'Gui yeu cau'
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowNewRequest(false)}
                                        className="px-6"
                                    >
                                        Huy
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default WarrantyRequest;
