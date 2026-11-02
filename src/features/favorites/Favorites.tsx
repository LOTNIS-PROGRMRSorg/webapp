import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Check, Heart, Share2 } from 'lucide-react';
import { getSession } from '@/lib/api';
import { favoritesApi, type FavoriteType } from '@/lib/api/favorites';
import { useAuthModal } from '@/features/auth/AuthModal';

type Value = {
  has: (type: FavoriteType, id: string) => boolean;
  toggle: (type: FavoriteType, id: string) => void;
};
const FavoritesContext = createContext<Value>({ has: () => false, toggle: () => undefined });
const key = (type: FavoriteType, id: string) => `${type}:${id}`;

/** Loads the signed-in person's saved ids once, so every card can paint its heart without its own request. */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { openSignIn } = useAuthModal();
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const signedIn = !!getSession();

  useEffect(() => {
    if (!signedIn) {
      setSaved(new Set());
      return;
    }
    favoritesApi
      .ids()
      .then((r) =>
        setSaved(new Set([...r.event.map((id) => key('event', id)), ...r.property.map((id) => key('property', id))])),
      )
      .catch(() => {});
  }, [signedIn]);

  const savedRef = useRef(saved);
  savedRef.current = saved;
  const toggle = useCallback(
    (type: FavoriteType, id: string) => {
      if (!getSession()) return openSignIn(`${window.location.pathname}${window.location.search}`);
      const k = key(type, id);
      const adding = !savedRef.current.has(k);
      const apply = (on: boolean) =>
        setSaved((prev) => {
          const next = new Set(prev);
          if (on) next.add(k);
          else next.delete(k);
          return next;
        });
      apply(adding); // instant; undone below if the server refuses
      (adding ? favoritesApi.add(type, id) : favoritesApi.remove(type, id)).catch(() => apply(!adding));
    },
    [openSignIn],
  );
  const value = useMemo(
    () => ({ has: (type: FavoriteType, id: string) => saved.has(key(type, id)), toggle }),
    [saved, toggle],
  );
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);

/** Heart that saves/unsaves an event or space. Safe to place on top of a card link. */
export function FavoriteButton({ type, id, label }: { type: FavoriteType; id: string; label: string }) {
  const { has, toggle } = useFavorites();
  const on = has(type, id);
  return (
    <button
      type="button"
      className={`fav-btn${on ? ' is-on' : ''}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${label} from favourites` : `Save ${label} to favourites`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(type, id);
      }}
    >
      <Heart size={18} aria-hidden="true" />
    </button>
  );
}

/** Share icon: the phone's share sheet where there is one, otherwise copies the link. */
export function ShareIconButton({ url, title, text }: { url: string; title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator.share === 'function') {
      // The text already ends with the link; sending `url` too would repeat it in some apps.
      navigator.share({ title, text }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Copy this link', url);
    }
  };
  return (
    <button type="button" className="fav-btn" aria-label={copied ? 'Link copied' : `Share ${title}`} onClick={onClick}>
      {copied ? <Check size={18} aria-hidden="true" /> : <Share2 size={18} aria-hidden="true" />}
    </button>
  );
}
