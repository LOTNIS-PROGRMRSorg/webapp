import { useEffect, useState } from 'react';

/** A scannable QR code for any string (loaded on demand so it doesn't weigh down other pages). */
export function QrImage({ value, size = 220, label }: { value: string; size?: number; label?: string }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let live = true;
    import('qrcode').then((m) => m.toDataURL(value, { width: size * 2, margin: 1, errorCorrectionLevel: 'M' })).then((url) => live && setSrc(url)).catch(() => {});
    return () => { live = false; };
  }, [value, size]);
  return src ? <img className="qr" src={src} width={size} height={size} alt={label || 'QR code'} /> : <div className="qr qr-empty" style={{ width: size, height: size }} />;
}
