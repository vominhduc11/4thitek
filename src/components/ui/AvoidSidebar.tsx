'use client';

import { ReactNode } from 'react';

interface AvoidSidebarProps {
    children: ReactNode;
}

export default function AvoidSidebar({ children }: AvoidSidebarProps) {
    return (
        <div className="flex">
            <div className="w-16 sm:w-20 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}
