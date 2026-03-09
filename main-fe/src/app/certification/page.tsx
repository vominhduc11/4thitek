import {
    CertificationHero,
    CertificationHeader,
    CertificationList
} from './components';

export default function CertificationPage() {
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col"
             style={{ animation: 'fadeIn 0.5s ease-in' }}
        >
            {/* Hero Section with Breadcrumb */}
            <CertificationHero />

            {/* Header Section */}
            <CertificationHeader />

            {/* Main Content */}
            <main>
                {/* Certification List */}
                <CertificationList />
            </main>
        </div>
    );
}
