import { useRef, useEffect, useState } from 'react'

interface LazyIframeProps {
  src: string
  title: string
  className?: string
  width?: string | number
  height?: string | number
  aspectRatio?: string
  allow?: string
  allowFullScreen?: boolean
  loading?: 'lazy' | 'eager'
  threshold?: number
  rootMargin?: string
  placeholder?: React.ReactNode
  onLoad?: () => void
  onError?: () => void
}

/**
 * LazyIframe Component - Loads iframes only when they enter the viewport
 * Perfect for YouTube, Vimeo, Google Maps, and other embedded content
 *
 * @example
 * <LazyIframe
 *   src="https://www.youtube.com/embed/VIDEO_ID"
 *   title="Product Demo Video"
 *   aspectRatio="16/9"
 * />
 */
const LazyIframe = ({
  src,
  title,
  className = '',
  width = '100%',
  height = '100%',
  aspectRatio,
  allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
  allowFullScreen = true,
  loading = 'lazy',
  threshold = 0.1,
  rootMargin = '200px',
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
}: LazyIframeProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true)
            observer.disconnect() // Stop observing once loaded
          }
        })
      },
      {
        threshold,
        rootMargin,
      }
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, isInView])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad()
  }

  const handleError = () => {
    setHasError(true)
    onError()
  }

  const defaultPlaceholder = (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
      <div className="text-center">
        <div className="w-12 h-12 mx-auto mb-3 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-600 dark:text-slate-400">Loading content...</p>
      </div>
    </div>
  )

  const errorPlaceholder = (
    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
      <div className="text-center text-slate-600 dark:text-slate-400">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-sm">Failed to load content</p>
      </div>
    </div>
  )

  const containerStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...(aspectRatio && { aspectRatio }),
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg ${className}`}
      style={containerStyle}
    >
      {/* Error state */}
      {hasError && errorPlaceholder}

      {/* Loading placeholder */}
      {!isLoaded && !hasError && (placeholder || defaultPlaceholder)}

      {/* Iframe loaded only when in view */}
      {isInView && !hasError && (
        <iframe
          src={src}
          title={title}
          className={`w-full h-full border-0 transition-opacity duration-500 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          allow={allow}
          allowFullScreen={allowFullScreen}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}

export default LazyIframe
