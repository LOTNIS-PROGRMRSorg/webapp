import { ReactNode, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/** The one dialog frame in the app: dimmed backdrop, title, close button, Esc / click-outside to close. */
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    ref.current?.querySelector<HTMLElement>('input:not([type=hidden]):not([type=checkbox]),textarea,select')?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-card ${wide ? 'modal-wide' : ''}`} ref={ref}>
        <div className="modal-head"><h2>{title}</h2><button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        {children}
      </div>
    </div>
  );
}
