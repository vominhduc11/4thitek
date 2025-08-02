// Typography Demo Component
// Demonstrates the usage of the new typography system

import { typographyComponents, typographyScale, fontWeights, textColors } from '@/styles/typography';

export default function TypographyDemo() {
  return (
    <div className="p-8 bg-[#0c131d] text-white">
      <h1 className="mb-8 text-3xl font-bold text-[#4FC8FF]">Typography System Demo</h1>
      
      {/* Hero Typography */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-gray-300">Hero Components</h2>
        <div className="space-y-4">
          <h1 className={typographyComponents.hero.title}>
            Hero Title - Professional Audio Communication
          </h1>
          <p className={typographyComponents.hero.subtitle}>
            Hero Subtitle - Discover a breakthrough era of motorcycle communication with 4T HITEK—a pioneering brand specializing in telecom components.
          </p>
          <button className={`${typographyComponents.hero.cta} bg-[#4FC8FF] text-black px-6 py-3 rounded`}>
            Hero CTA Button
          </button>
        </div>
      </section>

      {/* Section Typography */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-gray-300">Section Components</h2>
        <div className="space-y-4">
          <h1 className={typographyComponents.section.title}>
            Section Title - Our Products
          </h1>
          <p className={typographyComponents.section.subtitle}>
            Section Subtitle - Discover our range of professional audio communication devices
          </p>
        </div>
      </section>

      {/* Card Typography */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-gray-300">Card Components</h2>
        <div className="bg-gray-800 p-6 rounded-lg space-y-3">
          <h3 className={typographyComponents.card.title}>
            Card Title - SX Pro Elite
          </h3>
          <p className={typographyComponents.card.description}>
            Card Description - Professional Gaming Headset with 50mm drivers and advanced noise cancelling technology
          </p>
          <span className={typographyComponents.card.metadata}>
            Card Metadata - March 15, 2024 • 5 min read
          </span>
        </div>
      </section>

      {/* Form Typography */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-gray-300">Form Components</h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label className={typographyComponents.form.label}>
              Form Label - Email Address
            </label>
            <input 
              type="email" 
              placeholder="Enter your email"
              className={`${typographyComponents.form.input} w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 mt-1`}
            />
            <p className={typographyComponents.form.helper}>
              Form Helper - We&apos;ll never share your email with anyone else.
            </p>
          </div>
          <button className={`${typographyComponents.form.button} bg-[#4FC8FF] text-black px-6 py-2 rounded`}>
            Form Button
          </button>
        </div>
      </section>

      {/* Navigation Typography */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-gray-300">Navigation Components</h2>
        <div className="space-y-4">
          <nav className="flex space-x-6">
            <a href="#" className={typographyComponents.navigation.primary}>Primary Nav</a>
            <a href="#" className={typographyComponents.navigation.primary}>Products</a>
            <a href="#" className={typographyComponents.navigation.primary}>About</a>
          </nav>
          <nav className="flex space-x-4">
            <a href="#" className={typographyComponents.navigation.secondary}>Secondary Nav</a>
            <a href="#" className={typographyComponents.navigation.secondary}>Support</a>
          </nav>
          <nav className={typographyComponents.navigation.breadcrumb}>
            Breadcrumb - Home / Products / Details
          </nav>
        </div>
      </section>

      {/* Content Typography */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-gray-300">Content Components</h2>
        <div className="space-y-4">
          <h1 className={typographyComponents.content.title}>
            Content Title - Blog Post Title
          </h1>
          <h2 className={typographyComponents.content.heading}>
            Content Heading - Section Heading
          </h2>
          <p className={typographyComponents.content.body}>
            Content Body - This is a longer paragraph of body text that demonstrates how the content typography system works. It should be readable and comfortable for extended reading sessions.
          </p>
          <span className={typographyComponents.content.caption}>
            Content Caption - Photo credit: John Doe
          </span>
        </div>
      </section>

      {/* Individual Typography Scales */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold text-gray-300">Typography Scales</h2>
        
        <div className="mb-6">
          <h3 className="mb-2 text-lg text-gray-400">Display Sizes</h3>
          <div className={`${typographyScale['display-xl']} ${fontWeights.title} ${textColors.primary} mb-2`}>Display XL</div>
          <div className={`${typographyScale['display-lg']} ${fontWeights.title} ${textColors.primary} mb-2`}>Display LG</div>
          <div className={`${typographyScale['display-md']} ${fontWeights.title} ${textColors.primary} mb-2`}>Display MD</div>
          <div className={`${typographyScale['display-sm']} ${fontWeights.title} ${textColors.primary}`}>Display SM</div>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-lg text-gray-400">Heading Sizes</h3>
          <div className={`${typographyScale['heading-xl']} ${fontWeights.heading} ${textColors.primary} mb-1`}>Heading XL</div>
          <div className={`${typographyScale['heading-lg']} ${fontWeights.heading} ${textColors.primary} mb-1`}>Heading LG</div>
          <div className={`${typographyScale['heading-md']} ${fontWeights.heading} ${textColors.primary} mb-1`}>Heading MD</div>
          <div className={`${typographyScale['heading-sm']} ${fontWeights.heading} ${textColors.primary}`}>Heading SM</div>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 text-lg text-gray-400">Body Sizes</h3>
          <div className={`${typographyScale['body-xl']} ${fontWeights.body} ${textColors.secondary} mb-1`}>Body XL</div>
          <div className={`${typographyScale['body-lg']} ${fontWeights.body} ${textColors.secondary} mb-1`}>Body LG</div>
          <div className={`${typographyScale['body-md']} ${fontWeights.body} ${textColors.secondary} mb-1`}>Body MD</div>
          <div className={`${typographyScale['body-sm']} ${fontWeights.body} ${textColors.secondary}`}>Body SM</div>
        </div>

        <div>
          <h3 className="mb-2 text-lg text-gray-400">Caption Sizes</h3>
          <div className={`${typographyScale['caption-lg']} ${fontWeights.body} ${textColors.muted} mb-1`}>Caption LG</div>
          <div className={`${typographyScale.caption} ${fontWeights.body} ${textColors.muted}`}>Caption</div>
        </div>
      </section>
    </div>
  );
}