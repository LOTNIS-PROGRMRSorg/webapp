import { lazy } from 'react';

// Private and rarely-visited areas are split out of the main bundle so public pages (the ones
// search engines and first-time visitors hit) stay light and fast.
export const lazyNamed = <M extends object>(loader: () => Promise<M>, name: keyof M) =>
  lazy(() => loader().then((m) => ({ default: m[name] as unknown as React.ComponentType<any> })));
