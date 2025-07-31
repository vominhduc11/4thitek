'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiTarget, FiEye, FiAward } from 'react-icons/fi';

export default function AboutMission() {
    const values = [
        {
            icon: <FiTarget className="w-6 h-6" />,
            title: 'Our Mission',
            description:
                'To revolutionize the audio industry by creating products that deliver exceptional sound quality and user experience.'
        },
        {
            icon: <FiEye className="w-6 h-6" />,
            title: 'Our Vision',
            description:
                'To become the leading global brand for premium audio solutions that enhance how people experience sound.'
        },
        {
            icon: <FiAward className="w-6 h-6" />,
            title: 'Our Values',
            description:
                'Innovation, quality, customer satisfaction, and continuous improvement drive everything we do.'
        }
    ];

    return (
        <section className="bg-[#0c131d] py-12 sm:py-16">
            <div className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 px-4 sm:px-12 md:px-16 lg:px-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Image Section */}
                    <motion.div
                        className="relative h-[400px] rounded-lg overflow-hidden"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        viewport={{ once: true }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#4FC8FF]/20 to-transparent z-10"></div>
                        <Image
                            src="/images/about-mission.jpg"
                            alt="4thitek mission"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                        />
                    </motion.div>

                    {/* Content Section */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            viewport={{ once: true }}
                        >
                            <h3 className="text-2xl font-bold text-white mb-2">Our Purpose</h3>
                            <div className="w-16 h-1 bg-[#4FC8FF] mb-6"></div>
                            <p className="text-gray-300 mb-8">
                                At 4thitek, we&apos;re driven by our passion for sound. We combine cutting-edge
                                technology with meticulous craftsmanship to create audio products that deliver an
                                immersive and authentic listening experience.
                            </p>
                        </motion.div>

                        <div className="space-y-6">
                            {values.map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    className="flex items-start gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="p-3 bg-[#4FC8FF]/20 text-[#4FC8FF] rounded-lg">{item.icon}</div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white mb-1">{item.title}</h4>
                                        <p className="text-gray-400">{item.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
