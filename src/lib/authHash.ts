// Google sign-in returns tokens in the URL hash. If Supabase fell back to the site root (the redirect URL
// wasn't on its allow-list), forward them to the callback page that can use them.
export function forwardAuthHash(): boolean {
  const { pathname, hash } = window.location;
  if (!hash.includes('access_token=') || pathname === '/auth/callback') return false;
  window.location.replace(`/auth/callback${hash}`);
  return true;
}
