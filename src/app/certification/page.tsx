import {
    CertificationHero,
    CertificationHeader,
    CertificationList,
    CertificationProcess,
    CertificationFAQ
} from './components';

export default function CertificationPage() {
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
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
