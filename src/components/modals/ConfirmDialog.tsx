import { ReactNode, useState } from 'react';
import { Modal } from './Modal';

/** "Are you sure?" — replaces window.confirm. `onConfirm` may throw; the message shows in the dialog. */
export function ConfirmDialog({
  title,
  body,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<unknown> | unknown;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const go = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setBusy(false);
    }
  };
  return (
    <Modal title={title} onClose={onClose}>
      <p className="dialog-intro">{body}</p>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      <div className="form-actions">
        <button type="button" className="button button-quiet" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={`button ${danger ? 'button-danger' : 'button-primary'}`}
          disabled={busy}
          onClick={go}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
