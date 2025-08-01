'use client';

import { AboutHero, AboutHeader, AboutMission, AboutTeam, AboutHistory } from './components';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Language Switcher */}
            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>

            {/* Hero Section with Breadcrumb */}
            <AboutHero />

            {/* Header Section */}
            <AboutHeader />

            {/* Main Content */}
            <main>
                {/* Mission and Values Section */}
                <AboutMission />

                {/* Team Section */}
                <AboutTeam />

                {/* History Timeline */}
                <AboutHistory />
            </main>
        </div>
    );
}
