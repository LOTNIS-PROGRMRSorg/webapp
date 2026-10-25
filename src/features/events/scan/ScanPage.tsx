import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, Keyboard, Lock, ScanLine } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { eventApi, ScanResult } from '@/lib/api/events';
import { fmtDateTime, fmtTime } from '@/features/events/eventUi';
import { Seo } from '@/lib/seo/seo';

// ─────────────────────────────────────────────────────────────────────────────
// Gate scanner. Opened from a private link the organiser sends — no account. The page shows the
// gate's name and a camera scanner; every scan is checked on the server in one atomic step.
// ─────────────────────────────────────────────────────────────────────────────

type Open = Awaited<ReturnType<typeof eventApi.scanOpen>>;
type Entry = { at: number; code: string; result: ScanResult };
const COPY: Record<ScanResult['result'], { title: string; tone: 'ok' | 'warn' | 'bad'; hint: string }> = {
  valid: { title: 'VALID', tone: 'ok', hint: 'Let them in' },
  already_used: { title: 'ALREADY USED', tone: 'bad', hint: 'This ticket was already scanned' },
  not_found: { title: 'NOT FOUND', tone: 'bad', hint: 'No ticket with this code' },
  refunded: { title: 'REFUNDED', tone: 'bad', hint: 'This ticket was refunded' },
  refund_pending: { title: 'REFUND PENDING', tone: 'warn', hint: 'A refund is being reviewed — do not admit' },
  cancelled: { title: 'CANCELLED', tone: 'bad', hint: 'This ticket is no longer valid' },
  wrong_event: { title: 'WRONG EVENT', tone: 'bad', hint: 'This ticket is for a different event' },
  outside_window: { title: 'NOT OPEN YET', tone: 'warn', hint: 'Scanning is outside the event window' },
  event_cancelled: { title: 'EVENT CANCELLED', tone: 'bad', hint: 'This event was cancelled' },
};

function beep(ok: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.12 : 0.35));
    window.setTimeout(() => ctx.close(), 500);
  } catch {
    /* audio is a nicety */
  }
  try {
    navigator.vibrate?.(ok ? 60 : [120, 60, 120]);
  } catch {
    /* ignore */
  }
}

export function ScanPage() {
  const { token = '' } = useParams();
  const pinKey = `lotnis_gate_pin:${token.slice(0, 12)}`;
  const [pin, setPin] = useState(() => {
    try {
      return sessionStorage.getItem(pinKey) || '';
    } catch {
      return '';
    }
  });
  const [info, setInfo] = useState<Open | null>(null);
  const [needPin, setNeedPin] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const open = useCallback(
    async (p?: string) => {
      setBusy(true);
      setError('');
      try {
        const r = await eventApi.scanOpen(token, p || undefined);
        setInfo(r);
        setNeedPin(false);
        try {
          if (p) sessionStorage.setItem(pinKey, p);
        } catch {
          /* ignore */
        }
      } catch (e: any) {
        if (e?.code === 'PIN_REQUIRED' || e?.code === 'PIN_WRONG') {
          setNeedPin(true);
          setError(e.code === 'PIN_WRONG' ? e.message : '');
          try {
            sessionStorage.removeItem(pinKey);
          } catch {
            /* ignore */
          }
        } else setError(e?.message || 'Unable to open the scanner');
      } finally {
        setBusy(false);
      }
    },
    [token, pinKey],
  );
  useEffect(() => {
    open(pin); /* first load only */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!info) {
    return (
      <div className="scan scan-gate">
        <Seo title="Gate scanner" description="Ticket scanner" noindex />
        <div className="scan-card">
          <ScanLine size={34} />
          <h1>Gate scanner</h1>
          {needPin ? (
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                open(pin.trim());
              }}
            >
              <p>Enter the PIN the organiser gave you.</p>
              <label className="scan-field">
                <Lock size={16} />
                <input
                  autoFocus
                  inputMode="text"
                  autoComplete="off"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN"
                />
              </label>
              {error && <div className="scan-error">{error}</div>}
              <button className="scan-btn" disabled={busy || !pin.trim()}>
                {busy ? 'Checking…' : 'Open scanner'}
              </button>
            </form>
          ) : error ? (
            <div className="scan-error">{error}</div>
          ) : (
            <p>Opening…</p>
          )}
        </div>
      </div>
    );
  }
  return <Scanner token={token} pin={pin || undefined} info={info} />;
}

