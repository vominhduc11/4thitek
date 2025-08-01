import { ReactNode } from 'react';

interface SectionContainerProps {
    children: ReactNode;
    className?: string;
}

export default function SectionContainer({ children, className = '' }: SectionContainerProps) {
    return (
        <section className={`bg-[#0c131d] text-white pt-8 pb-16 ${className}`}>
            <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">{children}</div>
        </section>
    );
}
