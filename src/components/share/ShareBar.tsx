import { Check, Copy, Share2 } from 'lucide-react';
import { useState } from 'react';

/** Copy link / WhatsApp / native share — for event pages, categories, contestants and listings. */
export function ShareBar({
  url,
  text,
  title,
  compact,
}: {
  url: string;
  text: string;
  title: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const t = document.createElement('textarea');
      t.value = url;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };
  const native = typeof navigator !== 'undefined' && 'share' in navigator;
  return (
    <div className={`sharebar ${compact ? 'sharebar-compact' : ''}`}>
      <button type="button" className="button button-secondary" onClick={copy}>
        {copied ? (
          <>
            <Check size={15} /> Copied
          </>
        ) : (
          <>
            <Copy size={15} /> Copy link
          </>
        )}
      </button>
      <a
        className="button button-quiet"
        target="_blank"
        rel="noreferrer"
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
      >
        WhatsApp
      </a>
      {native && (
        <button
          type="button"
          className="button button-quiet"
          onClick={() => navigator.share({ title, text, url }).catch(() => {})}
        >
          <Share2 size={15} /> Share
        </button>
      )}
    </div>
  );
}
