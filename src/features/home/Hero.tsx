import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice, periodLabel, primaryImage } from '@/lib/format';
import type { Property } from '@/types';
import { IMAGES } from './homeShared';

const HERO_IMAGES = [
  {
    desktop: `${IMAGES}/hero-terracotta-hallway.webp`,
    mobile: `${IMAGES}/hero-terracotta-hallway-portrait.webp`,
    label: 'Warm terracotta hallway',
  },
  {
    desktop: `${IMAGES}/hero-carousel/hero-coast.webp`,
    mobile: `${IMAGES}/hero-carousel/hero-coast-portrait.webp`,
    label: 'Coastal guesthouse terrace',
  },
  {
    desktop: `${IMAGES}/hero-carousel/hero-market.webp`,
    mobile: `${IMAGES}/hero-carousel/hero-market-portrait.webp`,
    label: 'Accra evening market',
  },
];

export function Hero({ heroStay }: { heroStay?: Property }) {
  const [activeImage, setActiveImage] = useState(0);
  const [paused, setPaused] = useState(false);
  const image = HERO_IMAGES[activeImage];

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % HERO_IMAGES.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section
      className="lp-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <picture className="lp-hero-media">
        <source media="(max-width: 640px)" srcSet={image.mobile} />
        <img key={image.desktop} src={image.desktop} alt="" fetchPriority={activeImage === 0 ? 'high' : 'auto'} />
      </picture>
      <div className="lp-container lp-hero-content">
        <h1>Everything you need, from people you can trust.</h1>
        <p>Rent a space, find an event, and discover trusted people across Ghana.</p>
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
      <div className="lp-hero-dots" role="tablist" aria-label="Hero images">
        {HERO_IMAGES.map((heroImage, index) => (
          <button
            key={heroImage.desktop}
            type="button"
            role="tab"
            aria-label={`Show ${heroImage.label}`}
            aria-selected={activeImage === index}
            className={activeImage === index ? 'is-active' : ''}
            onClick={() => setActiveImage(index)}
          />
        ))}
      </div>
    </section>
  );
}
