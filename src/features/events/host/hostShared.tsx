export const errText = (e: unknown, fallback = 'Something went wrong') => (e instanceof Error ? e.message : fallback);
export const PageHeader = ({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) => (
  <div className="page-header">
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
    </div>
    {children}
  </div>
);
export const copy = (text: string) => navigator.clipboard?.writeText(text).catch(() => {});
