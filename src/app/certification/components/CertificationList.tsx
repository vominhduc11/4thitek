'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FiExternalLink } from 'react-icons/fi';

export default function CertificationList() {
    const certifications = [
        {
            id: 'ce',
            name: 'CE Certification',
            logo: '/images/certifications/ce-logo.png',
            description:
                'The CE mark indicates that our products comply with health, safety, and environmental protection standards for products sold within the European Economic Area.',
            issuedBy: 'European Union',
            link: '#'
        },
        {
            id: 'fcc',
            name: 'FCC Certification',
            logo: '/images/certifications/fcc-logo.png',
            description:
                'FCC certification confirms that the electromagnetic interference from our devices is under limits approved by the Federal Communications Commission.',
            issuedBy: 'Federal Communications Commission, USA',
            link: '#'
        },
        {
            id: 'rohs',
            name: 'RoHS Compliance',
            logo: '/images/certifications/rohs-logo.png',
            description:
                'RoHS certification ensures our products are free from specific hazardous materials such as lead, mercury, and cadmium.',
            issuedBy: 'European Union',
            link: '#'
        },
        {
            id: 'iso9001',
            name: 'ISO 9001:2015',
            logo: '/images/certifications/iso-logo.png',
            description:
                'ISO 9001:2015 certification confirms that our quality management systems meet international standards for consistent quality products.',
            issuedBy: 'International Organization for Standardization',
            link: '#'
        },
        {
            id: 'bluetooth',
            name: 'Bluetooth SIG Certification',
            logo: '/images/certifications/bluetooth-logo.png',
            description:
                'This certification ensures our wireless products meet Bluetooth technology standards for compatibility and performance.',
            issuedBy: 'Bluetooth Special Interest Group',
            link: '#'
        },
        {
            id: 'hi-res',
            name: 'Hi-Res Audio Certification',
            logo: '/images/certifications/hi-res-logo.png',
            description:
                'Hi-Res Audio certification confirms our products can reproduce high-resolution audio formats with exceptional clarity and detail.',
            issuedBy: 'Japan Audio Society',
            link: '#'
        }
    ];

    return (
        <section className="bg-[#0c131d] py-12 sm:py-16">
            <div className="ml-16 sm:ml-20 px-12 sm:px-16 lg:px-20">
                <motion.div
                    className="mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Our Certifications</h2>
                    <div className="w-16 h-1 bg-[#4FC8FF] mb-6"></div>
                    <p className="text-gray-300 max-w-3xl">
                        These certifications demonstrate our commitment to quality, safety, and environmental
                        responsibility. Each certification represents our dedication to meeting or exceeding industry
                        standards.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {certifications.map((cert, index) => (
                        <motion.div
                            key={cert.id}
                            className="bg-[#151e2b] rounded-lg overflow-hidden shadow-lg"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <div className="p-6 flex items-center justify-center h-40 bg-white/5">
                                <div className="relative h-24 w-full">
                                    <Image
                                        src={cert.logo}
                                        alt={cert.name}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2">{cert.name}</h3>
                                <p className="text-gray-400 text-sm mb-4">{cert.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#4FC8FF]">Issued by: {cert.issuedBy}</span>
                                    <Link
                                        href={cert.link}
                                        className="text-gray-400 hover:text-[#4FC8FF] transition-colors flex items-center gap-1 text-sm"
                                    >
                                        Details <FiExternalLink size={14} />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
