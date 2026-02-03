import React from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveTableWrapperProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}

/**
 * Responsive table wrapper component
 * Provides horizontal scrolling on mobile devices
 *
 * @example
 * <ResponsiveTableWrapper>
 *   <Table>
 *     {/* table content *\/}
 *   </Table>
 * </ResponsiveTableWrapper>
 */
export function ResponsiveTableWrapper({
  children,
  className,
  minWidth = '800px'
}: ResponsiveTableWrapperProps) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div style={{ minWidth }} className="inline-block min-w-full align-middle">
        {children}
      </div>
    </div>
  );
}

export default ResponsiveTableWrapper;
