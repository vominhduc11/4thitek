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
        <section className="bg-[#0c131d] py-16 sm:py-20 2xl:py-24 3xl:py-32 4xl:py-40">
            <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <motion.div
                    className="text-center mb-16 2xl:mb-20 3xl:mb-24 4xl:mb-32"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl sm:text-4xl 2xl:text-5xl 3xl:text-6xl 4xl:text-7xl font-bold mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 text-white">Our Journey</h2>
                    <div className="w-20 h-1 2xl:w-24 2xl:h-1.5 3xl:w-32 3xl:h-2 4xl:w-40 4xl:h-2.5 bg-[#4FC8FF] mx-auto mb-6 2xl:mb-8 3xl:mb-10 4xl:mb-12"></div>
                    <p className="text-gray-300 text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl max-w-2xl 2xl:max-w-3xl 3xl:max-w-4xl 4xl:max-w-5xl mx-auto leading-relaxed">
                        From our humble beginnings to becoming a recognized name in audio technology, our journey has
                        been defined by innovation and excellence.
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-6 md:left-1/2 transform md:-translate-x-1/2 h-full w-1 2xl:w-1.5 3xl:w-2 4xl:w-2.5 bg-[#4FC8FF]/30"></div>

                    {/* Timeline items */}
                    <div className="space-y-12 2xl:space-y-16 3xl:space-y-20 4xl:space-y-24">
                        {milestones.map((milestone, index) => (
                            <motion.div
                                key={milestone.year}
                                className={`relative flex flex-col md:flex-row ${
                                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                                } items-center md:gap-8 2xl:gap-12 3xl:gap-16 4xl:gap-20`}
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true, margin: '-100px' }}
                            >
                                {/* Timeline dot */}
                                <div className="absolute left-4 md:left-1/2 transform md:-translate-x-1/2 w-4 h-4 md:w-5 md:h-5 2xl:w-6 2xl:h-6 3xl:w-8 3xl:h-8 4xl:w-10 4xl:h-10 rounded-full bg-[#4FC8FF] border-2 md:border-4 2xl:border-6 3xl:border-8 border-[#0f1824] z-10"></div>

                                {/* Year */}
                                <div
                                    className={`md:w-1/2 mb-4 md:mb-0 2xl:mb-6 3xl:mb-8 4xl:mb-10 pl-12 md:pl-0 ${
                                        index % 2 === 0 ? 'md:text-right md:pr-8 2xl:pr-12 3xl:pr-16 4xl:pr-20' : 'md:text-left md:pl-8 2xl:pl-12 3xl:pl-16 4xl:pl-20'
                                    }`}
                                >
                                    <span className="inline-block bg-[#4FC8FF]/20 text-[#4FC8FF] text-lg md:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold px-3 md:px-4 2xl:px-6 3xl:px-8 4xl:px-10 py-1 2xl:py-2 3xl:py-3 4xl:py-4 rounded 2xl:rounded-lg 3xl:rounded-xl 4xl:rounded-2xl">
                                        {milestone.year}
                                    </span>
                                </div>

                                {/* Content */}
                                <div
                                    className={`md:w-1/2 bg-[#151e2b] p-4 md:p-6 2xl:p-8 3xl:p-10 4xl:p-12 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl shadow-lg ml-12 md:ml-0 ${
                                        index % 2 === 0 ? 'md:text-left md:pl-8 2xl:pl-12 3xl:pl-16 4xl:pl-20' : 'md:text-left md:pr-8 2xl:pr-12 3xl:pr-16 4xl:pr-20'
                                    }`}
                                >
                                    <h3 className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold text-white mb-2 2xl:mb-3 3xl:mb-4 4xl:mb-5">{milestone.title}</h3>
                                    <p className="text-gray-300 text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl leading-relaxed">{milestone.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
