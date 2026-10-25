import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'quiet' | 'danger';
type Size = 'md' | 'lg';
const cls = (variant: Variant, size: Size, wide?: boolean) =>
  ['button', `button-${variant}`, size === 'lg' && 'button-lg', wide && 'button-wide'].filter(Boolean).join(' ');

export function Button({
  variant = 'primary',
  size = 'md',
  wide,
  loading,
  loadingText,
  icon,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  wide?: boolean;
  loading?: boolean;
  loadingText?: string;
  icon?: ReactNode;
}) {
  return (
    <button {...rest} className={`${cls(variant, size, wide)} ${rest.className ?? ''}`} disabled={disabled || loading}>
      {icon}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  wide,
  children,
  ...rest
}: LinkProps & { variant?: Variant; size?: Size; wide?: boolean }) {
  return (
    <Link {...rest} className={`${cls(variant, size, wide)} ${rest.className ?? ''}`}>
      {children}
    </Link>
  );
}

export function IconButton({ label, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button type="button" {...rest} className={`icon-btn ${rest.className ?? ''}`} aria-label={label} title={label}>
      {children}
    </button>
  );
}
