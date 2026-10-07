import React, { useState, useEffect, useRef } from 'react';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';

/**
 * OptimizedImage Component
 * Provides lazy loading, responsive images, and automatic compression
 */
export const OptimizedImage = ({
  src,
  alt = 'Image',
  width,
  height,
  className = '',
  quality = 80,
  maxWidth = 1200,
  lazy = true,
  thumbnail = true,
  onLoad,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [thumbnailSrc, setThumbnailSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // Generate optimized URLs
    const optimizedUrl = getOptimizedImageUrl(src, {
      width: maxWidth,
      quality
    });

    const thumbUrl = thumbnail ? getOptimizedImageUrl(src, {
      width: 100,
      quality: 60
    }) : null;

    setThumbnailSrc(thumbUrl);
    setImageSrc(optimizedUrl);
  }, [src, quality, maxWidth, thumbnail]);

  const handleImageLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleImageError = () => {
    setError(true);
    setIsLoading(false);
  };

  if (!src || error) {
    return (
      <div 
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Image not available</span>
      </div>
    );
  }

  return (
    <picture>
      {/* WebP source with optimization */}
      <source 
        srcSet={imageSrc}
        type="image/webp"
      />
      
      {/* Fallback source */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'} ${className}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : 'auto',
          objectFit: 'cover',
          ...props.style
        }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />

      {/* Placeholder while loading */}
      {isLoading && thumbnailSrc && (
        <img
          src={thumbnailSrc}
          alt=""
          width={width}
          height={height}
          className={`absolute inset-0 ${className}`}
          style={{
            width: width ? `${width}px` : '100%',
            height: height ? `${height}px` : 'auto',
            objectFit: 'cover',
            filter: 'blur(8px)'
          }}
          aria-hidden="true"
        />
      )}
    </picture>
  );
};

export default OptimizedImage;
