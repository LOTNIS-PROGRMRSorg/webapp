/** An image with a calm placeholder when there isn't one yet. */
export function Photo({ src, alt = '', className = '' }: { src?: string | null; alt?: string; className?: string }) {
  return src
    ? <img className={`ph ${className}`} src={src} alt={alt} loading="lazy" />
    : <div className={`ph ph-empty ${className}`} role="img" aria-label={alt || 'No photo yet'} />;
}

/** A small round or rounded picture with initials as a fallback — people, hosts, contestants. */
export function Avatar({ src, name, size = 'md', className = '' }: { src?: string | null; name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }) {
  return src
    ? <img className={`avatar avatar-${size} ${className}`} src={src} alt={name} loading="lazy" />
    : <span className={`avatar avatar-${size} avatar-ph ${className}`} aria-label={name}>{name.slice(0, 1).toUpperCase()}</span>;
}
