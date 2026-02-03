import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { logger } from '@/utils/logger';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="text-center max-w-md mx-auto">
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold mb-4 text-gray-800">404</h1>
        <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6">Oops! Trang không tìm thấy</p>
        <a 
          href="/" 
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-medium px-6 py-3 rounded-lg transition-colors duration-200"
        >
          Quay về trang chủ
        </a>
      </div>
    </div>
  );
};

export default NotFound;
