import { useLanguage } from '@/context/LanguageContext';

interface TableOfContentsEntry {
    label: string;
    anchorId: string;
}

interface TableOfContentsProps {
    entries: TableOfContentsEntry[];
}

export default function TableOfContents({ entries }: TableOfContentsProps) {
    const { t } = useLanguage();
    const handleScrollToSection = (anchorId: string) => {
        const element = document.getElementById(anchorId);
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    };

    return (
        <div className="brand-card-muted mb-8 rounded-[28px] p-6">
            <h4 className="mb-4 font-serif text-xl font-semibold text-[var(--brand-blue)]">
                {t('policy.tableOfContents')}
            </h4>
            <ul className="list-decimal list-inside space-y-2 text-[var(--text-secondary)]">
                {entries.map((entry, index) => (
                    <li key={index}>
                        <button
                            onClick={() => handleScrollToSection(entry.anchorId)}
                            className="cursor-pointer text-left transition-colors hover:text-[var(--text-primary)]"
                        >
                            {entry.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
