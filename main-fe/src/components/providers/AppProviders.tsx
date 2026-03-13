'use client';

import type { ReactNode } from 'react';
import { LanguageProvider } from '@/context/LanguageContext';
import { SearchModalProvider } from '@/context/SearchModalContext';

interface AppProvidersProps {
    children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
    return (
        <LanguageProvider>
            <SearchModalProvider>{children}</SearchModalProvider>
        </LanguageProvider>
    );
}
