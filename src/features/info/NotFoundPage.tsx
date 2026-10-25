import { Link } from 'react-router-dom';
import { Seo } from '@/lib/seo/seo';

export function NotFoundPage() {
  return <section className="page nf"><Seo title="Page not found" description="We couldn't find that page." noindex follow />
    <span className="eyebrow">Error 404</span><h1>We couldn't find that page.</h1>
    <p className="lead">It may have moved, or the link might be wrong. Try one of these:</p>
    <div className="bk-actions"><Link className="button button-primary" to="/explore">Browse spaces</Link><Link className="button button-quiet" to="/">Go home</Link></div></section>;
}
