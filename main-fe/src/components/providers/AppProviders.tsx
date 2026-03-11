'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { LoginModalProvider } from '@/context/LoginModalContext';
import { SearchModalProvider } from '@/context/SearchModalContext';

interface AppProvidersProps {
    children: ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
    return (
        <LanguageProvider>
            <AuthProvider>
                <LoginModalProvider>
                    <SearchModalProvider>{children}</SearchModalProvider>
                </LoginModalProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}
