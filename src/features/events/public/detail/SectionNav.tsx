import { useEffect, useState } from 'react';

export type Section = { id: string; label: string };

/** Sticky in-page nav that highlights the section being read and scrolls smoothly to the others. */
export function SectionNav({ sections, onJump }: { sections: Section[]; onJump?: (id: string) => void }) {
  const [active, setActive] = useState(sections[0]?.id);
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-120px 0px -60% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);
  return (
    <nav className="evd-nav" aria-label="Event sections">
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={active === s.id ? 'is-on' : ''}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActive(s.id);
            onJump?.(s.id);
          }}
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
