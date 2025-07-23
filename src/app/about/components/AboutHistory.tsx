'use client';

import { motion } from 'framer-motion';

export default function AboutHistory() {
    const milestones = [
        {
            year: '2015',
            title: 'Company Founded',
            description: 'Founded in Vietnam with a vision to create premium audio products for discerning listeners.'
        },
        {
            year: '2017',
            title: 'First Product Launch',
            description:
                'Released our first SX Series earphones, setting new standards for audio quality in its price range.'
        },
        {
            year: '2019',
            title: 'International Expansion',
            description:
                'Expanded to international markets across Southeast Asia and established key distribution partnerships.'
        },
        {
            year: '2021',
            title: 'Award-Winning Design',
            description:
                'Our G Series received multiple design awards for its innovative approach to comfort and sound quality.'
        },
        {
            year: '2023',
            title: 'Technology Innovation',
            description:
                'Introduced proprietary acoustic technology in our flagship G+ Series, redefining premium audio experiences.'
        }
    ];

    return (
        <section className="bg-[#0c131d] py-16 sm:py-20">
            <div className="ml-16 sm:ml-20 px-4 sm:px-12 md:px-16 lg:px-20">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">Our Journey</h2>
                    <div className="w-20 h-1 bg-[#4FC8FF] mx-auto mb-6"></div>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        From our humble beginnings to becoming a recognized name in audio technology, our journey has
                        been defined by innovation and excellence.
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 bg-[#4FC8FF]/30"></div>

                    {/* Timeline items */}
                    <div className="space-y-12">
                        {milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.year}
                                className={`relative flex flex-col md:flex-row ${
                                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                                } items-center md:gap-8`}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true, margin: '-100px' }}
                            >
                                {/* Timeline dot */}
                                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 md:w-5 md:h-5 rounded-full bg-[#4FC8FF] border-2 md:border-4 border-[#0f1824] z-10"></div>

                                {/* Year */}
                                <div
                                    className={`md:w-1/2 mb-4 md:mb-0 pl-12 md:pl-0 ${
                                        index % 2 === 0 ? 'md:text-right md:pr-8' : 'md:text-left md:pl-8'
                                    }`}
                                >
                                    <span className="inline-block bg-[#4FC8FF]/20 text-[#4FC8FF] text-lg md:text-xl font-bold px-3 md:px-4 py-1 rounded">
                                        {milestone.year}
                                    </span>
                                </div>

                                {/* Content */}
                                <div
                                    className={`md:w-1/2 bg-[#151e2b] p-4 md:p-6 rounded-lg shadow-lg ml-12 md:ml-0 ${
                                        index % 2 === 0 ? 'md:text-left md:pl-8' : 'md:text-left md:pr-8'
                                    }`}
                                >
                                    <h3 className="text-xl font-bold text-white mb-2">{milestone.title}</h3>
                                    <p className="text-gray-300">{milestone.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
