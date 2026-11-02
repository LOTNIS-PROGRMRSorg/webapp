import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Heart } from 'lucide-react';
import { getSession } from '@/lib/api';
import { favoritesApi, type FavoriteType } from '@/lib/api/favorites';
import { useAuthModal } from '@/features/auth/AuthModal';

type Value = {
  has: (type: FavoriteType, id: string) => boolean;
  toggle: (type: FavoriteType, id: string) => void;
  /** Saved ids of one type, newest first. */
  ids: (type: FavoriteType) => string[];
  loaded: boolean;
};
const FavoritesContext = createContext<Value>({
  has: () => false,
  toggle: () => undefined,
  ids: () => [],
  loaded: false,
});
const key = (type: FavoriteType, id: string) => `${type}:${id}`;

/** Loads the signed-in person's saved ids once, so every card can paint its heart without its own request. */
export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { openSignIn } = useAuthModal();
  const [saved, setSaved] = useState<string[]>([]); // `type:id`, newest first
  const [loaded, setLoaded] = useState(false);
  const signedIn = !!getSession();

  useEffect(() => {
    if (!signedIn) {
      setSaved([]);
      setLoaded(true);
      return;
    }
    favoritesApi
      .ids()
      .then((r) => setSaved([...r.event.map((id) => key('event', id)), ...r.property.map((id) => key('property', id))]))
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [signedIn]);

  const savedRef = useRef(saved);
  savedRef.current = saved;
  const toggle = useCallback(
    (type: FavoriteType, id: string) => {
      if (!getSession()) return openSignIn(`${window.location.pathname}${window.location.search}`);
      const k = key(type, id);
      const adding = !savedRef.current.includes(k);
      const apply = (on: boolean) =>
        setSaved((prev) => (on ? [k, ...prev.filter((x) => x !== k)] : prev.filter((x) => x !== k)));
      apply(adding); // instant; undone below if the server refuses
      (adding ? favoritesApi.add(type, id) : favoritesApi.remove(type, id)).catch(() => apply(!adding));
    },
    [openSignIn],
  );
  const value = useMemo<Value>(
    () => ({
      has: (type, id) => saved.includes(key(type, id)),
      toggle,
      ids: (type) => saved.filter((k) => k.startsWith(`${type}:`)).map((k) => k.slice(type.length + 1)),
      loaded,
    }),
    [saved, toggle, loaded],
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
