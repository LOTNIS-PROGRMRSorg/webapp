import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './gallery.css';

export type GalleryImage = { url: string; caption?: string | null };

/** Full-screen photos: arrow keys and swipe-friendly buttons, Esc to close, the page behind stays put. */
export function Lightbox({
  images,
  index,
  title,
  onIndex,
  onClose,
}: {
  images: GalleryImage[];
  index: number;
  title?: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const n = images.length;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % n);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + n) % n);
    };
    document.addEventListener('keydown', key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', key);
      document.body.style.overflow = prev;
    };
  }, [index, n, onIndex, onClose]);

  const img = images[index];
  if (!img) return null;
  return createPortal(
    <div className="lb" role="dialog" aria-modal="true" aria-label={title ?? 'Photos'} onClick={onClose}>
      <header className="lb-bar" onClick={(e) => e.stopPropagation()}>
        <span>
          {title ? `${title} · ` : ''}
          {index + 1} / {n}
        </span>
        <button type="button" className="lb-x" onClick={onClose} aria-label="Close photos">
          <X size={20} />
        </button>
      </header>
      <figure className="lb-stage" onClick={(e) => e.stopPropagation()}>
        <img src={img.url} alt={img.caption ?? ''} />
        {img.caption && <figcaption>{img.caption}</figcaption>}
      </figure>
      {n > 1 && (
        <>
          <button
            type="button"
            className="lb-nav lb-prev"
            aria-label="Previous photo"
            onClick={(e) => (e.stopPropagation(), onIndex((index - 1 + n) % n))}
          >
            <ChevronLeft size={24} />
          </button>
          <button
            type="button"
            className="lb-nav lb-next"
            aria-label="Next photo"
            onClick={(e) => (e.stopPropagation(), onIndex((index + 1) % n))}
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>,
    document.body,
  );
}
