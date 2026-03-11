import { AboutHero, AboutHeader, AboutMission } from './components';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Section with Breadcrumb */}
            <AboutHero />

            {/* Header Section */}
            <AboutHeader />

            {/* Main Content */}
            <main>
                {/* Mission and Values Section */}
                <AboutMission />
            </main>
        </div>
    );
}
