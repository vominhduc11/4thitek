import { ContactHero, ContactHeader, ContactInfo } from './components';

export default function ContactPage() {
    return (
        <div className="brand-section min-h-screen text-white flex flex-col">
            {/* Hero Section with Breadcrumb */}
            <ContactHero />

            {/* Header Section */}
            <ContactHeader />

            {/* Main Content */}
            <section className="pt-8 pb-16 text-white">
                <div className="brand-shell sm:ml-16 md:ml-20">
                    {/* Contact Info Cards */}
                    <ContactInfo />
                </div>
            </section>
        </div>
    );
}
