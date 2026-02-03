import React from 'react';
import {
  BeatLoader,
  ClipLoader,
  PulseLoader,
  HashLoader,
  RingLoader,
  SyncLoader,
  DotLoader
} from 'react-spinners';

export type SpinnerVariant = 'beat' | 'clip' | 'pulse' | 'hash' | 'ring' | 'sync' | 'dot';
export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface SpinnerProps {
  variant?: SpinnerVariant;
  size?: SpinnerSize;
  color?: string;
  loading?: boolean;
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

const sizeMap = {
  sm: { beat: 8, clip: 20, pulse: 8, hash: 30, ring: 30, sync: 8, dot: 30 },
  md: { beat: 12, clip: 35, pulse: 12, hash: 50, ring: 50, sync: 12, dot: 50 },
  lg: { beat: 16, clip: 50, pulse: 16, hash: 70, ring: 70, sync: 16, dot: 70 },
  xl: { beat: 20, clip: 70, pulse: 20, hash: 100, ring: 100, sync: 20, dot: 100 },
};

export function Spinner({
  variant = 'clip',
  size = 'md',
  color = 'hsl(var(--primary))',
  loading = true,
  fullScreen = false,
  message,
  className = '',
}: SpinnerProps) {
  if (!loading) return null;

  const spinnerSize = sizeMap[size][variant];

  const renderSpinner = () => {
    const commonProps = { color, loading, size: spinnerSize };

    switch (variant) {
      case 'beat':
        return <BeatLoader {...commonProps} />;
      case 'clip':
        return <ClipLoader {...commonProps} />;
      case 'pulse':
        return <PulseLoader {...commonProps} />;
      case 'hash':
        return <HashLoader {...commonProps} />;
      case 'ring':
        return <RingLoader {...commonProps} />;
      case 'sync':
        return <SyncLoader {...commonProps} />;
      case 'dot':
        return <DotLoader {...commonProps} />;
      default:
        return <ClipLoader {...commonProps} />;
    }
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      {renderSpinner()}
      {message && (
        <p className="text-muted-foreground text-sm sm:text-base animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// Preset spinner variants for common use cases
export const PageSpinner = () => (
  <Spinner variant="hash" size="lg" fullScreen message="Loading..." />
);

export const ButtonSpinner = ({ className = '' }: { className?: string }) => (
  <Spinner variant="clip" size="sm" className={className} />
);

export const CardSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Spinner variant="ring" size="md" />
  </div>
);

export const InlineSpinner = ({ message }: { message?: string }) => (
  <Spinner variant="beat" size="sm" message={message} />
);
