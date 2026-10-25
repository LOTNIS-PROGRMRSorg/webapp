import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, periodLabel, primaryImage } from '@/lib/format';
import type { Property } from '@/types';
import { IMAGES } from './homeShared';

export function Hero({ heroStay }: { heroStay?: Property }) {
  return (
    <section className="lp-hero">
      <picture className="lp-hero-media">
        <source media="(max-width: 640px)" srcSet={`${IMAGES}/hero-terracotta-hallway-portrait.webp`} />
        <img src={`${IMAGES}/hero-terracotta-hallway.webp`} alt="" fetchPriority="high" />
      </picture>
      <div className="lp-container lp-hero-content">
        <h1>Everything you need, from people you can trust.</h1>
        <p>
          Rent a space, buy tickets to an event, and soon order food or book a plumber, a photographer or a tour guide —
          one account, one way to pay, verified providers across Ghana.
        </p>
      </div>
      {heroStay && (
        <Link className="lp-hero-stay" to={`/stays/${heroStay.id}`}>
          <img src={primaryImage(heroStay)} alt="" />
          <span>
            <strong>{heroStay.name}</strong>
            <small>
              Featured space{heroStay.city ? ` · ${heroStay.city}` : ''}
              {heroStay.price != null
                ? ` · from ${formatPrice(heroStay.currency, heroStay.price)} a ${periodLabel(heroStay.pricing_period)}`
                : ''}
            </small>
          </span>
          <ArrowRight size={16} />
        </Link>
      )}
    </section>
  );
}
