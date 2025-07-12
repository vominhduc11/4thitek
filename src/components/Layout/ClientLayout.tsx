'use client';

import { useState } from 'react';
import Header from '../Navigation/Header';
import Sidebar from '../Navigation/Sidebar';
import SideDrawer from '../Navigation/SideDrawer';
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
