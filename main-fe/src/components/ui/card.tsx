import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, hover = false, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    'brand-card rounded-[1.6rem] text-white transition-all duration-200',
                    hover && 'cursor-pointer hover:-translate-y-1 hover:shadow-lg',
                    className
                )}
                {...props}
            />
        );
    }
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
    )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h3 ref={ref} className={cn('font-serif text-2xl font-semibold leading-none tracking-tight', className)} {...props} />
    )
);
CardTitle.displayName = 'CardTitle';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
);
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
