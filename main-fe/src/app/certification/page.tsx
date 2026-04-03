import { CertificationHero, CertificationHeader, CertificationList } from './components';

export default function CertificationPage() {
    return (
        <div className="brand-section min-h-screen text-white flex flex-col">
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
