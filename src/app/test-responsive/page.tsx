export default function TestResponsive() {
  return (
    <main className="main-content">
      <div className="min-h-screen bg-[#0c131d] text-white p-4">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-8">
          Responsive Test Page
        </h1>
        
        {/* Breakpoint indicators */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Current Breakpoint:</h2>
          <div className="flex flex-wrap gap-2">
            <span className="block sm:hidden px-3 py-1 bg-red-500 rounded">Mobile (&lt; 640px)</span>
            <span className="hidden sm:block md:hidden px-3 py-1 bg-yellow-500 rounded">Small (640px - 768px)</span>
            <span className="hidden md:block lg:hidden px-3 py-1 bg-green-500 rounded">Medium (768px - 1024px)</span>
            <span className="hidden lg:block xl:hidden px-3 py-1 bg-blue-500 rounded">Large (1024px - 1280px)</span>
            <span className="hidden xl:block px-3 py-1 bg-purple-500 rounded">Extra Large (≥ 1280px)</span>
          </div>
        </div>

        {/* Layout test */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-xl font-bold">Card {item}</span>
            </div>
          ))}
        </div>

        {/* Sidebar and Header spacing test */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Layout Spacing:</h2>
          <p className="text-sm text-gray-300">
            This content should have proper spacing from sidebar and header.
            Sidebar width: <span className="text-blue-400">64px (mobile)</span> / <span className="text-green-400">80px (desktop)</span>
          </p>
          <p className="text-sm text-gray-300 mt-2">
            Header height: <span className="text-blue-400">64px</span> (padding-top applied)
          </p>
        </div>

        {/* Typography test */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Typography Scaling:</h2>
          <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl mb-2">Heading 1</h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl mb-2">Heading 2</h2>
          <h3 className="text-base sm:text-lg lg:text-xl xl:text-2xl mb-2">Heading 3</h3>
          <p className="text-sm sm:text-base lg:text-lg">Body text that scales appropriately</p>
        </div>

        {/* Button test */}
        <div className="mb-8 p-4 bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Interactive Elements:</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              Primary Button
            </button>
            <button className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-500 hover:border-gray-400 rounded-lg transition-colors">
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
