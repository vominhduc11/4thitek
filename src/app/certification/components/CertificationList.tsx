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
        <section className="bg-[#0c131d] py-12 sm:py-16 2xl:py-20 3xl:py-24 4xl:py-32">
            <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <motion.div
                    className="mb-12 2xl:mb-16 3xl:mb-20 4xl:mb-24"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-2xl sm:text-3xl 2xl:text-4xl 3xl:text-5xl 4xl:text-6xl font-bold mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 text-white">Our Certifications</h2>
                    <div className="w-16 h-1 2xl:w-20 2xl:h-1.5 3xl:w-24 3xl:h-2 4xl:w-32 4xl:h-2.5 bg-[#4FC8FF] mb-6 2xl:mb-8 3xl:mb-10 4xl:mb-12"></div>
                    <p className="text-gray-300 text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl max-w-3xl 2xl:max-w-4xl 3xl:max-w-5xl 4xl:max-w-6xl">
                        These certifications demonstrate our commitment to quality, safety, and environmental
                        responsibility. Each certification represents our dedication to meeting or exceeding industry
                        standards.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-4 4xl:grid-cols-5 gap-8 2xl:gap-10 3xl:gap-12 4xl:gap-16">
                    {certifications.map((cert, index) => (
                        <motion.div
                            key={cert.id}
                            className="bg-[#151e2b] rounded-lg 2xl:rounded-xl 3xl:rounded-2xl overflow-hidden shadow-lg"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <div className="p-6 2xl:p-8 3xl:p-10 4xl:p-12 flex items-center justify-center h-40 2xl:h-48 3xl:h-56 4xl:h-64 bg-white/5">
                                <div className="relative h-24 2xl:h-28 3xl:h-32 4xl:h-40 w-full">
                                    <Image
                                        src={
                                            cert.logo || 'https://thinkzone.vn/uploads/2022_01/blogging-1641375905.jpg'
                                        }
                                        alt={cert.name}
                                        fill
                                        className="object-contain"
                                        sizes="(max-width: 768px) 100vw, 33vw"
                                    />
                                </div>
                            </div>
                            <div className="p-6 2xl:p-8 3xl:p-10 4xl:p-12">
                                <h3 className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold text-white mb-2 2xl:mb-3 3xl:mb-4 4xl:mb-5">{cert.name}</h3>
                                <p className="text-gray-400 text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 leading-relaxed">{cert.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs 2xl:text-sm 3xl:text-base 4xl:text-lg text-[#4FC8FF]">Issued by: {cert.issuedBy}</span>
                                    <Link
                                        href={cert.link}
                                        className="text-gray-400 hover:text-[#4FC8FF] transition-colors flex items-center gap-1 2xl:gap-2 3xl:gap-3 4xl:gap-4 text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl"
                                    >
                                        Details <FiExternalLink className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 3xl:w-5 3xl:h-5 4xl:w-6 4xl:h-6" />
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