function Scanner({ token, pin, info }: { token: string; pin?: string; info: Open }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lockRef = useRef(false);
  const lastRef = useRef({ code: '', at: 0 });
  const [camera, setCamera] = useState<'starting' | 'on' | 'off'>('starting');
  const [cameraError, setCameraError] = useState('');
  const [current, setCurrent] = useState<{ code: string; result: ScanResult } | null>(null);
  const [log, setLog] = useState<Entry[]>([]);
  const [admitted, setAdmitted] = useState(info.stats.admitted_total);
  const [here, setHere] = useState(info.stats.admitted_here);
  const [manual, setManual] = useState(false);
  const [code, setCode] = useState('');
  const [netError, setNetError] = useState('');

  const submit = useCallback(
    async (raw: string) => {
      const value = raw.trim().replace(/^.*\/tickets\//, ''); // accept a pasted ticket link too
      if (!value || lockRef.current) return;
      lockRef.current = true;
      setNetError('');
      try {
        const result = await eventApi.scanCheck(token, pin, value);
        const ok = result.result === 'valid';
        beep(ok);
        setCurrent({ code: value, result });
        setLog((l) => [{ at: Date.now(), code: value, result }, ...l].slice(0, 30));
        if (result.admitted_total != null) setAdmitted(result.admitted_total);
        if (ok) setHere((n) => n + 1);
        window.setTimeout(
          () => {
            setCurrent(null);
            lockRef.current = false;
          },
          ok ? 1600 : 2600,
        );
      } catch (e: any) {
        setNetError(e?.message || 'Could not reach the server — check your connection and scan again.');
        beep(false);
        lockRef.current = false;
      }
    },
    [token, pin],
  );

  // camera + decode loop
  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    let tick = 0;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
          audio: false,
        });
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        setCamera('on');
        const Detector = (window as any).BarcodeDetector;
        const detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
        const jsQR = detector ? null : (await import('jsqr')).default;
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        const loop = async () => {
          if (stopped) return;
          raf = requestAnimationFrame(loop);
          if (++tick % 4 !== 0 || lockRef.current || video.readyState < 2) return;
          let found = '';
          try {
            if (detector) {
              const codes = await detector.detect(video);
              found = codes[0]?.rawValue || '';
            } else if (jsQR) {
              const w = 480,
                h = Math.round((video.videoHeight / video.videoWidth) * w) || 360;
              canvas.width = w;
              canvas.height = h;
              ctx.drawImage(video, 0, 0, w, h);
              found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' })?.data || '';
            }
          } catch {
            /* frame decode errors are normal */
          }
          if (found && !(found === lastRef.current.code && Date.now() - lastRef.current.at < 3000)) {
            lastRef.current = { code: found, at: Date.now() };
            submit(found);
          }
        };
        loop();
      } catch (e: any) {
        setCamera('off');
        setCameraError(
          e?.name === 'NotAllowedError'
            ? 'Camera access was blocked. Allow the camera for this site, or type codes in by hand.'
            : 'No camera found. Type codes in by hand.',
        );
        setManual(true);
      }
    })();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [submit]);

  const tone = current ? COPY[current.result.result].tone : null;
  return (
    <div className={`scan ${tone ? `scan-${tone}` : ''}`}>
      <Seo title={`${info.gate.name} — scanner`} description="Ticket scanner" noindex />
      <header className="scan-head">
        <div>
          <small>{info.event.title}</small>
          <h1>{info.gate.name}</h1>
        </div>
        <div className="scan-counts">
          <b>{admitted}</b>
          <span>in total</span>
          <i>{here} here</i>
        </div>
      </header>
      <div className="scan-view">
        <video ref={videoRef} muted playsInline />
        <canvas ref={canvasRef} hidden />
        {camera === 'on' && !current && <div className="scan-frame" aria-hidden="true" />}
        {camera === 'starting' && (
          <div className="scan-msg">
            <Camera size={28} /> Starting camera…
          </div>
        )}
        {camera === 'off' && (
          <div className="scan-msg">
            <CameraOff size={28} /> {cameraError}
          </div>
        )}
        {current && (
          <div
            className={`scan-result scan-result-${COPY[current.result.result].tone}`}
            role="status"
            aria-live="assertive"
          >
            <h2>{COPY[current.result.result].title}</h2>
            <p>{COPY[current.result.result].hint}</p>
            {current.result.ticket_type && <b>{current.result.ticket_type}</b>}
            {current.result.holder_name && <span>{current.result.holder_name}</span>}
            {current.result.result === 'already_used' && (
              <span>
                Scanned {current.result.used_at ? fmtTime(current.result.used_at) : ''}
                {current.result.used_gate ? ` at ${current.result.used_gate}` : ''}
              </span>
            )}
            {current.result.result === 'outside_window' && current.result.starts_at && (
              <span>Opens {fmtDateTime(current.result.starts_at)}</span>
            )}
          </div>
        )}
      </div>
      {netError && (
        <div className="scan-error" role="alert">
          {netError}
        </div>
      )}
      <div className="scan-tools">
        <button className="scan-btn scan-btn-ghost" onClick={() => setManual(!manual)}>
          <Keyboard size={16} /> {manual ? 'Hide' : 'Enter code'}
        </button>
      </div>
      {manual && (
        <form
          className="scan-manual"
          onSubmit={(e) => {
            e.preventDefault();
            const c = code;
            setCode('');
            submit(c);
          }}
        >
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ticket code"
            autoCapitalize="characters"
            autoComplete="off"
          />
          <button className="scan-btn" disabled={!code.trim()}>
            Check
          </button>
        </form>
      )}
      <section className="scan-log">
        <h3>Recent</h3>
        {log.length ? (
          log.map((l) => (
            <div key={l.at + l.code} className={`scan-row scan-row-${COPY[l.result.result].tone}`}>
              <b>{COPY[l.result.result].title}</b>
              <span>{l.result.ticket_type || l.code}</span>
              <small>
                {new Date(l.at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </small>
            </div>
          ))
        ) : (
          <p>Scans will appear here.</p>
        )}
      </section>
    </div>
  );
}
