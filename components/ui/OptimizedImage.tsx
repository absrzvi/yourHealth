'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

/**
 * OptimizedImage component
 * 
 * A wrapper around Next.js Image component with:
 * - Better error handling with fallbacks
 * - Standardized loading behavior
 * - Consistent blur placeholders
 * - Responsive sizes configuration
 */
interface OptimizedImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
  containerClassName?: string;
  lowQualityPlaceholder?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/fallback-placeholder.webp',
  containerClassName,
  className,
  fill,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  loading = 'lazy',
  quality = 80,
  lowQualityPlaceholder = false,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [error, setError] = useState(false);
  
  // Handle image load error
  const handleError = () => {
    setError(true);
    if (fallbackSrc) {
      setImgSrc(fallbackSrc);
    }
  };

  // Only use blur placeholder for images that are not prioritized and opt-in
  const blurDataURL = lowQualityPlaceholder && !priority 
    ? 'data:image/svg+xml;base64,Cjxzdmcgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImciPgogICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjZWVlIiBvZmZzZXQ9IjIwJSIgLz4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI2Y1ZjVmNSIgb2Zmc2V0PSI1MCUiIC8+CiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiNlZWUiIG9mZnNldD0iNzAlIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICA8L2RlZnM+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNlZWUiIC8+CiAgPHJlY3QgaWQ9InIiIHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI2cpIiAvPgogIDxhbmltYXRlIHhsaW5rOmhyZWY9IiNyIiBhdHRyaWJ1dGVOYW1lPSJ4IiBmcm9tPSItNDAwIiB0bz0iNDAwIiBkdXI9IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIgIC8+Cjwvc3ZnPg==' 
    : undefined;

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <Image
        src={imgSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          error ? "opacity-70" : "opacity-100",
          className
        )}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        loading={!priority ? loading : undefined}
        onError={handleError}
        placeholder={blurDataURL ? "blur" : undefined}
        blurDataURL={blurDataURL}
        {...props}
      />
    </div>
  );
}
