import { useEffect } from 'react';
import { Scale } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { breadcrumbLd, faqLd, Seo, webPageLd } from '@/lib/seo/seo';
import { Doc, UPDATED } from './legalShared';
import { TERMS } from './termsDoc';
import { REFUNDS } from './refundsDoc';
import { PRIVACY } from './privacyDoc';
import { HOSTS } from './hostsDoc';
import { TICKETS } from './ticketsDoc';

export const LEGAL_DOCS = [TERMS, TICKETS, REFUNDS, PRIVACY, HOSTS];

export function LegalPage({ doc }: { doc: Doc }) {
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [doc]);
  const Icon = doc.icon;
  return (
    <div className="page legal">
      <Seo
        title={doc.title}
        description={doc.intro}
        path={doc.path}
        jsonLd={[
          webPageLd(doc.title, doc.intro, doc.path),
          breadcrumbLd([
            { name: 'Home', path: '/' },
            { name: doc.title, path: doc.path },
          ]),
          doc.path === '/refund-policy'
            ? faqLd(
                doc.sections.slice(0, 1).map(() => ({
                  question: 'What do I get back if I cancel a Lotnis booking?',
                  answer: doc.keyPoints.join(' '),
                })),
              )
            : null,
        ]}
      />
      <nav className="legal-tabs" aria-label="Legal documents">
        {LEGAL_DOCS.map((d) => (
          <NavLink key={d.path} to={d.path} className={({ isActive }) => `legal-tab ${isActive ? 'legal-tab-on' : ''}`}>
            <d.icon size={15} /> {d.label}
          </NavLink>
        ))}
      </nav>
      <header className="legal-head">
        <span className="legal-badge">
          <Icon size={18} />
        </span>
        <div>
          <h1>{doc.title}</h1>
          <p className="lead">{doc.intro}</p>
          <small>Last updated {UPDATED}</small>
        </div>
      </header>
      <div className="legal-grid">
        <aside className="legal-toc" aria-label="On this page">
          <b>On this page</b>
          {doc.sections.map((s) => (
            <a key={s.id} href={`#${s.id}`}>
              {s.title}
            </a>
          ))}
        </aside>
        <article className="legal-body">
          <div className="legal-summary">
            <b>
              <Scale size={16} /> The short version
            </b>
            <ul>
              {doc.keyPoints.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
          {doc.sections.map((s) => (
            <section key={s.id} id={s.id}>
              <h2>{s.title}</h2>
              {s.body}
            </section>
          ))}
        </article>
        <aside className="legal-rail">
          <div className="rail-card">
            <b>Questions?</b>
            <p>Our team is happy to explain how any of this applies to your booking.</p>
            <a className="button button-primary button-wide" href="mailto:support@lotnis.com">
              Email support
            </a>
          </div>
          <div className="rail-card">
            <b>Related</b>
            {LEGAL_DOCS.filter((d) => d.path !== doc.path).map((d) => (
              <Link key={d.path} to={d.path}>
                <d.icon size={15} /> {d.label}
              </Link>
            ))}
          </div>
          <div className="rail-card rail-note">
            <b>In plain words</b>
            <p>
              Everything on this page applies to the booking you make today. If we change anything later, your existing
              bookings keep the prices and refund terms you agreed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export const TermsPage = () => <LegalPage doc={TERMS} />;
export const RefundPolicyPage = () => <LegalPage doc={REFUNDS} />;
export const TicketTermsPage = () => <LegalPage doc={TICKETS} />;
export const PrivacyPage = () => <LegalPage doc={PRIVACY} />;
export const HostAgreementPage = () => <LegalPage doc={HOSTS} />;
