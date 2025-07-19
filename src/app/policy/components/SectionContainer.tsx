import { ReactNode } from 'react';

interface SectionContainerProps {
    children: ReactNode;
    className?: string;
}

export default function SectionContainer({ children, className = '' }: SectionContainerProps) {
    return (
        <section className={`bg-[#0c131d] text-white pt-8 pb-16 ${className}`}>
            <div className="ml-16 sm:ml-20 px-12 sm:px-16 lg:px-20">{children}</div>
        </section>
    );
}
