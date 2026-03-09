'use client';

export default function ProductLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white">
            <div className="max-w-[1920px] mx-auto">{children}</div>
        </div>
    );
}
