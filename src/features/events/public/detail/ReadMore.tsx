import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/** Long copy shows its first reasonable stretch, cut at a word, with a chevron to open the rest. */
export function ReadMore({ text, limit = 320 }: { text: string; limit?: number }) {
  const [open, setOpen] = useState(false);
  const long = text.length > limit + 60;
  const cut = long ? text.slice(0, limit).replace(/\s+\S*$/, '') : text;
  return (
    <div className="evd-readmore">
      <p className="evd-desc">
        {open || !long ? text : `${cut}…`}
      </p>
      {long && (
        <button type="button" className="evd-more" aria-expanded={open} onClick={() => setOpen(!open)}>
          {open ? 'Show less' : 'Read more'}
          <ChevronDown size={16} className={open ? 'is-up' : ''} />
        </button>
      )}
    </div>
  );
}
