'use client';
import { motion } from 'framer-motion';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <motion.section
            className="bg-[#0c131d] w-full py-8 xs:py-10 sm:py-12 md:py-16 relative"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.2 }}
        >
            <div className="sidebar-aware-container">{children}</div>
        </motion.section>
    );
}
