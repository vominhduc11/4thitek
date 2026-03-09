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
        <nav className="flex items-center text-xs sm:text-sm mb-6">
            <ul className="flex space-x-2">
                {items.map((item, index) => (
                    <li key={index} className="flex items-center space-x-2">
                        {item.active ? (
                            <span className="text-[#4FC8FF] font-medium">{item.label}</span>
                        ) : item.href ? (
                            <Link
                                href={item.href}
                                className="hover:text-white cursor-pointer text-gray-400 transition-colors"
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <span className="hover:text-white cursor-pointer text-gray-400 transition-colors">
                                {item.label}
                            </span>
                        )}
                        {index < items.length - 1 && <span className="text-gray-400">/</span>}
                    </li>
                ))}
            </ul>
        </nav>
    );
}
