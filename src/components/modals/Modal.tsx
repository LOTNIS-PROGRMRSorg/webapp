import { ReactNode, useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * The one dialog frame in the app: dimmed backdrop, title, close button, Esc / click-outside to close.
 * Keeps keyboard focus inside while open, returns it to whatever opened the dialog on close, and stops
 * the page behind from scrolling. On phones it becomes a bottom sheet (see system.css).
 */
export function Modal({
  title,
  onClose,
  children,
  wide,
  as = 'div',
  onSubmit,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  /** Render the card as a <form> so Enter submits and the submit button can be type="submit". */
  as?: 'div' | 'form';
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const card = ref.current;
    const firstField = card?.querySelector<HTMLElement>(
      'input:not([type=hidden]):not([type=checkbox]):not([type=radio]),textarea,select',
    );
    (firstField ?? card)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key !== 'Tab' || !card) return;
      const items = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === card)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);

    const { overflow, paddingRight } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`;

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, []);

  const head = (
    <div className="modal-head">
      <h2 id={titleId}>{title}</h2>
      <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
        <X size={18} />
      </button>
    </div>
  );
  const cardClass = `modal-card ${wide ? 'modal-wide' : ''}`;
  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {as === 'form' ? (
        <form className={cardClass} ref={ref as React.RefObject<HTMLFormElement>} tabIndex={-1} onSubmit={onSubmit}>
          {head}
          {children}
        </form>
      ) : (
        <div className={cardClass} ref={ref as React.RefObject<HTMLDivElement>} tabIndex={-1}>
          {head}
          {children}
        </div>
      )}
    </div>
  );
}
