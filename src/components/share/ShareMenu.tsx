import { Check, Copy, Mail, MessageCircle, Send, Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './share.css';

type Target = {
  label: string;
  href: (url: string, text: string, title: string) => string;
  icon: React.ComponentType<{ size?: number }>;
};

const TARGETS: Target[] = [
  {
    label: 'WhatsApp',
    icon: MessageCircle,
    href: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    label: 'Facebook',
    icon: FacebookIcon,
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: 'X',
    icon: XIcon,
    href: (url, text) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: 'Telegram',
    icon: Send,
    href: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    label: 'Email',
    icon: Mail,
    href: (url, text, title) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
  },
];

// Brand marks drawn as simple single-colour glyphs, sized and coloured like the lucide icons around them.
function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.6-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H8v3h2.5V21h3Z" />
    </svg>
  );
}
function XIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.8 3h3l-6.6 7.6L22 21h-6.1l-4.8-6.2L5.6 21h-3l7.1-8.1L2.2 3h6.2l4.3 5.7L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" />
    </svg>
  );
}

/**
 * A share button. On phones it opens the phone's own share sheet (every app the person has installed);
 * elsewhere a small menu of the common apps plus Copy link.
 */
export function ShareMenu({
  url,
  title,
  text,
  className,
  label,
  heading = 'Share this space',
  onShare,
}: {
  url: string;
  title: string;
  text: string;
  className?: string;
  /** Show a text label beside the icon (a pill button) instead of the icon-only overlay button. */
  label?: string;
  /** Title of the popup menu. */
  heading?: string;
  /** Called once per share action, e.g. to record it for the host's stats. */
  onShare?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', outside);
    window.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', outside);
      window.removeEventListener('keydown', escape);
    };
  }, [open]);

  const click = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
    if (touch && typeof navigator.share === 'function') {
      navigator
        .share({ title, text, url })
        .then(() => onShare?.())
        .catch(() => {});
      return;
    }
    setOpen((o) => !o);
  };
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
    onShare?.();
    setCopied(true);
    window.setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1200);
  };

  return (
    <div className={`share-menu ${className ?? ''}`} ref={box}>
      <button
        type="button"
        className={`share-menu-btn${label ? ' share-menu-pill' : ''}`}
        aria-label={`Share ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={click}
      >
        <Share2 size={label ? 17 : 19} />
        {label}
      </button>
      {open && (
        <div className="share-menu-pop" role="menu" aria-label="Share">
          <p>{heading}</p>
          {TARGETS.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              role="menuitem"
              href={href(url, text, title)}
              target={label === 'Email' ? undefined : '_blank'}
              rel="noopener noreferrer"
              onClick={() => {
                onShare?.();
                setOpen(false);
              }}
            >
              <span className={`share-ic share-${label.toLowerCase()}`}>
                <Icon size={17} />
              </span>
              {label}
            </a>
          ))}
          <button type="button" role="menuitem" onClick={copy}>
            <span className="share-ic">{copied ? <Check size={17} /> : <Copy size={17} />}</span>
            {copied ? 'Link copied' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  );
}
