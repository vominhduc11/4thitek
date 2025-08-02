'use client';

import {
    CertificationHero,
    CertificationHeader,
    CertificationList,
    CertificationProcess,
    CertificationFAQ
} from './components';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function CertificationPage() {
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Language Switcher */}
            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>

            {/* Hero Section with Breadcrumb */}
            <CertificationHero />

            {/* Header Section */}
            <CertificationHeader />

            {/* Main Content */}
            <main>
                {/* Certification List */}
                <CertificationList />

                {/* Certification Process */}
                <CertificationProcess />

                {/* FAQ Section */}
                <CertificationFAQ />
            </main>
        </div>
    );
}
