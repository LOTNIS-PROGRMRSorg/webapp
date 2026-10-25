import { ReactNode } from 'react';
import { FileText } from 'lucide-react';

export const UPDATED = '24 October 2026';

export type Section = { id: string; title: string; body: ReactNode };
export type Doc = {
  path: string;
  label: string;
  title: string;
  icon: typeof FileText;
  intro: string;
  keyPoints: string[];
  sections: Section[];
};

export const P = ({ children }: { children: ReactNode }) => <p>{children}</p>;
export const L = ({ items }: { items: ReactNode[] }) => (
  <ul>
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
);
