'use client';

import { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import SideDrawer from './SideDrawer';
import Footer from './Footer';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
        <>
            <Header />
            <Sidebar onMenuClick={() => setIsDrawerOpen(true)} />
            <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
            {children}
            <Footer />
        </>
    );
}
