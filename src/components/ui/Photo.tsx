import { photoProps } from '@/lib/images';

/**
 * An image with a calm placeholder when there isn't one yet. Pass `sizes` (how wide it shows on the page) to load a
 * resized copy instead of the full upload, and `priority` for the page's main image so it isn't loaded lazily.
 */
export function Photo({
  src,
  alt = '',
  className = '',
  sizes,
  priority,
}: {
  src?: string | null;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return src ? (
    <img
      className={`ph ${className}`}
      {...(sizes ? photoProps(src, sizes) : { src })}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
    />
  ) : (
    <div className={`ph ph-empty ${className}`} role="img" aria-label={alt || 'No photo yet'} />
  );
}

/** A small round or rounded picture with initials as a fallback — people, hosts, contestants. */
export function Avatar({
  src,
  name,
  size = 'md',
  className = '',
}: {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  return src ? (
    <img className={`avatar avatar-${size} ${className}`} src={src} alt={name} loading="lazy" />
  ) : (
    <span className={`avatar avatar-${size} avatar-ph ${className}`} aria-label={name}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
