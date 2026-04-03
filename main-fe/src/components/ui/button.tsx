import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const baseStyles =
            'inline-flex items-center justify-center rounded-full text-sm font-semibold tracking-[0.08em] uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]';

        const variants = {
            default: 'brand-button-primary hover:-translate-y-0.5 hover:brightness-105',
            outline: 'brand-button-secondary hover:-translate-y-0.5 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.14)]',
            ghost: 'text-[var(--text-secondary)] hover:bg-white/6 hover:text-white',
            link: 'text-[var(--brand-blue)] underline-offset-4 hover:underline'
        };

        const sizes = {
            default: 'h-11 px-5',
            sm: 'h-10 px-4',
            lg: 'h-12 px-8',
            icon: 'h-11 w-11'
        };

        return (
            <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                style={{ display: 'inline-block' }}
            >
                <button
                    className={cn(baseStyles, variants[variant], sizes[size], className)}
                    ref={ref}
                    {...props}
                />
            </motion.div>
        );
    }
);
Button.displayName = 'Button';

export { Button };
