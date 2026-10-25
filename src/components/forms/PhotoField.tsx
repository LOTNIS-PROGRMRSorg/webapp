import { useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { uploadImage } from '@/lib/api/uploads';

/** A labelled picture upload with preview. Value is the uploaded image's URL ('' when empty). */
export function PhotoField({ label, value, onChange, required, round, hint }: { label: string; value: string; onChange: (url: string) => void; required?: boolean; round?: boolean; hint?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pick = async (file?: File) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('That picture is over 10 MB — choose a smaller one.'); return; }
    setBusy(true); setError('');
    try { onChange(await uploadImage(file)); } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); } finally { setBusy(false); }
  };
  return (
    <div className="fld">
      <span>{label}{required && <small> required</small>}</span>
      <div className="photofield">
        {value ? <div className={`photo-preview ${round ? 'photo-round' : ''}`}><img src={value} alt="" /><button type="button" className="icon-btn" onClick={() => onChange('')} aria-label="Remove picture"><Trash2 size={15} /></button></div>
          : <label className={`drop ${round ? 'drop-round' : ''}`}><ImagePlus size={22} /><span>{busy ? 'Uploading…' : 'Choose a picture'}</span><input hidden type="file" accept="image/jpeg,image/png,image/heic,image/heif" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} /></label>}
        <div className="photo-hint">{hint || 'A clear photo works best.'}{error && <b className="photo-err"> {error}</b>}</div>
      </div>
    </div>
  );
}
