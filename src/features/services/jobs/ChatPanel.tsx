import { Send, ShieldAlert } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { marketApi, type ChatMessage } from '@/lib/api/market';

/** In-app messages for one job. Phone numbers, e-mails and links are hidden so both sides stay protected. */
export function ChatPanel({ jobId, enabled }: { jobId: string; enabled: boolean }) {
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      marketApi
        .messages(jobId)
        .then((m) => live && setItems(m))
        .catch(() => {});
    load();
    const t = window.setInterval(load, 12_000);
    return () => {
      live = false;
      window.clearInterval(t);
    };
  }, [jobId]);
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' });
  }, [items.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const m = await marketApi.send(jobId, text.trim());
      setItems((x) => [...x, m]);
      setText('');
      setNotice(m.notice ?? '');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not send');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="job-chat" aria-label="Messages">
      <h2>Messages</h2>
      <div className="job-chat-list">
        {items.length === 0 && <p className="muted-inline">No messages yet. Ask anything about the job here.</p>}
        {items.map((m) => (
          <div key={m.id} className={`job-msg ${m.mine ? 'mine' : ''}`}>
            <p>{m.body}</p>
            <small>{new Date(m.created_at).toLocaleTimeString('en-GH', { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        ))}
        <div ref={end} />
      </div>
      {notice && (
        <p className="job-chat-note">
          <ShieldAlert size={14} /> {notice}
        </p>
      )}
      {enabled ? (
        <form onSubmit={send} className="job-chat-form">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a message…"
            maxLength={2000}
            aria-label="Message"
          />
          <button className="button button-primary" disabled={busy || !text.trim()} aria-label="Send">
            <Send size={16} />
          </button>
        </form>
      ) : (
        <p className="muted-inline">This conversation is closed.</p>
      )}
    </section>
  );
}
