import { Loader2 } from 'lucide-react';
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode, type Ref } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../utils/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'outline' | 'danger' | 'dangerSoft' | 'outlineDanger' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseProps {
  /** Visual style. `icon` renders a square icon-only button and requires `aria-label`. */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** `inverse` adapts the button for dark surfaces (page headers, banners). */
  tone?: 'default' | 'inverse';
  /** Corners. Square-ish by default; `pill` is available where a design explicitly calls for it. */
  shape?: 'default' | 'pill';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  /** Icon-only buttons: solid background (e.g. a send button). */
  filled?: boolean;
  /** Label. For `variant="icon"` pass the icon as `children`. */
  children?: ReactNode;
  className?: string;
}

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseProps> & { to?: undefined };
type LinkButtonProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseProps | 'href'> & { to: string; disabled?: boolean };
type IconRule = { variant: 'icon'; 'aria-label': string } | { variant?: Exclude<ButtonVariant, 'icon'> };

export type ButtonProps = BaseProps & IconRule & (NativeButtonProps | LinkButtonProps);

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[14px] gap-1.5',
  md: 'h-10 px-4 text-[16px] gap-2',
  lg: 'h-12 px-6 text-[17px] gap-2',
};
const iconSizes: Record<ButtonSize, string> = { sm: 'size-8', md: 'size-10', lg: 'size-12' };

const variants: Record<'default' | 'inverse', Record<ButtonVariant, string>> = {
  default: {
    primary: 'bg-deep text-white hover:bg-ink',
    secondary: 'bg-mint text-deep hover:bg-line',
    text: 'text-ink underline-offset-4 hover:bg-mint/70 hover:underline',
    outline: 'border border-ink/30 text-deep hover:border-ink hover:bg-mint/50',
    danger: 'bg-rose-text text-white hover:bg-[#8f1b21]',
    dangerSoft: 'bg-rose-bg text-rose-text hover:bg-[#f3d2d2]',
    outlineDanger: 'border border-line bg-white text-rose-text hover:border-rose-text hover:bg-rose-bg',
    icon: 'text-ink/70 hover:bg-mint hover:text-deep',
  },
  inverse: {
    primary: 'bg-badge text-ink hover:bg-white',
    secondary: 'bg-white/10 text-white hover:bg-white/20',
    text: 'text-white/85 underline-offset-4 hover:text-white hover:underline',
    outline: 'border border-white/40 text-white hover:bg-white/10',
    danger: 'bg-rose-text text-white hover:bg-[#8f1b21]',
    dangerSoft: 'bg-rose-bg text-rose-text hover:bg-white',
    outlineDanger: 'border border-white/40 text-white hover:bg-rose-bg hover:text-rose-text',
    icon: 'text-white/80 hover:bg-white/10 hover:text-white',
  },
};

/**
 * The single LORIS button. Renders a <button>, or a router <Link> when `to` is given.
 * States: hover/focus (CSS), disabled, loading (spinner, non-interactive, aria-busy).
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(function Button(props, ref) {
  const { variant = 'primary', size = 'md', tone = 'default', shape = 'default', loading = false, leftIcon, rightIcon, fullWidth, filled, children, className, ...rest } = props;

  const isIcon = variant === 'icon';
  const disabled = Boolean((rest as { disabled?: boolean }).disabled) || loading;
  const classes = cx(
    'inline-flex shrink-0 items-center justify-center font-semibold leading-none transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
    shape === 'pill' ? 'rounded-full' : 'rounded-[4px]',
    isIcon ? iconSizes[size] : sizes[size],
    isIcon && filled ? (tone === 'inverse' ? 'bg-badge text-ink hover:bg-white' : 'bg-ink text-white hover:bg-deep') : variants[tone][variant],
    fullWidth && 'w-full',
    disabled && 'pointer-events-none opacity-50',
    className,
  );

  const content = (
    <>
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );

  if ('to' in rest && typeof rest.to === 'string') {
    const { to, disabled: _ignored, ...anchor } = rest as LinkButtonProps;
    void _ignored;
    return (
      <Link ref={ref as Ref<HTMLAnchorElement>} to={to} className={classes} aria-disabled={disabled || undefined} aria-busy={loading || undefined} tabIndex={disabled ? -1 : undefined} {...anchor}>
        {content}
      </Link>
    );
  }

  const { to: _to, ...button } = rest as NativeButtonProps;
  void _to;
  return (
    <button ref={ref as Ref<HTMLButtonElement>} type="button" className={classes} disabled={disabled} aria-busy={loading || undefined} {...button}>
      {content}
    </button>
  );
});
