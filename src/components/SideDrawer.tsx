"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { FiX, FiChevronDown, FiCheck } from "react-icons/fi";
import { FaFacebookF, FaTwitter } from "react-icons/fa";
import clsx from "clsx";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [language, setLanguage] = useState("vi");

  const toggleProduct = () => setIsProductOpen(o => !o);
  const selectLanguage = (lang: string) => setLanguage(lang);

  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '0px';
    };
  }, [isOpen]);

  // Animation variants
  const backdropVariants : Variants= {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2, ease: "easeIn" }
    }
  };

  const drawerVariants : Variants = {
    hidden: { 
      x: "-100%",
      transition: { duration: 0.3, ease: "easeIn" }
    },
    visible: { 
      x: 0,
      transition: { 
        duration: 0.4, 
        ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth slide
      }
    },
    exit: { 
      x: "-100%",
      transition: { duration: 0.3, ease: "easeIn" }
    }
  };

  const staggerContainer : Variants = {
    visible: {
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const staggerItem : Variants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    }
  };

  const productMenuVariants : Variants = {
    closed: { 
      height: 0, 
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    open: { 
      height: "auto", 
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside 
            className="fixed top-0 left-0 h-screen w-auto flex z-50 shadow-2xl"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Narrow Side */}
            <motion.div 
              className="w-20 flex flex-col justify-between items-center py-6 bg-gradient-to-b from-[#1a2332] via-[#1e2631] to-[#0f1419] border-r border-gray-700/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.3 }}
            >
              <motion.button 
                aria-label="Close menu" 
                className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg"
                onClick={onClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <FiX size={20} />
              </motion.button>

              <div className="flex flex-col gap-6">
                <motion.a 
                  href="#" 
                  className="text-gray-400 hover:text-blue-400 p-2"
                  whileHover={{ scale: 1.2, color: "#60a5fa" }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <FaFacebookF size={16} />
                </motion.a>
                <motion.a 
                  href="#" 
                  className="text-gray-400 hover:text-blue-400 p-2"
                  whileHover={{ scale: 1.2, color: "#60a5fa" }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <FaTwitter size={16} />
                </motion.a>
              </div>
            </motion.div>

            {/* Main Navigation */}
            <motion.nav 
              className="w-80 bg-gradient-to-b from-[#1e2631] to-[#151e2b] text-gray-300 px-8 py-10 relative border-r border-gray-700/30"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <h2 className="text-xl font-bold text-white mb-2">Navigation</h2>
                <motion.div 
                  className="w-12 h-0.5 bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: 48 }}
                  transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
                />
              </motion.div>

              <motion.ul 
                className="space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.li variants={staggerItem}>
                  <motion.a 
                    href="#" 
                    className="block text-sm font-medium uppercase tracking-wider hover:text-white py-2"
                    whileHover={{ x: 4, color: "#ffffff" }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    Home
                  </motion.a>
                </motion.li>
                
                <motion.li variants={staggerItem}>
                  <motion.button 
                    className="w-full flex justify-between items-center text-sm font-medium uppercase tracking-wider hover:text-white py-2"
                    onClick={toggleProduct}
                    whileHover={{ x: 4, color: "#ffffff" }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    Product 
                    <motion.div
                      animate={{ rotate: isProductOpen ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <FiChevronDown className="text-blue-400" />
                    </motion.div>
                  </motion.button>
                  
                  <motion.ul 
                    className="mt-3 ml-4 space-y-3 overflow-hidden border-l border-gray-600/50 pl-4"
                    variants={productMenuVariants}
                    initial="closed"
                    animate={isProductOpen ? "open" : "closed"}
                  >
                    {["SX Series", "S Series", "G Series", "G+ Series"].map((item, index) => (
                      <motion.li 
                        key={item}
                        initial={{ opacity: 0, x: -10 }}
                        animate={isProductOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -10 }}
                        transition={{ delay: isProductOpen ? index * 0.1 : 0, duration: 0.2 }}
                      >
                        <motion.a 
                          href="#" 
                          className="block text-sm text-gray-400 hover:text-white py-1"
                          whileHover={{ x: 4, color: "#ffffff" }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          {item}
                        </motion.a>
                      </motion.li>
                    ))}
                  </motion.ul>
                </motion.li>

                {["Company", "Reseller", "Blog", "Contact Us"].map((item) => (
                  <motion.li key={item} variants={staggerItem}>
                    <motion.a 
                      href="#" 
                      className="block text-sm font-medium uppercase tracking-wider hover:text-white py-2"
                      whileHover={{ x: 4, color: "#ffffff" }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      {item}
                    </motion.a>
                  </motion.li>
                ))}
              </motion.ul>

              <motion.div 
                className="absolute bottom-8 right-6 opacity-20"
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 0.2, rotate: 90 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <span className="text-6xl font-black text-white uppercase origin-center select-none">
                  Menu
                </span>
              </motion.div>
            </motion.nav>

            {/* Sub Panel */}
            <motion.div 
              className="w-72 bg-gradient-to-b from-[#0f1419] to-[#0a0e13] px-8 py-10 text-gray-300"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              {/* Language */}
              <motion.div 
                className="mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Language
                </h4>
                <ul className="space-y-3">
                  {[
                    { code: "vi", label: "Tiếng Việt" },
                    { code: "en", label: "English" }
                  ].map((lang, index) => (
                    <motion.li 
                      key={lang.code}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                    >
                      <motion.button 
                        className={clsx(
                          "flex justify-between items-center w-full text-sm py-2 px-3 rounded-lg",
                          language === lang.code ? "bg-blue-500/20 text-white" : "hover:bg-white/5 hover:text-white"
                        )}
                        onClick={() => selectLanguage(lang.code)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        {lang.label}
                        {language === lang.code && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          >
                            <FiCheck className="text-blue-400" />
                          </motion.div>
                        )}
                      </motion.button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              {/* Contact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.3 }}
              >
                <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Contact Us
                </h4>
                <motion.div 
                  className="bg-white/5 rounded-lg p-4 border border-gray-700/30"
                  whileHover={{ scale: 1.02, borderColor: "rgba(59, 130, 246, 0.3)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <p className="text-sm text-gray-300 mb-2">Email</p>
                  <p className="text-white font-medium">contact@4thiteck.com</p>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}