'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiLinkedin, FiTwitter } from 'react-icons/fi';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { getStaggerTransition, ANIMATION_OFFSET } from '@/constants/animations';

export default function AboutTeam() {
    const { t } = useLanguage();

    const team = [
        {
            nameKey: 'about.team.members.johnSmith.name',
            positionKey: 'about.team.members.johnSmith.position',
            image: '/images/team/team-1.jpg',
            bioKey: 'about.team.members.johnSmith.bio',
            social: {
                linkedin: '#',
                twitter: '#'
            }
        },
        {
            nameKey: 'about.team.members.sarahJohnson.name',
            positionKey: 'about.team.members.sarahJohnson.position',
            image: '/images/team/team-2.jpg',
            bioKey: 'about.team.members.sarahJohnson.bio',
            social: {
                linkedin: '#',
                twitter: '#'
            }
        },
        {
            nameKey: 'about.team.members.michaelChen.name',
            positionKey: 'about.team.members.michaelChen.position',
            image: '/images/team/team-3.jpg',
            bioKey: 'about.team.members.michaelChen.bio',
            social: {
                linkedin: '#',
                twitter: '#'
            }
        },
        {
            nameKey: 'about.team.members.emilyRodriguez.name',
            positionKey: 'about.team.members.emilyRodriguez.position',
            image: '/images/team/team-4.jpg',
            bioKey: 'about.team.members.emilyRodriguez.bio',
            social: {
                linkedin: '#',
                twitter: '#'
            }
        }
    ];

    return (
        <section className="bg-[#0f1824] py-16 sm:py-20">
            <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">{t('about.team.title')}</h2>
                    <div className="w-20 h-1 bg-[#4FC8FF] mx-auto mb-6"></div>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        {t('about.team.description')}
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-8 gap-6 md:gap-8 2xl:gap-10 3xl:gap-12 4xl:gap-16">
                    {team.map((member, index) => (
                        <motion.div
                            key={member.nameKey}
                            className="bg-[#151e2b] rounded-lg overflow-hidden shadow-lg"
                            initial={{ opacity: 0, y: ANIMATION_OFFSET.medium }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={getStaggerTransition(index)}
                            viewport={{ once: true }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <div className="relative h-64 w-full">
                                <Image
                                    src={member.image}
                                    alt={t(member.nameKey)}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 3200px) 25vw, 30vw"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0c131d] to-transparent opacity-70"></div>
                                <div className="absolute bottom-0 left-0 w-full p-4">
                                    <h3 className="text-xl font-bold text-white">{t(member.nameKey)}</h3>
                                    <p className="text-[#4FC8FF]">{t(member.positionKey)}</p>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="text-gray-300 text-sm mb-4">{t(member.bioKey)}</p>
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
