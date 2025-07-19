interface TableOfContentsEntry {
    label: string;
    anchorId: string;
}

interface TableOfContentsProps {
    entries: TableOfContentsEntry[];
}

export default function TableOfContents({ entries }: TableOfContentsProps) {
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
        <div className="bg-[#17202c] rounded-lg p-6 mb-8">
            <h4 className="text-lg font-semibold mb-4">MỤC LỤC</h4>
            <ul className="space-y-2 list-decimal list-inside text-gray-300">
                {entries.map((entry, index) => (
                    <li key={index}>
                        <button
                            onClick={() => handleScrollToSection(entry.anchorId)}
                            className="hover:text-white transition-colors cursor-pointer text-left"
                        >
                            {entry.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
