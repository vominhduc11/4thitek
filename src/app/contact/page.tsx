import { ContactHero, ContactHeader, ContactInfo } from './components';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Section with Breadcrumb */}
            <ContactHero />

            {/* Header Section */}
            <ContactHeader />

            {/* Main Content */}
            <section className="bg-[#0c131d] text-white pt-8 pb-16">
                <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    {/* Contact Info Cards */}
                    <ContactInfo />
                </div>
            </section>
        </div>
    );
}
