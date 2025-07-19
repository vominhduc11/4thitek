import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants, useInView } from 'framer-motion';
import { useRef } from 'react';
import AvoidSidebar from './AvoidSidebar';

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 48 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', duration: 0.8, delayChildren: 0.1, staggerChildren: 0.05 }
    }
};
const columnVariants: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 18 } }
};
const lineVariants: Variants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: { scaleX: 1, opacity: 1, transition: { duration: 0.6, delay: 0.25 } }
};
const copyrightVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.35 } }
};

const Footer = () => {
    const ref = useRef(null);
    const inView = useInView(ref, { margin: '-60px', once: true });
    return (
        <AvoidSidebar>
            <motion.footer
                ref={ref}
                className="bg-[#0c131d] text-gray-300 sm:py-12 px-4 sm:px-6"
                variants={containerVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
            >
                <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                    {/* COMPANY Column */}
                    <motion.div variants={columnVariants}>
                        <h3 className="uppercase text-sm font-semibold text-white mb-3 sm:mb-4">Company</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/about"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/certification"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    Exclusive Reseller Certifications
                                </Link>
                            </li>
                        </ul>
                    </motion.div>

                    {/* PRODUCT Column */}
                    <motion.div variants={columnVariants}>
                        <h3 className="uppercase text-sm font-semibold text-white mb-3 sm:mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/products?series=S%20SERIES"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    S Series
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/products?series=SX%20SERIES"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    SX Series
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/products?series=G%20SERIES"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    G Series
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/products?series=G%2B%20SERIES"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    G+ Series
                                </Link>
                            </li>
                        </ul>
                    </motion.div>

                    {/* RESELLER Column */}
                    <motion.div variants={columnVariants}>
                        <h3 className="uppercase text-sm font-semibold text-white mb-3 sm:mb-4">Reseller</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/reseller_infomation"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    Reseller Information
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/become_our_reseller"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    Become Our Reseller
                                </Link>
                            </li>
                        </ul>
                    </motion.div>

                    {/* OTHER Column */}
                    <motion.div variants={columnVariants}>
                        <h3 className="uppercase text-sm font-semibold text-white mb-3 sm:mb-4">Other</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/warranty-check"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    Warranty Checking
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/policy"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    Policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/blogs"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="text-sm hover:text-white hover:underline transition-colors"
                                >
                                    Contact Us
                                </Link>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                {/* Separator Line */}
                <motion.hr
                    className="border-gray-700 my-6 sm:my-8"
                    variants={lineVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                />

                {/* Copyright & Language Selector */}
                <motion.div
                    className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4 sm:gap-0"
                    variants={copyrightVariants}
                    initial="hidden"
                    animate={inView ? 'visible' : 'hidden'}
                >
                    <p className="mb-2 sm:mb-0 text-center sm:text-left">
                        CopyRight © 2023 4T HITEK All Right Reserved.
                    </p>

                    {/* Language Selector */}
                    <div
                        className="flex items-center cursor-pointer hover:text-gray-300 transition-colors justify-center sm:justify-start"
                        aria-label="Language selector"
                    >
                        <Image
                            width={0}
                            height={0}
                            sizes="100vw"
                            priority
                            src="/flags/vn.svg"
                            alt="Vietnam flag"
                            className="w-4 sm:w-5 h-4 sm:h-5 rounded-full"
                        />
                        <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-300">Vietnam</span>
                        <svg className="ml-1 w-3 h-3 fill-current" viewBox="0 0 20 20" aria-hidden="true">
                            <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                </motion.div>
            </motion.footer>
        </AvoidSidebar>
    );
};

export default Footer;
