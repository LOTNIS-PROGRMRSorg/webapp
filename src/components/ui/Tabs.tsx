export interface TabItem<K extends string> { key: K; label: string; badge?: number }

/** Underlined tabs. Controlled: you own `value` and `onChange` (often a ?tab= search param, so tabs are linkable). */
export function Tabs<K extends string>({ tabs, value, onChange, label = 'Sections' }: { tabs: Array<TabItem<K>>; value: K; onChange: (key: K) => void; label?: string }) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button key={t.key} role="tab" aria-selected={value === t.key} className={`tab ${value === t.key ? 'tab-on' : ''}`} onClick={() => onChange(t.key)}>
          {t.label}{t.badge ? <em className="tab-badge">{t.badge}</em> : null}
        </button>
      ))}
    </div>
  );
}

/** Rounded filter chips (single choice). */
export function ChipGroup<K extends string>({ options, value, onChange, label }: { options: Array<{ key: K; label: string }>; value: K; onChange: (key: K) => void; label?: string }) {
  return <div className="chip-group" role="group" aria-label={label}>{options.map((o) => <button key={o.key} className={`chip ${value === o.key ? 'chip-active' : ''}`} onClick={() => onChange(o.key)}>{o.label}</button>)}</div>;
}
