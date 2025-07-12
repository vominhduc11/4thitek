'use client';

import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiMapPin, FiMessageCircle, FiArrowRight } from 'react-icons/fi';
import { Product } from '../../_components/types';

interface ContactSectionProps {
    product: Product;
}

const ContactSection = ({ product }: ContactSectionProps) => {
    const contactMethods = [
        {
            icon: FiMail,
            title: 'Email Inquiry',
            description: 'Get detailed product information and pricing',
            contact: 'contact@4thiteck.com',
            action: 'Send Email',
            color: 'from-blue-500 to-cyan-500'
        },
        {
            icon: FiPhone,
            title: 'Phone Consultation',
            description: 'Speak directly with our product specialists',
            contact: '+84 (0) 123 456 789',
            action: 'Call Now',
            color: 'from-green-500 to-emerald-500'
        },
        {
            icon: FiMessageCircle,
            title: 'Live Chat',
            description: 'Instant support for immediate questions',
            contact: 'Available 9AM - 6PM',
            action: 'Start Chat',
            color: 'from-purple-500 to-pink-500'
        }
    ];

    return (
        <div className="ml-16 sm:ml-20 py-12 sm:py-16 bg-gradient-to-b from-transparent to-gray-900/30">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                            Interested in {product.name}?
                        </h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full mb-6"></div>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Contact our team for detailed information, pricing, and availability. We&apos;re here to
                            help you find the perfect communication solution.
                        </p>
                    </motion.div>

                    {/* Contact Methods Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {contactMethods.map((method, index) => (
                            <motion.div
                                key={method.title}
                                className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 rounded-2xl p-6 border border-gray-600/30 hover:border-[#4FC8FF]/30 transition-all duration-300 group cursor-pointer"
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.2, duration: 0.6 }}
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <div className="text-center">
                                    <div
                                        className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${method.color} bg-opacity-20 mb-4 group-hover:scale-110 transition-transform`}
                                    >
                                        <method.icon className="w-8 h-8 text-white" />
                                    </div>

                                    <h3 className="text-xl font-semibold text-white mb-3">{method.title}</h3>

                                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{method.description}</p>

                                    <div className="text-[#4FC8FF] font-semibold mb-4">{method.contact}</div>

                                    <motion.button
                                        className="inline-flex items-center space-x-2 text-white bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] px-4 py-2 rounded-lg font-medium hover:shadow-lg hover:shadow-[#4FC8FF]/30 transition-all duration-300"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span>{method.action}</span>
                                        <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Additional Information */}
                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                    >
                        {/* Distributor Information */}
                        <div className="bg-gradient-to-br from-[#4FC8FF]/10 to-[#4FC8FF]/5 rounded-2xl p-6 border border-[#4FC8FF]/20">
                            <div className="flex items-center mb-4">
                                <FiMapPin className="w-6 h-6 text-[#4FC8FF] mr-3" />
                                <h3 className="text-xl font-semibold text-white">Find a Distributor</h3>
                            </div>
                            <p className="text-gray-300 mb-4 leading-relaxed">
                                Our products are available through authorized distributors nationwide. Contact us to
                                find your nearest distributor or discuss partnership opportunities.
                            </p>
                            <div className="text-sm text-[#4FC8FF] space-y-1">
                                <div>• Nationwide Distribution Network</div>
                                <div>• Authorized Dealer Support</div>
                                <div>• Professional Installation Services</div>
                            </div>
                        </div>

                        {/* Product Support */}
                        <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 rounded-2xl p-6 border border-gray-600/30">
                            <h3 className="text-xl font-semibold text-white mb-4">Product Support</h3>
                            <p className="text-gray-300 mb-4 leading-relaxed">
                                Get comprehensive support for {product.name} including technical documentation,
                                installation guides, and troubleshooting assistance.
                            </p>
                            <div className="space-y-3">
                                <div className="flex items-center text-gray-300">
                                    <div className="w-2 h-2 bg-[#4FC8FF] rounded-full mr-3"></div>
                                    <span className="text-sm">Technical Documentation</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <div className="w-2 h-2 bg-[#4FC8FF] rounded-full mr-3"></div>
                                    <span className="text-sm">Installation Guides</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <div className="w-2 h-2 bg-[#4FC8FF] rounded-full mr-3"></div>
                                    <span className="text-sm">Warranty Support</span>
                                </div>
                                <div className="flex items-center text-gray-300">
                                    <div className="w-2 h-2 bg-[#4FC8FF] rounded-full mr-3"></div>
                                    <span className="text-sm">Technical Training</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ContactSection;
