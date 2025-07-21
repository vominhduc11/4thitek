'use client';

import { ReactNode } from 'react';

interface AvoidSidebarProps {
    children: ReactNode;
}

export default function AvoidSidebar({ children }: AvoidSidebarProps) {
    return <div className="ml-16 sm:ml-20">{children}</div>;
}
