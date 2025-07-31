'use client';

import { motion } from 'framer-motion';

interface PolicyBreadcrumbProps {
    selectedPolicy?: string;
    onPolicyClick?: (policy: string) => void;
}

const PolicyBreadcrumb = ({ selectedPolicy = 'warranty', onPolicyClick }: PolicyBreadcrumbProps) => {
    const policyList = [
        { key: 'warranty', label: 'Chính sách bảo hành' },
        { key: 'return', label: 'Chính sách đổi trả hàng' },
        { key: 'privacy', label: 'Bảo mật thông tin' },
        { key: 'terms', label: 'Điều kiện, điều khoản' }
    ];

    // Get policy-specific description
    const getPolicyDescription = () => {
        switch (selectedPolicy) {
            case 'warranty':
                return 'Tìm hiểu về chính sách bảo hành sản phẩm, quy trình xử lý và các điều kiện áp dụng. Chúng tôi cam kết bảo vệ quyền lợi khách hàng với dịch vụ bảo hành chuyên nghiệp và tận tâm.';
            case 'return':
                return 'Hướng dẫn chi tiết về quy trình đổi trả hàng, thời gian xử lý và các điều kiện cần thiết. Đảm bảo trải nghiệm mua sắm an toàn và thuận tiện cho khách hàng.';
            case 'privacy':
                return 'Cam kết bảo mật thông tin cá nhân của khách hàng. Tìm hiểu cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn một cách an toàn và minh bạch.';
            case 'terms':
                return 'Các điều khoản và điều kiện sử dụng dịch vụ. Quy định về quyền và nghĩa vụ của khách hàng khi sử dụng sản phẩm và dịch vụ của TuneZone.';
            default:
                return 'Tìm hiểu về các chính sách và quy định của TuneZone. Chúng tôi cam kết mang đến trải nghiệm dịch vụ tốt nhất với các chính sách minh bạch và công bằng.';
        }
    };

    return (
        <div className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
            <div className="px-12 sm:px-16 lg:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 font-mono text-[#4FC8FF]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        POLICY
                    </motion.h1>

                    {/* Policy Description */}
                    <motion.p
                        className="text-gray-300 text-sm sm:text-base lg:text-lg mb-8 leading-relaxed max-w-4xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {getPolicyDescription()}
                    </motion.p>

                    {/* Policy Navigation Breadcrumb */}
                    <motion.div
                        className="mb-8 relative -mx-12 sm:-mx-16 lg:-mx-20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        {/* Continuous horizontal line - full width */}
                        <motion.div
                            className="absolute left-0 right-0 top-1/2 h-px bg-gray-500/60 z-0"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.8 }}
                        />

                        {/* Policy Navigation - aligned left */}
                        <div className="flex items-center gap-1 relative z-10 pl-12 sm:pl-16 lg:pl-20">
                            <div className="bg-[#0c131d] px-2 flex items-center gap-1">
                                {policyList.map((policy, index) => (
                                    <motion.div
                                        key={policy.key}
                                        className="flex items-center"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                    >
                                        <motion.button
                                            onClick={() => onPolicyClick?.(policy.key)}
                                            className={`px-2 py-2 text-sm font-medium transition-all duration-300 bg-[#0c131d] whitespace-nowrap ${
                                                selectedPolicy === policy.key
                                                    ? 'text-[#4FC8FF] font-semibold'
                                                    : 'text-gray-300 hover:text-white'
                                            }`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {policy.label}
                                        </motion.button>

                                        {/* Separator */}
                                        {index < policyList.length - 1 && <span className="text-gray-500 mx-1">/</span>}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default PolicyBreadcrumb;
