/**
 * Image Optimization Utility
 * Provides functions for optimizing image loading and display
 */

/**
 * Generate optimized image URL with query parameters for backend compression
 * @param {string} originalUrl - Original image URL
 * @param {object} options - Optimization options
 * @returns {string} - Optimized URL
 */
export const getOptimizedImageUrl = (originalUrl, options = {}) => {
  const {
    width = 800,
    quality = 80,
    format = 'webp'
  } = options;

  if (!originalUrl) return '';

  // If already a data URL or blob, return as-is
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
    return originalUrl;
  }

  // Add query parameters for optimization
  const separator = originalUrl.includes('?') ? '&' : '?';
  return `${originalUrl}${separator}w=${width}&q=${quality}&fmt=${format}`;
};

/**
 * Get responsive image srcSet for different screen sizes
 * @param {string} baseUrl - Base image URL
 * @returns {string} - srcSet string for img element
 */
export const getResponsiveImageSrcSet = (baseUrl) => {
  if (!baseUrl) return '';

  const sizes = [
    { size: 400, density: '1x' },
    { size: 800, density: '2x' },
    { size: 1200, density: '3x' }
  ];

  return sizes
    .map(({ size, density }) => {
      const url = getOptimizedImageUrl(baseUrl, { width: size });
      return `${url} ${size}w`;
    })
    .join(', ');
};

/**
 * Get optimized image with fallback
 * @param {string} originalUrl - Original image URL
 * @param {object} options - Options for optimization
 * @returns {object} - Object with src and srcSet
 */
export const getOptimizedImage = (originalUrl, options = {}) => {
  const {
    width = 800,
    quality = 80,
    thumbnail = true
  } = options;

  if (!originalUrl) {
    return {
      src: '',
      srcSet: '',
      thumbnail: ''
    };
  }

  return {
    src: getOptimizedImageUrl(originalUrl, { width, quality }),
    srcSet: getResponsiveImageSrcSet(originalUrl),
    thumbnail: thumbnail ? getOptimizedImageUrl(originalUrl, { width: 100, quality: 60 }) : '',
  };
};

/**
 * Convert image to WebP with compression client-side (if needed)
 * @param {File} file - Image file
 * @param {object} options - Compression options
 * @returns {Promise<Blob>} - Compressed WebP blob
 */
export const compressImageToWebP = async (file, options = {}) => {
  const {
    maxWidth = 2000,
    maxHeight = 2000,
    quality = 0.85,
    maxSize = 1 * 1024 * 1024 // 1MB
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // Create canvas for compression
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Draw white background for transparency
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP
        canvas.toBlob(
          (blob) => {
            if (blob.size > maxSize) {
              // If still too large, reduce quality further
              const reducedQuality = quality * 0.7;
              canvas.toBlob(
                (blob2) => resolve(blob2),
                'image/webp',
                reducedQuality
              );
            } else {
              resolve(blob);
            }
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Get appropriate image sizes based on container
 * @param {number} containerWidth - Container width in pixels
 * @returns {object} - Sizes object for srcSet
 */
export const getImageSizesByContainer = (containerWidth) => {
  // Map container width to optimized image sizes
  const sizeMap = {
    small: { width: 300, height: 300 },    // < 400px
    medium: { width: 600, height: 600 },   // 400-800px
    large: { width: 1200, height: 1200 },  // > 800px
  };

  if (containerWidth < 400) return sizeMap.small;
  if (containerWidth < 800) return sizeMap.medium;
  return sizeMap.large;
};

export default {
  getOptimizedImageUrl,
  getResponsiveImageSrcSet,
  getOptimizedImage,
  compressImageToWebP,
  getImageSizesByContainer
};
