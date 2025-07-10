import Image from "next/image";

const Footer = () => {
  return (
    <footer className="bg-[#0c131d] text-gray-300 py-8 sm:py-12 px-4 sm:px-6 ml-16 sm:ml-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {/* COMPANY Column */}
        <div>
          <h3 className="uppercase text-sm font-semibold text-white mb-3 sm:mb-4">Company</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Our Journey
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Responsibility
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Brand Vision
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Our Team
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Exclusive Reseller Certifications
              </a>
            </li>
          </ul>
        </div>

        {/* PRODUCT Column */}
        <div>
          <h3 className="uppercase text-sm font-semibold text-white mb-3 sm:mb-4">Product</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                S Series
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                SX Series
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                G Series
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                G+ Series
              </a>
            </li>
          </ul>
        </div>

        {/* RESELLER Column */}
        <div>
          <h3 className="uppercase text-sm font-semibold text-white mb-3 sm:mb-4">Reseller</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Reseller Information
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Become Our Reseller
              </a>
            </li>
          </ul>
        </div>

        {/* OTHER Column */}
        <div>
          <h3 className="uppercase text-sm font-semibold text-white mb-3 sm:mb-4">Other</h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Warranty Checking
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Policy
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Blog
              </a>
            </li>
            <li>
              <a href="#" className="text-sm hover:text-white hover:underline transition-colors">
                Contact Us
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Separator Line */}
      <hr className="border-gray-700 my-6 sm:my-8" />

      {/* Copyright & Language Selector */}
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4 sm:gap-0">
        <p className="mb-2 sm:mb-0 text-center sm:text-left">
          CopyRight © 2023 4Thiteck CO., LTD All Right Reserved.
        </p>
        
        {/* Language Selector */}
        <div className="flex items-center cursor-pointer hover:text-gray-300 transition-colors justify-center sm:justify-start" aria-label="Language selector">
          <Image
            width={0}
            height={0}
            sizes="100vw"
            priority
            src="/flags/vn.svg" 
            alt="Vietnam flag" 
            className="w-4 sm:w-5 h-4 sm:h-5 rounded-full"
          />
          <span className="ml-1.5 sm:ml-2 text-xs sm:text-sm text-gray-300">Vietnam</span>
          <svg 
            className="ml-1 w-3 h-3 fill-current" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
