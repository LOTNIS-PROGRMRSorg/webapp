import type { CityCopy, SpaceCopy } from '@/lib/seo/content';
import { Link } from 'react-router-dom';

export function AboutSection({ space, city }: { space?: SpaceCopy; city?: CityCopy }) {
  return (
    <section className="ex-about reveal" aria-labelledby="ex-about-title">
      <div>
        <h2 id="ex-about-title">
          {space
            ? `Renting ${space.plural} on Lotnis`
            : city
              ? `Renting in ${city.name}`
              : 'How renting works on Lotnis'}
        </h2>
        <p>
          {space && !city
            ? space.intro
            : city
              ? `${city.intro}${city.areas.length ? ` Popular areas: ${city.areas.join(', ')}.` : ''}`
              : 'Lotnis is a marketplace for space. Hosts list rooms, homes, villas, offices, shops, garages and warehouses; you rent exactly what you need, for as long as you need it — by the night, week, month or year.'}
        </p>
        <p className="muted-inline">
          Read how <Link to="/refund-policy">refunds and cancellations</Link> work, or our{' '}
          <Link to="/terms">Terms of Use</Link>.
        </p>
      </div>
      <ul className="ex-why-cards">
        {(
          space?.why ?? [
            'Every host is ID-verified and every listing is approved',
            'See the full price — stay, service fee and deposit — before you pay',
            'Clear refund rules, and a fair notice process if you leave early',
          ]
        ).map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
      {space && space.faqs.length > 0 && !city && (
        <div className="ex-faq">
          <h3>Common questions about renting {space.plural}</h3>
          {space.faqs.map((f) => (
            <details key={f.question}>
              <summary>{f.question}</summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
