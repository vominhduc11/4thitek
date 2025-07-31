'use client';

import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiArrowRight } from 'react-icons/fi';

interface AdditionalContentProps {
    selectedPosition: string;
    productCount: number;
}

export default function AdditionalContent({ selectedPosition, productCount }: AdditionalContentProps) {
    if (productCount >= 8) return null;

    return (
        <motion.div
            className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 mt-12 sm:mt-16 mb-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
        >
            <div className="px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="text-center mb-8 sm:mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
                        Need More Information?
                    </h2>
                    <div className="w-20 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full"></div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
                    <motion.div
                        className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl p-6 sm:p-8 border border-gray-700/30"
                        whileHover={{ scale: 1.02, borderColor: 'rgba(79, 200, 255, 0.3)' }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.h3
                            className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <span className="w-2 h-2 bg-[#4FC8FF] rounded-full mr-3"></span>
                            Contact Our Team
                        </motion.h3>

                        <motion.p
                            className="text-gray-300 mb-6 leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            {selectedPosition === 'ALL'
                                ? 'Contact our team to learn more about our complete product range and find the perfect communication solution for your needs.'
                                : `Get detailed specifications and pricing information for ${selectedPosition} position products from our expert team.`}
                        </motion.p>

                        <div className="space-y-4">
                            {[
                                { icon: FiMail, label: 'Email', value: 'contact@4thiteck.com' },
                                { icon: FiPhone, label: 'Phone', value: '+84 (0) 123 456 789' },
                                { icon: FiMapPin, label: 'Address', value: 'Ho Chi Minh City, Vietnam' }
                            ].map((contact, index) => (
                                <motion.div
                                    key={contact.label}
                                    className="flex items-center space-x-3 text-gray-300 hover:text-white transition-colors group cursor-pointer"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + index * 0.1 }}
                                    whileHover={{ x: 4 }}
                                >
                                    <contact.icon className="w-5 h-5 text-[#4FC8FF] group-hover:scale-110 transition-transform" />
                                    <div>
                                        <span className="text-sm text-gray-400 block">{contact.label}</span>
                                        <span className="font-medium">{contact.value}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        className="bg-gradient-to-br from-[#4FC8FF]/10 to-[#4FC8FF]/5 rounded-2xl p-6 sm:p-8 border border-[#4FC8FF]/20"
                        whileHover={{ scale: 1.02, borderColor: 'rgba(79, 200, 255, 0.4)' }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.h3
                            className="text-xl sm:text-2xl font-bold text-white mb-6 flex items-center"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <span className="w-2 h-2 bg-[#4FC8FF] rounded-full mr-3"></span>
                            Why Choose 4T Hiteck?
                        </motion.h3>

                        <div className="space-y-4">
                            {[
                                'Premium Quality Materials',
                                'Advanced Communication Technology',
                                'Professional Grade Durability',
                                'Expert Technical Support',
                                'Comprehensive Warranty Coverage'
                            ].map((feature, index) => (
                                <motion.div
                                    key={feature}
                                    className="flex items-center space-x-3 text-gray-300 group"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + index * 0.1 }}
                                >
                                    <FiArrowRight className="w-4 h-4 text-[#4FC8FF] group-hover:translate-x-1 transition-transform" />
                                    <span className="group-hover:text-white transition-colors">{feature}</span>
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            className="mt-8 p-4 bg-[#4FC8FF]/10 rounded-lg border border-[#4FC8FF]/20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2 }}
                        >
                            <p className="text-sm text-gray-300 leading-relaxed">
                                <span className="text-[#4FC8FF] font-semibold">Distributor Network:</span> Our products
                                are available through authorized distributors nationwide. Contact us to find your
                                nearest distributor or discuss partnership opportunities.
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
