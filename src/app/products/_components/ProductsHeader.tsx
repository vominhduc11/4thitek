"use client";

import { motion } from "framer-motion";

interface ProductsHeaderProps {
  selectedSeries: string;
  hasActiveFilters: boolean;
  onSeriesClick: (series: string) => void;
  onFilterToggle: () => void;
  totalProducts: number;
  filteredCount: number;
}

const ProductsHeader = ({ 
  selectedSeries, 
  hasActiveFilters, 
  onSeriesClick, 
  onFilterToggle,
  totalProducts,
  filteredCount
}: ProductsHeaderProps) => {
  const seriesList = ["SX SERIES", "S SERIES", "G SERIES", "G+ SERIES"];

  // Format series title for display
  const getDisplayTitle = () => {
    if (selectedSeries === "ALL") {
      return "PRODUCT LIST";
    }
    // Convert "SX SERIES" to "SX Series" for better display
    return selectedSeries.replace(" SERIES", " Series");
  };

  // Get series-specific description
  const getSeriesDescription = () => {
    switch (selectedSeries) {
      case "SX SERIES":
        return "Khám phá dòng SX Series - Công nghệ giao tiếp cao cấp với thiết kế tinh tế và tính năng vượt trội. Được thiết kế dành riêng cho những người lái chuyên nghiệp đòi hỏi chất lượng âm thanh hoàn hảo và độ bền vượt trội trong mọi điều kiện.";
      case "S SERIES":
        return "Tìm hiểu S Series - Giải pháp giao tiếp chuyên nghiệp với sự cân bằng hoàn hảo giữa hiệu suất và giá trị. Dòng sản phẩm này mang đến trải nghiệm đáng tin cậy cho việc sử dụng hàng ngày với chất lượng âm thanh rõ ràng.";
      case "G SERIES":
        return "Khám phá G Series - Hệ thống giao tiếp tiên tiến với độ bền chuẩn quân sự và khả năng truyền tải crystal clear. Được thiết kế để đáp ứng những yêu cầu khắt khe nhất trong môi trường làm việc chuyên nghiệp.";
      case "G+ SERIES":
        return "Trải nghiệm G+ Series - Đỉnh cao của công nghệ giao tiếp với AI-powered noise reduction và kết nối tầm xa vượt trội. Dòng sản phẩm ultimate này kết hợp công nghệ tiên tiến nhất với chất liệu cao cấp.";
      default:
        return "Khám phá bộ sưu tập Series của 4T Hiteck – nơi hội tụ công nghệ giao tiếp đỉnh cao dành riêng cho người lái chuyên nghiệp. Mỗi sản phẩm trong dòng SX, S, G và G+ đều được thiết kế tỉ mỉ, mang đến âm thanh rõ ràng, kết nối ổn định và độ bền vượt trội trên mọi hành trình.";
    }
  };

  return (
    <div className="ml-16 sm:ml-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
      <div className="px-12 sm:px-16 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <motion.h1 
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 font-mono ${
              selectedSeries === "ALL" ? "text-white" : "text-[#4FC8FF]"
            }`}
            key={selectedSeries} // This will trigger re-animation when series changes
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {getDisplayTitle()}
          </motion.h1>
          
          {/* Product Count Display */}
          <motion.div
            className="mb-6 text-sm sm:text-base text-gray-400"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {selectedSeries === "ALL" ? (
              <span>Showing all <span className="text-[#4FC8FF] font-semibold">{totalProducts}</span> products</span>
            ) : (
              <span>
                Showing <span className="text-[#4FC8FF] font-semibold">{filteredCount}</span> products 
                in <span className="text-white font-semibold">{selectedSeries}</span>
              </span>
            )}
          </motion.div>

          {/* Breadcrumb & Filter Section */}
          <motion.div
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8 mb-8 relative"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {/* Decorative horizontal line */}
            <motion.div
              className="absolute -left-12 sm:-left-16 lg:-left-20 -right-12 sm:-right-16 lg:-right-20 top-1/2 h-px bg-gradient-to-r from-gray-500/40 via-gray-500/70 to-gray-500/40 z-0 hidden lg:block"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
              style={{ transform: 'translateY(-0.5px)' }}
            />

            {/* Breadcrumb / Category Navigation - Left Side */}
            <div className="flex items-center space-x-1 text-sm font-sans uppercase tracking-wider bg-[#0c131d] pr-4 relative z-10">
              <motion.button
                className={`font-medium relative pb-1 border-b-2 transition-all duration-300 ${
                  selectedSeries === "ALL" 
                    ? "border-[#4FC8FF] text-[#4FC8FF] scale-105" 
                    : "border-transparent text-white hover:text-[#4FC8FF] hover:border-[#4FC8FF]/50"
                }`}
                whileHover={{ scale: selectedSeries === "ALL" ? 1.05 : 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSeriesClick("ALL")}
              >
                ALL SERIES
                {selectedSeries === "ALL" && (
                  <motion.div
                    className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#4FC8FF]"
                    layoutId="activeSeriesIndicator"
                    initial={false}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
              
              {seriesList.map((series, index) => (
                <div key={index} className="flex items-center">
                  <span className="text-gray-500 mx-2">/</span>
                  <motion.button
                    className={`transition-all duration-300 relative group ${
                      selectedSeries === series 
                        ? "text-[#4FC8FF] scale-105 font-semibold" 
                        : "text-gray-400 hover:text-white"
                    }`}
                    whileHover={{ scale: selectedSeries === series ? 1.05 : 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onSeriesClick(series)}
                  >
                    {series.replace(" SERIES", "")}
                    <span className={`absolute bottom-0 left-0 h-0.5 bg-[#4FC8FF] transition-all duration-300 ${
                      selectedSeries === series ? "w-full" : "w-0 group-hover:w-full"
                    }`}></span>
                    
                    {/* Active indicator */}
                    {selectedSeries === series && (
                      <motion.div
                        className="absolute -top-1 -right-1 w-2 h-2 bg-[#4FC8FF] rounded-full"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                      />
                    )}
                  </motion.button>
                </div>
              ))}
            </div>

            {/* Filter & Sort By Button - Right Side */}
            <motion.button
              className={`flex items-center space-x-3 px-6 py-3 border rounded-lg font-sans uppercase tracking-wider text-sm transition-all duration-300 group min-w-[180px] justify-center lg:justify-start bg-[#0c131d] relative z-10 ${
                hasActiveFilters 
                  ? "border-[#4FC8FF] text-[#4FC8FF] shadow-lg shadow-[#4FC8FF]/20" 
                  : "border-gray-600 text-white hover:border-[#4FC8FF] hover:text-[#4FC8FF]"
              }`}
              whileHover={{ 
                scale: 1.02,
                boxShadow: hasActiveFilters 
                  ? "0 4px 20px rgba(79, 200, 255, 0.3)" 
                  : "0 4px 12px rgba(79, 200, 255, 0.2)"
              }}
              whileTap={{ scale: 0.98 }}
              onClick={onFilterToggle}
            >
              {/* Active Filter Indicator */}
              {hasActiveFilters && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-[#4FC8FF] rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}

              {/* Slider/Filter Icon */}
              <motion.div
                className="flex flex-col space-y-1"
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex space-x-1">
                  <div className="w-3 h-0.5 bg-current rounded-full"></div>
                  <div className="w-2 h-0.5 bg-current rounded-full opacity-60"></div>
                </div>
                <div className="flex space-x-1">
                  <div className="w-2 h-0.5 bg-current rounded-full opacity-60"></div>
                  <div className="w-3 h-0.5 bg-current rounded-full"></div>
                </div>
                <div className="flex space-x-1">
                  <div className="w-3 h-0.5 bg-current rounded-full"></div>
                  <div className="w-1 h-0.5 bg-current rounded-full opacity-40"></div>
                </div>
              </motion.div>
              
              <span className="font-medium">FILTER & SORT BY</span>
              
              {/* Arrow indicator */}
              <motion.div
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            </motion.button>
          </motion.div>

          {/* Mobile Responsive Version */}
          <motion.div
            className="block lg:hidden mb-6 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {/* Mobile Categories */}
            <div className="flex flex-wrap gap-2">
              <motion.button
                className={`px-3 py-1.5 rounded text-xs font-sans uppercase tracking-wide transition-all duration-300 ${
                  selectedSeries === "ALL"
                    ? "bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]"
                    : "border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                }`}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSeriesClick("ALL")}
              >
                ALL
              </motion.button>
              {seriesList.map((series) => (
                <motion.button
                  key={series}
                  className={`px-3 py-1.5 rounded text-xs font-sans uppercase tracking-wide transition-all duration-300 ${
                    selectedSeries === series
                      ? "bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]"
                      : "border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500"
                  }`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSeriesClick(series)}
                >
                  {series.split(' ')[0]}
                </motion.button>
              ))}
            </div>
          </motion.div>

          <motion.p 
            style={{ color: "#8390A5" }}
            key={`desc-${selectedSeries}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {getSeriesDescription()}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductsHeader;
