'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface AvoidSidebarProps {
    children: ReactNode;
}

export default function AvoidSidebar({ children }: AvoidSidebarProps) {
    const pathname = usePathname();
    const isHomePage = pathname === '/';

    return (
        <div className="flex">
            {!isHomePage ? <div aria-hidden="true" className="hidden w-20 flex-shrink-0 lg:block"></div> : null}
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}
