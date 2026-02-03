import { useState, useRef, useEffect } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  placeholder?: React.ReactNode
  sizes?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  placeholder = null,
  sizes = '100vw',
  priority = false,
  onLoad = () => {},
  onError = () => {},
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState('')
  const imgRef = useRef<HTMLImageElement>(null)
  const [isInView, setIsInView] = useState(priority)

  // Generate responsive image URLs
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc) return ''

    const widths = [320, 640, 768, 1024, 1280, 1536, 1920]
    const srcSet = widths.map(w => {
      // In production, you would use a service like Cloudinary or ImageKit
      // For now, we'll use the original image
      return `${baseSrc} ${w}w`
    }).join(', ')

    return srcSet
  }

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before image comes into view
      }
    )

    observer.observe(imgRef.current)

    return () => observer.disconnect()
  }, [priority])

  // Set image source when in view
  useEffect(() => {
    if (isInView && src) {
      setCurrentSrc(src)
    }
  }, [isInView, src])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad()
  }

  const handleError = () => {
    setIsError(true)
    onError()
  }

  // Placeholder component
  const PlaceholderComponent = () => {
    if (placeholder) {
      return <>{placeholder}</>
    }

    return (
      <div
        className={`bg-slate-200 dark:bg-slate-700 animate-pulse flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-slate-400 text-2xl">📷</div>
      </div>
    )
  }

  // Error component
  const ErrorComponent = () => (
    <div
      className={`bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${className}`}
      style={{ width, height }}
    >
      <div className="text-center text-slate-400">
        <div className="text-2xl mb-2">🖼️</div>
        <div className="text-sm">Không thể tải ảnh</div>
      </div>
    </div>
  )

  return (
    <div ref={imgRef} className="relative">
      {/* Show placeholder while loading or not in view */}
      {(!isInView || !isLoaded) && !isError && <PlaceholderComponent />}

      {/* Show error state */}
      {isError && <ErrorComponent />}

      {/* Main image */}
      {isInView && currentSrc && !isError && (
        <img
          src={currentSrc}
          srcSet={generateSrcSet(currentSrc)}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  )
}

export default OptimizedImage
