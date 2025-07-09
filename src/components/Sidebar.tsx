import { FaFacebookF, FaTwitter } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';

interface SidebarProps {
  onMenuClick: () => void;
}

export default function Sidebar({ onMenuClick }: SidebarProps) {
  return (
    <aside className="fixed top-0 left-0 h-full w-16 sm:w-20 bg-[#1e2631]/70 backdrop-blur-md flex flex-col items-center py-3 sm:py-4 z-40 shadow-lg">
      {/* Menu Icon */}
      <div className="mb-6 sm:mb-8 mt-1 sm:mt-2">
        <button 
          className="p-1.5 sm:p-2 rounded hover:bg-[#263040] transition"
          onClick={onMenuClick}
        >
          <FiMenu size={24} className="sm:w-8 sm:h-8" color="#27b2fc" />
        </button>
      </div>

      <div className="flex-1" />

      {/* Social icons */}
      <div className="mb-3 sm:mb-4 flex flex-col gap-3 sm:gap-4">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 sm:p-2 rounded hover:bg-[#263040] transition flex items-center justify-center"
        >
          <FaFacebookF size={14} className="sm:w-4.5 sm:h-4.5" color="#fff" />
        </a>
        <a
          href="https://twitter.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 sm:p-2 rounded hover:bg-[#263040] transition flex items-center justify-center"
        >
          <FaTwitter size={14} className="sm:w-4.5 sm:h-4.5" color="#fff" />
        </a>
      </div>
    </aside>
  );
}
