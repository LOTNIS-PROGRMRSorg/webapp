import { useEffect } from 'react';
import { engagementApi, type EngagementAction } from '@/lib/api/engagement';

/** An anonymous id for this browser tab, so one visitor reloading doesn't look like a crowd. */
const sessionId = () => {
  try {
    let id = sessionStorage.getItem('lotnis_sid');
    if (!id) {
      id = (crypto.randomUUID?.() ?? `${Date.now()}${Math.random().toString(16).slice(2)}`).replace(/-/g, '');
      sessionStorage.setItem('lotnis_sid', id);
    }
    return id;
  } catch {
    return `anon${Math.random().toString(16).slice(2)}`;
  }
};

/** Fire and forget — tracking must never slow down or break a page. */
export const track = (type: 'property' | 'event', id: string | undefined, action: EngagementAction) => {
  if (!id) return;
  engagementApi.track(type, id, action, sessionId()).catch(() => {});
};

/** Count a page view once when the listing/event loads. */
export function useTrackView(type: 'property' | 'event', id: string | undefined) {
  useEffect(() => {
    track(type, id, 'view');
  }, [type, id]);
}
