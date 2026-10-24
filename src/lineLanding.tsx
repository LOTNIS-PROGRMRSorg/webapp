import { ArrowRight, Building2, Clock, Ticket, UtensilsCrossed, Wrench } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { LINES, lineByKey, partnerMailto, type LineKey } from './lines';
import { breadcrumbLd, faqLd, Seo, webPageLd } from './seo';

const ICON = { spaces: Building2, food: UtensilsCrossed, services: Wrench, events: Ticket } as const;

/** /food, /services and /events: a real page for each line that isn't live yet — what it will be,
 *  who can offer it, how it will work — so the line is findable, honest, and ready to launch. */
export function LineLanding({ lineKey }: { lineKey: Exclude<LineKey, 'spaces'> }) {
  const line = lineByKey(lineKey);
  const Icon = ICON[lineKey];
  const [params] = useSearchParams();
  const wanted = params.get('query')?.trim();
  const where = params.get('where')?.trim();
  const others = LINES.filter((l) => l.key !== lineKey);
  const crumbs = [{ name: 'Home', path: '/' }, { name: line.label, path: line.path }];
  return (
    <div className="page">
      <Seo title={line.seo.title} description={line.seo.description} path={line.path}
        jsonLd={[webPageLd(line.seo.title, line.seo.description, line.path), breadcrumbLd(crumbs), line.faqs.length ? faqLd(line.faqs) : null]} />
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/">Home</Link> › <b aria-current="page">{line.label}</b></nav>

      <header className="ll-hero">
        <div>
          <span className="ll-badge"><Clock size={14} /> Launching soon</span>
          <h1>{line.tagline}</h1>
          <p className="lead">{line.summary}</p>
          {wanted && <div className="ll-search-echo">You searched for <b>“{wanted}”</b>{where ? <> near <b>{where}</b></> : null}. {line.label} isn't live yet — tell us you're interested and we'll let you know as soon as it is.</div>}
          <div className="ll-actions">
            <a className="button button-primary" href={partnerMailto(`Notify me when ${line.label} launches`)}>Notify me at launch <ArrowRight size={16} /></a>
            <Link className="button button-secondary" to="/explore">Browse spaces now</Link>
          </div>
        </div>
        <aside className={`ll-panel ll-panel-${lineKey}`} aria-label={`Examples of ${line.label.toLowerCase()} on Lotnis`}>
          <h2><Icon size={18} style={{ verticalAlign: '-3px' }} /> Things you'll be able to do</h2>
          <ul className="ll-ex">{line.examples.map((e) => <li key={e}><Icon size={18} /> {e}</li>)}</ul>
        </aside>
      </header>

      <section className="ll-section" aria-labelledby="ll-cats">
        <h2 id="ll-cats">{line.categoriesTitle}</h2>
        <p>{lineKey === 'services' ? 'If a person can do it for someone else, it belongs here.' : lineKey === 'food' ? 'From a quick lunch to catering for the whole family.' : 'Big or small, public or private.'}</p>
        <ul className="ll-cats">{line.categories.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>

      <section className="ll-section" aria-labelledby="ll-how">
        <h2 id="ll-how">How it will work</h2>
        <ol className="ll-steps">{line.steps.map(([title, text], i) => <li key={title}><b>{i + 1}</b><strong>{title}</strong><span>{text}</span></li>)}</ol>
      </section>

      <section className="ll-section ll-provider" aria-labelledby="ll-provider">
        <div><h2 id="ll-provider">{line.providerTitle}</h2><p>{line.providerText} One verified Lotnis account covers every line, and payouts go to mobile money or your bank.</p></div>
        <a className="button" href={partnerMailto(line.providerMail ?? line.providerTitle)}>{line.providerCta} <ArrowRight size={16} /></a>
      </section>

      {line.faqs.length > 0 && <section className="ll-section ll-faq" aria-labelledby="ll-faq"><h2 id="ll-faq">Questions</h2>
        {line.faqs.map((f) => <details key={f.question}><summary>{f.question}</summary><p>{f.answer}</p></details>)}</section>}

      <section className="ll-section" aria-label="More from Lotnis"><h2 style={{ fontSize: '1.1rem' }}>More from Lotnis</h2>
        <div className="ll-others">{others.map((l) => <Link key={l.key} to={l.path}>{l.label}{l.status === 'soon' ? ' · soon' : ' · live'}</Link>)}</div></section>
    </div>
  );
}
