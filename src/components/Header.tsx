import { FiSearch } from 'react-icons/fi';

export default function Header() {
  return (
    <header className="fixed top-0 left-20 right-0 flex items-center justify-between px-6 py-4 z-30">
      {/* Search icon (left) */}
      <div>
        <button className="p-2 rounded hover:bg-[#263040] transition">
          <FiSearch size={20} color="#fff" />
        </button>
      </div>

      {/* Logo and company name (right) */}
      <div className="flex items-center gap-2">
        <img src="/logo-4t.png" alt="4T HITEK" className="h-8 w-auto" />
        <div className="flex flex-col text-white font-bold leading-tight">
          <span className="text-lg">4T</span>
          <span className="text-base">HITEK</span>
        </div>
      </div>
    </header>
  );
}
