import type { BaseProps, Variant, Size } from '../shared';
import { cx, hexToRgba, defaultTheme } from '../shared';

// Alert / Toast
export interface AlertProps extends BaseProps {
  variant?: Variant;
  title?: string;
  dismissible?: boolean;
  icon?: string;
  onClose?: () => void;
}

export function Alert(props: AlertProps) {
  const { variant = 'info', title, dismissible, icon, onClose, children, className } = props;

  return {
    type: 'div',
    props: {
      className: cx('mj-alert', `mj-alert--${variant}`, className),
      role: variant === 'danger' || variant === 'warning' ? 'alert' : 'status'
    },
    children: [
      icon && {
        type: 'span',
        props: { className: 'mj-alert-icon', 'aria-hidden': 'true' },
        children: [icon]
      },
      {
        type: 'div',
        props: { className: 'mj-alert-content' },
        children: [
          title && {
            type: 'p',
            props: { className: 'mj-alert-title' },
            children: [title]
          },
          {
            type: 'div',
            props: { className: 'mj-alert-message' },
            children: [children]
          }
        ]
      },
      dismissible && {
        type: 'button',
        props: {
          className: 'mj-alert-close',
          onClick: onClose,
          'aria-label': 'Close alert'
        },
        children: ['×']
      }
    ].filter(Boolean)
  };
}

// Banner
export interface BannerProps extends BaseProps {
  title: string;
  description?: string;
  variant?: 'gradient' | 'outline' | 'soft';
  image?: string;
}

export function Banner(props: BannerProps) {
  const { title, description, variant = 'gradient', image, children, className } = props;

  return {
    type: 'div',
    props: {
      className: cx('mj-banner', `mj-banner--${variant}`, className),
      style: image ? { backgroundImage: `url(${image})` } : undefined
    },
    children: [
      {
        type: 'div',
        props: { className: 'mj-banner-content' },
        children: [
          { type: 'h2', props: { className: 'mj-banner-title' }, children: [title] },
          description && { type: 'p', props: { className: 'mj-banner-desc' }, children: [description] },
          { type: 'div', props: { className: 'mj-banner-actions' }, children: [children] }
        ]
      }
    ].filter(Boolean)
  };
}

// LoadingBar / progress indicator
export interface ProgressProps extends BaseProps {
  value?: number;
  max?: number;
  indeterminate?: boolean;
  size?: Size;
  color?: string;
}

export function Progress(props: ProgressProps) {
  const { value = 100, max = 100, indeterminate = false, size = 'md', color, className } = props;

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return {
    type: 'div',
    props: {
      className: cx('mj-progress', `mj-progress--${size}`, className),
      role: 'progressbar',
      'aria-valuenow': indeterminate ? undefined : value,
      'aria-valuemin': 0,
      'aria-valuemax': max
    },
    children: [
      {
        type: 'div',
        props: {
          className: cx('mj-progress-bar', indeterminate && 'mj-progress--indeterminate'),
          style: color
            ? { background: color, width: indeterminate ? undefined : `${percentage}%` }
            : { width: indeterminate ? undefined : `${percentage}%` }
        },
        children: []
      }
    ]
  };
}

// Toast handler
export interface ToastOptions {
  title?: string;
  message?: string;
  variant?: Variant;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

class ToastManager {
  private container: HTMLElement | null = null;

  show(options: ToastOptions): void {
    const {
      title,
      message,
      variant = 'info',
      duration = 3000,
      position = 'top-right'
    } = options;

    this.ensureContainer(position);

    const toast = document.createElement('div');
    toast.className = `mj-toast mj-alert--${variant}`;
    toast.setAttribute('role', 'status');

    let html = '';
    if (title) {
      html += `<p class="mj-toast-title">${this.escape(title)}</p>`;
    }
    if (message) {
      html += `<div class="mj-toast-message">${this.escape(message)}</div>`;
    }

    toast.innerHTML = html;
    this.container!.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.add('mj-toast--show');
    });

    // Auto dismiss
    setTimeout(() => {
      this.dismiss(toast);
    }, duration);
  }

  // Show success toast
  success(message: string, title?: string): void {
    this.show({ message, title, variant: 'success' });
  }

  // Show error toast
  error(message: string, title?: string): void {
    this.show({ message, title, variant: 'danger' });
  }

  // Show warning toast
  warning(message: string, title?: string): void {
    this.show({ message, title, variant: 'warning' });
  }

  // Show info toast
  info(message: string, title?: string): void {
    this.show({ message, title, variant: 'info' });
  }

  // Ensure toast container exists
  private ensureContainer(position: string): void {
    if (!this.container || !this.container.isConnected) {
      this.container = document.createElement('div');
      this.container.className = `mj-toast-container mj-toast-container--${position}`;
      document.body.appendChild(this.container);
    }
  }

  // Dismiss a toast
  private dismiss(toast: HTMLElement): void {
    toast.classList.remove('mj-toast--show');
    toast.classList.add('mj-toast--hide');

    setTimeout(() => {
      toast.remove();
    }, 300);
  }

  private escape(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const toast = new ToastManager();

// Skeleton loader for loading states
export interface LoadingStateProps extends BaseProps {
  lines?: number;
  withTitle?: boolean;
  withAction?: boolean;
}

export function LoadingState(props: LoadingStateProps) {
  const { lines = 3, withTitle = true, withAction = false, className } = props;

  return {
    type: 'div',
    props: {
      className: cx('mj-loading', className),
      role: 'status',
      'aria-label': 'Loading'
    },
    children: [
      withTitle && {
        type: 'div',
        props: {
          className: 'mj-skeleton',
          style: { width: '60%', height: '2rem', marginBottom: '1rem' }
        },
        children: []
      },
      ...Array.from({ length: lines }, (_, i) => ({
        type: 'div',
        props: {
          className: 'mj-skeleton',
          style: { width: `${100 - i * 10}%`, height: '1rem', marginBottom: '0.75rem' }
        },
        children: []
      })),
      withAction && {
        type: 'div',
        props: {
          className: 'mj-skeleton',
          style: { width: '8rem', height: '2.5rem', marginTop: '1rem' }
        },
        children: []
      }
    ]
  };
}
