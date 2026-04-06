'use client';

import { ReactNode } from 'react';

interface AvoidSidebarProps {
    children: ReactNode;
}

export default function AvoidSidebar({ children }: AvoidSidebarProps) {
    return (
        <div className="flex">
            <div aria-hidden="true" className="hidden w-20 flex-shrink-0 lg:block"></div>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}
