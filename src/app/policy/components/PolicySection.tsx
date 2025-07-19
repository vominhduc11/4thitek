import { ReactNode } from 'react';

interface PolicySectionProps {
    id: string;
    title: string;
    content: ReactNode;
    level?: 'h2' | 'h3';
}

export default function PolicySection({ id, title, content, level = 'h2' }: PolicySectionProps) {
    const HeadingTag = level;
    const headingClass = level === 'h2' ? 'text-2xl font-bold mb-4' : 'text-xl font-bold mb-4';

    return (
        <section className="mb-8">
            <HeadingTag id={id} className={headingClass}>
                {title}
            </HeadingTag>
            <div className="text-gray-300 leading-relaxed space-y-4">{content}</div>
        </section>
    );
}
