/**
 * @fileoverview Enhanced Empty State Component with Animations
 * @module components/shared/EmptyState
 */

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: "default" | "info" | "warning" | "success";
}

const variantStyles = {
  default: {
    container: "from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700",
    icon: "text-slate-400 dark:text-slate-500",
    circle: "border-slate-200 dark:border-slate-600",
    glow: "bg-slate-100 dark:bg-slate-800/50",
  },
  info: {
    container: "from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
    icon: "text-blue-500 dark:text-blue-400",
    circle: "border-blue-200 dark:border-blue-800",
    glow: "bg-blue-100 dark:bg-blue-900/20",
  },
  warning: {
    container: "from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20",
    icon: "text-yellow-500 dark:text-yellow-400",
    circle: "border-yellow-200 dark:border-yellow-800",
    glow: "bg-yellow-100 dark:bg-yellow-900/20",
  },
  success: {
    container: "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
    icon: "text-green-500 dark:text-green-400",
    circle: "border-green-200 dark:border-green-800",
    glow: "bg-green-100 dark:bg-green-900/20",
  },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = "default",
}: EmptyStateProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 sm:py-14 md:py-16 lg:py-16 xl:py-20 2xl:py-24 px-4 sm:px-5 md:px-6 lg:px-6 xl:px-8 2xl:px-10 text-center"
    >
      {/* Animated Icon Container */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="mb-4 sm:mb-5 md:mb-6 lg:mb-6 xl:mb-7 2xl:mb-8 relative"
      >
        {/* Background Glow */}
        <div className={`absolute inset-0 ${styles.glow} rounded-full blur-2xl opacity-50`} />

        {/* Icon Container with Gradient */}
        <div className={`relative w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 lg:w-24 lg:h-24 xl:w-28 xl:h-28 2xl:w-32 2xl:h-32 bg-gradient-to-br ${styles.container} rounded-full flex items-center justify-center border-2 sm:border-2 md:border-2 lg:border-2 xl:border-2 2xl:border-3 ${styles.circle}`}>
          <Icon className={`w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-16 2xl:h-16 ${styles.icon}`} strokeWidth={1.5} />
        </div>

        {/* Decorative Circles */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.1, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute inset-0 border-2 sm:border-2 md:border-2 lg:border-2 xl:border-2 2xl:border-3 ${styles.circle} rounded-full -m-3 sm:-m-3 md:-m-4 lg:-m-4 xl:-m-5 2xl:-m-6`}
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.05, 0.2],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
          className={`absolute inset-0 border-2 sm:border-2 md:border-2 lg:border-2 xl:border-2 2xl:border-3 ${styles.circle} rounded-full -m-6 sm:-m-7 md:-m-8 lg:-m-8 xl:-m-10 2xl:-m-12`}
        />
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-lg sm:text-lg md:text-xl lg:text-xl xl:text-2xl 2xl:text-2xl font-semibold text-foreground mb-1.5 sm:mb-2 md:mb-2 lg:mb-2 xl:mb-2.5 2xl:mb-3"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base 2xl:text-base text-muted-foreground max-w-sm sm:max-w-sm md:max-w-md lg:max-w-md xl:max-w-lg 2xl:max-w-xl mb-4 sm:mb-5 md:mb-6 lg:mb-6 xl:mb-7 2xl:mb-8"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(actionLabel || secondaryActionLabel) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-2 sm:gap-2 md:gap-3 lg:gap-3 xl:gap-4 2xl:gap-4"
        >
          {actionLabel && onAction && (
            <Button onClick={onAction} size="default" className="text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base 2xl:text-base px-3 py-2 sm:px-4 sm:py-2 md:px-4 md:py-2 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 2xl:px-6 2xl:py-3">
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button onClick={onSecondaryAction} variant="outline" size="default" className="text-xs sm:text-xs md:text-sm lg:text-sm xl:text-base 2xl:text-base px-3 py-2 sm:px-4 sm:py-2 md:px-4 md:py-2 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 2xl:px-6 2xl:py-3">
              {secondaryActionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
