import { request } from './index';

/** Upload a picture (listing, event, contestant…) and get back its public URL. */
export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  return (await request<{ url: string }>('/events/host/images', { method: 'POST', body: form })).url;
}
