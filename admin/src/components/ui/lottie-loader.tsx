import React from 'react';
import Lottie from 'lottie-react';

interface LottieLoaderProps {
  animationData?: any;
  width?: number | string;
  height?: number | string;
  loop?: boolean;
  autoplay?: boolean;
  fullScreen?: boolean;
  message?: string;
  className?: string;
}

// Default loading animation data (simple circular loader)
const defaultAnimationData = {
  v: '5.5.7',
  fr: 60,
  ip: 0,
  op: 120,
  w: 200,
  h: 200,
  nm: 'Loading',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Circle',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ i: { x: [0.833], y: [0.833] }, o: { x: [0.167], y: [0.167] }, t: 0, s: [0] }, { t: 120, s: [360] }] },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              d: 1,
              ty: 'el',
              s: { a: 0, k: [100, 100] },
              p: { a: 0, k: [0, 0] },
              nm: 'Ellipse Path 1'
            },
            {
              ty: 'st',
              c: { a: 0, k: [0.31, 0.78, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 10 },
              lc: 2,
              lj: 1,
              nm: 'Stroke 1'
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ],
          nm: 'Ellipse 1'
        },
        {
          ty: 'tm',
          s: { a: 0, k: 0 },
          e: { a: 1, k: [{ i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [0] }, { t: 60, s: [100] }] },
          o: { a: 0, k: 0 },
          m: 1
        }
      ],
      ip: 0,
      op: 120,
      st: 0,
      bm: 0
    }
  ]
};

export function LottieLoader({
  animationData = defaultAnimationData,
  width = 200,
  height = 200,
  loop = true,
  autoplay = true,
  fullScreen = false,
  message,
  className = '',
}: LottieLoaderProps) {
  const lottieStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={lottieStyle}
      />
      {message && (
        <p className="text-muted-foreground text-sm sm:text-base text-center animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// Preset Lottie components for different use cases
export const PageLoader = ({ message = 'Loading...' }: { message?: string }) => (
  <LottieLoader fullScreen message={message} width={300} height={300} />
);

export const InlineLoader = ({ size = 100 }: { size?: number }) => (
  <LottieLoader width={size} height={size} />
);

export const CardLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <LottieLoader width={150} height={150} />
  </div>
);

// Hook to use custom Lottie animation from URL
export const useLottieAnimation = (url: string) => {
  const [animationData, setAnimationData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        setAnimationData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, [url]);

  return { animationData, loading, error };
};
