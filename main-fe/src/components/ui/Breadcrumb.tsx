import Link from 'next/link';

interface BreadcrumbItem {
    label: string;
    href?: string;
    active?: boolean;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
    return (
        <nav className="mb-6" aria-label="Breadcrumb">
            <ul className="flex flex-wrap items-center gap-2 text-xs sm:text-sm lg:text-base">
                {items.map((item, index) => (
                    <li key={`${item.label}-${index}`} className="flex items-center gap-2">
                        {item.active ? (
                            <span className="font-semibold text-[var(--brand-blue)]">{item.label}</span>
                        ) : item.href ? (
                            <Link
                                href={item.href}
                                className="text-[var(--text-secondary)] transition-colors hover:text-white"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="text-[var(--text-secondary)] transition-colors hover:text-white">
                                {item.label}
                            </span>
                        )}
                        {index < items.length - 1 && <span className="text-[var(--text-muted)]">/</span>}
                    </li>
                ))}
            </ul>
        </nav>
    );
}
