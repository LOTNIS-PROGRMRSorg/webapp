import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSession } from '@/lib/api';
import { LINES, partnerMailto } from '@/lib/lines';
import { LINE_ICON } from './homeShared';

// ── Four equal doors ────────────────────────────────────────────────────────
export function LinesGrid() {
  return (
    <section className="lp-section lp-container lp-lines-sec" aria-labelledby="lp-lines-title">
      <div className="lp-section-head reveal"><div><span className="lp-eyebrow">One account · four ways</span>
        <h2 id="lp-lines-title">Whatever you need, start here.</h2></div></div>
      <div className="lp-lines">
        {LINES.map((l, i) => { const Icon = LINE_ICON[l.key]; return (
          <Link key={l.key} to={l.path} className={`lp-line lp-line-${l.key} reveal`} style={{ transitionDelay: `${i * 70}ms` }}>
            <span className="lp-line-top"><span className="lp-line-icon"><Icon size={26} strokeWidth={1.6} /></span>{l.status === 'live' ? <b className="lp-badge-live">Live now</b> : <b className="lp-badge-soon">Launching soon</b>}</span>
            <h3>{l.label}</h3>
            <p>{l.tagline}</p>
            <ul>{l.examples.slice(0, 3).map((e) => <li key={e}>{e}</li>)}</ul>
            <span className="lp-line-go">{l.status === 'live' ? (l.browseCta ?? 'Browse spaces') : 'See what\'s coming'} <ArrowRight size={15} /></span>
          </Link>); })}
      </div>
    </section>
  );
}

export function Providers() {
  const signedIn = Boolean(getSession());
  return (
    <section className="lp-section lp-container" aria-labelledby="lp-providers-title">
      <div className="lp-section-head reveal"><div><span className="lp-eyebrow">Earn on Lotnis</span>
        <h2 id="lp-providers-title">Got a space or an event? Get paid for it.</h2>
        <p className="lp-intro">One verified account and one payout method. <Link to="/how-it-works">See how Lotnis works</Link>.</p></div></div>
      <div className="lp-lines lp-providers">
        {LINES.filter((l) => l.status === 'live').map((l, i) => { const Icon = LINE_ICON[l.key]; return (
          <div key={l.key} className={`lp-line lp-line-${l.key} reveal`} style={{ transitionDelay: `${i * 70}ms` }}>
            <span className="lp-line-top"><span className="lp-line-icon"><Icon size={26} strokeWidth={1.6} /></span>{l.status === 'live' ? <b className="lp-badge-live">Open now</b> : <b className="lp-badge-soon">Soon</b>}</span>
            <h3>{l.providerTitle}</h3><p>{l.providerText}</p>
            {l.status === 'live'
              ? <Link className="lp-line-go" to={signedIn ? '/host' : '/auth?next=/host'}>{l.providerCta} <ArrowRight size={15} /></Link>
              : <a className="lp-line-go" href={partnerMailto(l.providerMail ?? l.providerTitle)}>{l.providerCta} <ArrowRight size={15} /></a>}
          </div>); })}
      </div>
    </section>
  );
}
