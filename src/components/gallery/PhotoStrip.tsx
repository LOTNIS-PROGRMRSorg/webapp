import { useRef, useState } from 'react';
import { Camera, ChevronLeft, ChevronRight } from 'lucide-react';
import { Lightbox, GalleryImage } from './Lightbox';
import './gallery.css';

/**
 * A swipeable photo carousel for a card. Scrolls with a finger or the arrows, shows where you are, and
 * opens the full-screen viewer on tap. With no photos it shows a calm placeholder instead of a gap.
 */
export function PhotoStrip({
  images,
  title,
  ratio = '4 / 3',
}: {
  images: GalleryImage[];
  title?: string;
  ratio?: string;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [at, setAt] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const n = images.length;
  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    el.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * el.clientWidth, behavior: 'smooth' });
  };
  if (!n)
    return (
      <div className="ps ps-empty" style={{ aspectRatio: ratio }}>
        <Camera size={22} />
        <span>No photos yet</span>
      </div>
    );
  return (
    <div className="ps" style={{ aspectRatio: ratio }}>
      <div
        className="ps-track"
        ref={track}
        onScroll={(e) => setAt(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
      >
        {images.map((img, i) => (
          <button
            type="button"
            className="ps-slide"
            key={img.url + i}
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1} of ${n}`}
          >
            <img src={img.url} alt={img.caption ?? ''} loading={i === 0 ? 'eager' : 'lazy'} />
          </button>
        ))}
      </div>
      {n > 1 && (
        <>
          <button
            type="button"
            className="ps-arrow ps-l"
            aria-label="Previous photo"
            onClick={() => go(at - 1)}
            disabled={at === 0}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="ps-arrow ps-r"
            aria-label="Next photo"
            onClick={() => go(at + 1)}
            disabled={at >= n - 1}
          >
            <ChevronRight size={18} />
          </button>
          <span className="ps-count">
            <Camera size={13} /> {at + 1} / {n}
          </span>
          <span className="ps-dots" aria-hidden="true">
            {images.slice(0, 7).map((_, i) => (
              <i key={i} className={i === Math.min(at, 6) ? 'on' : ''} />
            ))}
          </span>
        </>
      )}
      {open !== null && (
        <Lightbox images={images} index={open} title={title} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </div>
  );
}
