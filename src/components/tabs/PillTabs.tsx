import { ReactNode } from 'react';

export interface PillTab<K extends string = string> {
  key: K;
  label: ReactNode;
  /** A 3D icon: an image URL (e.g. /images/nav/events.png) or any element. */
  icon?: string | ReactNode;
  /** A small number after the label (a count). */
  count?: number;
  /** A red badge after the label (needs attention). */
  badge?: number;
  /** "Soon" tag for lines that are not live yet. */
  soon?: boolean;
  disabled?: boolean;
}

const Icon = ({ icon }: { icon: PillTab['icon'] }) =>
  typeof icon === 'string' ? (
    <img className="pt-icon" src={icon} alt="" width={28} height={28} draggable={false} />
  ) : (
    <span className="pt-icon">{icon}</span>
  );

/**
 * The one tab control for the whole site: raised pill buttons with an optional 3D icon. The selected pill lifts
 * higher and casts a deeper shadow. Controlled — you own `value` (often a ?tab= search param, so tabs are linkable).
 * `role="tablist"` for switching panels, `"group"` for filters that just narrow a list.
 */
export function PillTabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
  role = 'tablist',
  className = '',
  trailing,
}: {
  tabs: Array<PillTab<K>>;
  value: K;
  onChange: (key: K) => void;
  label?: string;
  role?: 'tablist' | 'group';
  className?: string;
  /** Extra controls in the same row, e.g. an on/off pill like "Free". */
  trailing?: ReactNode;
}) {
  const isTabs = role === 'tablist';
  return (
    <div className={`pt-row ${className}`} role={role} aria-label={label}>
      {tabs.map((t) => {
        const on = value === t.key;
        return (
          <button
            key={t.key}
            type="button"
            role={isTabs ? 'tab' : undefined}
            aria-selected={isTabs ? on : undefined}
            aria-pressed={isTabs ? undefined : on}
            disabled={t.disabled}
            className={`pt ${on ? 'pt-on' : ''}`}
            onClick={() => onChange(t.key)}
          >
            {t.icon != null && <Icon icon={t.icon} />}
            <span className="pt-label">{t.label}</span>
            {t.soon && <em className="pt-soon">Soon</em>}
            {t.count != null && <b className="pt-count">{t.count}</b>}
            {t.badge ? <em className="pt-badge">{t.badge}</em> : null}
          </button>
        );
      })}
      {trailing}
    </div>
  );
}
