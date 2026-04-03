import { ReactNode } from 'react';

interface SectionContainerProps {
    children: ReactNode;
    className?: string;
}

export default function SectionContainer({ children, className = '' }: SectionContainerProps) {
    return (
        <section className={`pb-16 pt-8 text-white ${className}`}>
            <div className="brand-shell sm:ml-16 md:ml-20">{children}</div>
        </section>
    );
}
