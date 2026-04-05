import { ReactNode } from 'react';
import AvoidSidebar from '@/components/ui/AvoidSidebar';

interface SectionContainerProps {
    children: ReactNode;
    className?: string;
}

export default function SectionContainer({ children, className = '' }: SectionContainerProps) {
    return (
        <section className={`pb-16 pt-8 text-white ${className}`}>
            <AvoidSidebar>
                <div className="brand-shell">{children}</div>
            </AvoidSidebar>
        </section>
    );
}
