'use client';

import { useState } from 'react';
import Footer from './Footer';
import Header from './Header';
import Sidebar from './Sidebar';
import SideDrawer from './SideDrawer';
import SearchModal from '@/components/ui/SearchModal';
import { useSearchModal } from '@/context/SearchModalContext';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { isSearchOpen, closeSearch } = useSearchModal();

    return (
        <>
            <Header onMenuClick={() => setIsDrawerOpen(true)} />
            <Sidebar onMenuClick={() => setIsDrawerOpen(true)} />
            <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
            <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />
            <div id="main-content" tabIndex={-1}>
                {children}
            </div>
            <div aria-live="polite" aria-atomic="true" className="sr-only" />
            <Footer />
        </>
    );
}
