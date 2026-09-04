import type { BaseProps, Variant, Size } from '../shared';
import { cx } from '../shared';

// Button component
export interface ButtonProps extends BaseProps {
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: Event) => void;
}

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    type = 'button',
    children,
    onClick,
    className,
    ...rest
  } = props;

  return {
    type: 'button',
    props: {
      type,
      disabled: disabled || loading,
      className: cx('mj-btn', `mj-btn--${variant}`, `mj-btn--${size}`, className),
      onClick,
      'data-loading': loading ? 'true' : undefined,
      ...rest
    },
    children: loading ? ['Loading...'] : [children]
  };
}

// Badge component
export interface BadgeProps extends BaseProps {
  variant?: Variant;
}

export function Badge(props: BadgeProps) {
  const { variant = 'primary', children, className, ...rest } = props;

  return {
    type: 'span',
    props: {
      className: cx('mj-badge', `mj-badge--${variant}`, className),
      ...rest
    },
    children: [children]
  };
}

// Spinner
export interface SpinnerProps {
  size?: Size;
  color?: string;
  className?: string;
}

export function Spinner(props: SpinnerProps) {
  const { size = 'md', color, className } = props;

  return {
    type: 'div',
    props: {
      className: cx('mj-spinner', `mj-spinner--${size}`, className),
      role: 'status',
      'aria-label': 'Loading',
      style: color ? { borderTopColor: color } : undefined
    },
    children: []
  };
}

// Divider
export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Divider(props: DividerProps) {
  const { orientation = 'horizontal', className } = props;

  return {
    type: 'hr',
    props: {
      className: cx('mj-divider', `mj-divider--${orientation}`, className),
      role: 'separator'
    },
    children: []
  };
}

// Avatar
export interface AvatarProps extends BaseProps {
  src?: string;
  alt?: string;
  size?: Size;
  name?: string;
  fallback?: string;
}

export function Avatar(props: AvatarProps) {
  const { src, alt, size = 'md', name, fallback, className, ...rest } = props;

  // Generate initials from name
  const initials = name
    ? name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : fallback || '?';

  if (src) {
    return {
      type: 'img',
      props: {
        src,
        alt: alt || name || '',
        className: cx('mj-avatar', `mj-avatar--${size}`, className),
        ...rest
      },
      children: []
    };
  }

  return {
    type: 'span',
    props: {
      className: cx('mj-avatar', `mj-avatar--${size}`, 'mj-avatar--fallback', className),
      'aria-label': name,
      role: 'img',
      ...rest
    },
    children: [initials]
  };
}

// Skeleton
export interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export function Skeleton(props: SkeletonProps) {
  const { width = '100%', height = '1rem', borderRadius, className } = props;

  return {
    type: 'div',
    props: {
      className: cx('mj-skeleton', className),
      style: {
        width,
        height,
        borderRadius: borderRadius || '0.25rem'
      },
      'aria-hidden': 'true'
    },
    children: []
  };
}

// Tooltip
export interface TooltipProps extends BaseProps {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip(props: TooltipProps) {
  const { content, position = 'top', delay = 0, children, className, ...rest } = props;

  return {
    type: 'span',
    props: {
      className: cx('mj-tooltip-wrapper', className),
      'data-tooltip': content,
      'data-tooltip-position': position,
      'data-tooltip-delay': String(delay),
      ...rest
    },
    children: [children]
  };
}
