import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export type MultiOption = { value: string; label: string; group?: string };

/**
 * A dropdown where you tick several options. Picked options show as chips you can remove.
 * Type to filter, ↑/↓ to move, Enter or Space to tick, Esc to close. Options can be grouped.
 */
export function MultiSelect({
  label,
  hint,
  options,
  value,
  onChange,
  max,
  placeholder = 'Choose…',
  searchPlaceholder = 'Search',
}: {
  label: string;
  hint?: string;
  options: MultiOption[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const labelId = `${id}-label`;
  const listId = `${id}-list`;

  const visible = useMemo(() => {
    const t = query.trim().toLowerCase();
    return t ? options.filter((o) => o.label.toLowerCase().includes(t)) : options;
  }, [options, query]);

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;
  const full = max != null && value.length >= max;

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else if (!full) onChange([...value, v]);
  };

  // Close when clicking or tabbing away.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    searchRef.current?.focus();
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, visible.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && visible[active]) {
      e.preventDefault();
      toggle(visible[active].value);
    }
  };

  let lastGroup: string | undefined;
  return (
    <div className="msel" ref={rootRef} onBlur={(e) => !rootRef.current?.contains(e.relatedTarget) && setOpen(false)}>
      <span className="msel-label" id={labelId}>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <div className="msel-field">
        <button
          type="button"
          className="msel-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-labelledby={labelId}
          onClick={() => setOpen((o) => !o)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && !open) {
              e.preventDefault();
              setOpen(true);
            }
          }}
        >
          <span className={value.length ? '' : 'msel-placeholder'}>
            {value.length ? `${value.length} selected` : placeholder}
          </span>
          <ChevronDown size={16} aria-hidden="true" />
        </button>

        {open && (
          <div className="msel-pop" onKeyDown={onKey}>
            <div className="msel-search">
              <Search size={15} aria-hidden="true" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                aria-controls={listId}
                aria-activedescendant={visible[active] ? `${id}-${visible[active].value}` : undefined}
              />
            </div>
            <ul className="msel-list" id={listId} role="listbox" aria-multiselectable="true" aria-labelledby={labelId}>
              {visible.length === 0 && <li className="msel-empty">Nothing matches “{query.trim()}”</li>}
              {visible.map((o, i) => {
                const showGroup = o.group && o.group !== lastGroup;
                lastGroup = o.group;
                const on = value.includes(o.value);
                const disabled = !on && full;
                return (
                  <li key={o.value} role="presentation">
                    {showGroup && <span className="msel-group">{o.group}</span>}
                    <div
                      id={`${id}-${o.value}`}
                      role="option"
                      aria-selected={on}
                      aria-disabled={disabled || undefined}
                      className={`msel-option${i === active ? ' is-active' : ''}${disabled ? ' is-disabled' : ''}`}
                      onMouseDown={(e) => e.preventDefault()}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => !disabled && toggle(o.value)}
                    >
                      <span className="msel-box" aria-hidden="true">
                        {on && <Check size={13} strokeWidth={3} />}
                      </span>
                      {o.label}
                    </div>
                  </li>
                );
              })}
            </ul>
            {max != null && (
              <p className="msel-foot">
                {value.length} of {max} chosen{full ? ' — remove one to pick another' : ''}
              </p>
            )}
          </div>
        )}
      </div>

      {value.length > 0 && (
        <ul className="msel-chips" aria-label={`${label} chosen`}>
          {value.map((v) => (
            <li key={v}>
              {labelOf(v)}
              <button type="button" onClick={() => toggle(v)} aria-label={`Remove ${labelOf(v)}`}>
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
