import type { EngagementDay } from '@/lib/api/engagement';

/** Views (solid) and clicks (outlined) per day. Plain bars so it reads at a glance and works without a chart library. */
export function EngagementChart({ days }: { days: EngagementDay[] }) {
  if (!days.length) return <p className="muted-inline">No visits recorded in this period yet.</p>;
  const max = Math.max(1, ...days.map((d) => d.views));
  return (
    <div className="eng-chart" role="img" aria-label={`Views per day, highest ${max}`}>
      {days.map((d) => (
        <div
          key={d.day}
          className="eng-col"
          title={`${new Date(d.day).toLocaleDateString('en-GH', { day: 'numeric', month: 'short' })}: ${d.views} views, ${d.clicks} clicks`}
        >
          <span className="eng-bar" style={{ height: `${Math.max(3, (d.views / max) * 100)}%` }}>
            <span
              className="eng-click"
              style={{ height: `${d.views ? Math.min(100, (d.clicks / d.views) * 100) : 0}%` }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

/** views → clicks → bookings, with the share that carried on to the next step. */
export function Funnel({ steps }: { steps: Array<{ label: string; value: number }> }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="funnel">
      {steps.map((s, i) => (
        <li key={s.label}>
          <div className="funnel-bar" style={{ width: `${Math.max(4, (s.value / top) * 100)}%` }} />
          <span>{s.label}</span>
          <b>{s.value.toLocaleString()}</b>
          {i > 0 && steps[i - 1].value > 0 && (
            <small>{Math.round((s.value / steps[i - 1].value) * 100)}% of the step before</small>
          )}
        </li>
      ))}
    </ol>
  );
}
