export function Pager({
  page,
  limit,
  total,
  onPage,
}: {
  page: number;
  limit: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return <p className="muted-inline">{total} total</p>;
  return (
    <div className="pager">
      <button className="chip" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        ← Prev
      </button>
      <span className="muted-inline">
        Page {page} of {pages} · {total} total
      </span>
      <button className="chip" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next →
      </button>
    </div>
  );
}
