import { useRef, useState } from 'react';
import { ImagePlus, Star, X } from 'lucide-react';
import { api } from './api';

/** Uploads straight to storage as files are chosen; the first picture is the cover. */
export function PhotoPicker({ propertyId, roomId, urls, onChange, max = 12, label = 'Add photos', cover = true }: {
  propertyId: string; roomId?: string; urls: string[]; onChange: (urls: string[]) => void; max?: number; label?: string; cover?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState('');

  const add = async (files: FileList | null) => {
    if (!files) return;
    const room = Math.max(0, max - urls.length);
    const chosen = Array.from(files).slice(0, room);
    if (files.length > room) setError(`You can add up to ${max} photos here.`); else setError('');
    setBusy((n) => n + chosen.length);
    const added: string[] = [];
    for (const file of chosen) {
      try { added.push((await api.uploadPropertyPhoto(propertyId, file, roomId)).publicUrl); }
      catch (e) { setError(e instanceof Error ? e.message : 'A photo failed to upload'); }
      finally { setBusy((n) => n - 1); }
    }
    if (added.length) onChange([...urls, ...added]);
  };
  const makeCover = (i: number) => onChange([urls[i], ...urls.filter((_, n) => n !== i)]);

  return (
    <div className="pp">
      <div className="pp-grid">
        {urls.map((url, i) => (
          <div className="pp-tile" key={url}>
            <img src={url} alt={`Photo ${i + 1}`} />
            {cover && i === 0 && <span className="pp-cover">Cover</span>}
            <div className="pp-tools">
              {cover && i > 0 && <button type="button" onClick={() => makeCover(i)} aria-label="Make cover photo" title="Make cover"><Star size={14} /></button>}
              <button type="button" onClick={() => onChange(urls.filter((_, n) => n !== i))} aria-label="Remove photo" title="Remove"><X size={14} /></button>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => <div className="pp-tile pp-loading" key={`l${i}`}><span /></div>)}
        {urls.length + busy < max && (
          <button type="button" className="pp-add" onClick={() => input.current?.click()}><ImagePlus size={22} /><span>{label}</span><small>{urls.length}/{max}</small></button>
        )}
      </div>
      <input ref={input} hidden type="file" accept="image/jpeg,image/png,image/heic" multiple onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      {error && <div className="form-error" role="alert">{error}</div>}
    </div>
  );
}
