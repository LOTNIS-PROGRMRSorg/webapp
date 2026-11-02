import { useEffect, useRef, useState } from 'react';
import { ListChecks } from 'lucide-react';
import { ESSENTIALS } from './exploreFilters';

/** One compact button for the power, water and security filters, opening a short checklist. */
export function MustHaves({
  selected,
  onToggle,
  onClear,
}: {
  selected: string[];
  onToggle: (key: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', outside);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('keydown', escape);
    };
  }, [open]);

  return (
    <div className="sp-must" ref={box}>
      <button
        type="button"
        className={`sp-tool${selected.length ? ' on' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={`Must-haves${selected.length ? `, ${selected.length} selected` : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <ListChecks size={16} /> <span>Must-haves</span>
        {selected.length > 0 && <b>{selected.length}</b>}
      </button>
      {open && (
        <div className="sp-must-pop" role="dialog" aria-label="Must-haves">
          <p>Only show spaces with</p>
          <ul>
            {ESSENTIALS.map(({ key, label, icon: Icon, tone }) => (
              <li key={key}>
                <label>
                  <Icon size={17} className={tone ? `tone-${tone}` : undefined} />
                  <span>{label}</span>
                  <input type="checkbox" checked={selected.includes(key)} onChange={() => onToggle(key)} />
                </label>
              </li>
            ))}
          </ul>
          <div className="sp-must-foot">
            <button type="button" className="sp-link-btn" onClick={onClear} disabled={!selected.length}>
              Clear
            </button>
            <button type="button" className="sp-must-done" onClick={() => setOpen(false)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
