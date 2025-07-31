'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiLinkedin, FiTwitter } from 'react-icons/fi';
import Link from 'next/link';

export default function AboutTeam() {
    const team = [
        {
            name: 'John Smith',
            position: 'CEO & Founder',
            image: '/images/team/team-1.jpg',
            bio: 'Audio engineer with over 15 years of experience in the industry.',
            social: {
                linkedin: '#',
                twitter: '#'
            }
        },
        {
            name: 'Sarah Johnson',
            position: 'Chief Technology Officer',
            image: '/images/team/team-2.jpg',
            bio: 'Former Apple engineer specializing in acoustic design and signal processing.',
            social: {
                linkedin: '#',
                twitter: '#'
            }
        },
        {
            name: 'Michael Chen',
            position: 'Head of Product Design',
            image: '/images/team/team-3.jpg',
            bio: 'Award-winning industrial designer with a passion for creating beautiful audio products.',
            social: {
                linkedin: '#',
                twitter: '#'
            }
        },
        {
            name: 'Emily Rodriguez',
            position: 'Marketing Director',
            image: '/images/team/team-4.jpg',
            bio: 'Digital marketing expert with experience in building premium consumer electronics brands.',
            social: {
                linkedin: '#',
                twitter: '#'
            }
        }
    ];

    return (
        <section className="bg-[#0f1824] py-16 sm:py-20">
            <div className="ml-16 sm:ml-20 px-4 sm:px-12 md:px-16 lg:px-20">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Meet Our Team</h2>
                    <div className="w-20 h-1 bg-[#4FC8FF] mx-auto mb-6"></div>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        Our talented team of audio enthusiasts, engineers, and designers work together to create
                        products that redefine the listening experience.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-6 md:gap-8 2xl:gap-10 3xl:gap-12 4xl:gap-16">
                    {team.map((member, index) => (
                        <motion.div
                            key={member.name}
                            className="bg-[#151e2b] rounded-lg overflow-hidden shadow-lg"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <div className="relative h-64 w-full">
                                <Image
                                    src={member.image}
                                    alt={member.name}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 25vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0c131d] to-transparent opacity-70"></div>
                                <div className="absolute bottom-0 left-0 w-full p-4">
                                    <h3 className="text-xl font-bold text-white">{member.name}</h3>
                                    <p className="text-[#4FC8FF]">{member.position}</p>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="text-gray-300 text-sm mb-4">{member.bio}</p>
                                <div className="flex space-x-3">
                                    <Link
                                        href={member.social.linkedin}
                                        className="text-gray-400 hover:text-[#4FC8FF] transition-colors"
                                    >
                                        <FiLinkedin size={18} />
                                    </Link>
                                    <Link
                                        href={member.social.twitter}
                                        className="text-gray-400 hover:text-[#4FC8FF] transition-colors"
                                    >
                                        <FiTwitter size={18} />
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
