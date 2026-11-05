import { useEffect, useState } from 'react';
import type { PillTab } from './PillTabs';

/** The same pills as in-page links: highlights the section being read and scrolls smoothly to the others. */
export function PillAnchorTabs({
  sections,
  label,
  onJump,
}: {
  sections: Array<Pick<PillTab, 'label' | 'icon'> & { id: string }>;
  label?: string;
  onJump?: (id: string) => void;
}) {
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-120px 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);
  return (
    <nav className="pt-row pt-sticky" aria-label={label}>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`pt ${active === s.id ? 'pt-on' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActive(s.id);
            onJump?.(s.id);
          }}
        >
          {s.icon != null &&
            (typeof s.icon === 'string' ? (
              <img className="pt-icon" src={s.icon} alt="" width={28} height={28} />
            ) : (
              <span className="pt-icon">{s.icon}</span>
            ))}
          <span className="pt-label">{s.label}</span>
        </a>
      ))}
    </nav>
  );
}
