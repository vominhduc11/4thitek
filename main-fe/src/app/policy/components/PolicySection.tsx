import { ReactNode } from 'react';

interface PolicySectionProps {
    id: string;
    title: string;
    content: ReactNode;
    level?: 'h2' | 'h3';
}

export default function PolicySection({ id, title, content, level = 'h2' }: PolicySectionProps) {
    const HeadingTag = level;
    const headingClass =
        level === 'h2'
            ? 'mb-4 font-serif text-2xl font-semibold text-[var(--brand-blue)]'
            : 'mb-4 font-serif text-xl font-semibold text-[var(--brand-blue)]';

    return (
        <section className="brand-card-muted mb-8 rounded-[28px] p-6 sm:p-8">
            <HeadingTag id={id} className={headingClass}>
                {title}
            </HeadingTag>
            <div className="space-y-4 leading-relaxed text-[var(--text-secondary)]">{content}</div>
        </section>
    );
}
