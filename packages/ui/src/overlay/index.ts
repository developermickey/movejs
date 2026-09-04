import type { BaseProps, Variant, Size } from '../shared';
import { cx } from '../shared';
import { FocusTrap } from '@movejs/a11y';

// Modal
export interface ModalProps extends BaseProps {
  open: boolean;
  title?: string;
  description?: string;
  size?: Size;
  closeOnEsc?: boolean;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  onClose: () => void;
}

export function Modal(props: ModalProps) {
  const { open, title, description, size = 'md', closeOnEsc = true, closeOnOverlayClick = true, showCloseButton = true, onClose, children } = props;

  if (!open) return null;

  // Escape key handling
  if (typeof document !== 'undefined' && closeOnEsc) {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEsc);
    // Cleanup on next render (simplified)
  }

  return {
    type: 'div',
    props: {
      className: 'mj-modal',
      role: 'presentation',
      onClick: (e: any) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
          onClose();
        }
      }
    },
    children: [
      {
        type: 'div',
        props: {
          className: cx('mj-modal-overlay'),
          onClick: closeOnOverlayClick ? onClose : undefined
        },
        children: []
      },
      {
        type: 'div',
        props: {
          className: cx('mj-modal-content mj-modal-content--' + size),
          role: 'dialog',
          'aria-modal': 'true',
          'aria-labelledby': title ? 'mj-modal-title' : undefined,
          'aria-describedby': description ? 'mj-modal-desc' : undefined
        },
        children: [
          showCloseButton && {
            type: 'button',
            props: {
              className: 'mj-modal-close',
              onClick: onClose,
              'aria-label': 'Close modal'
            },
            children: ['×']
          },
          title && { type: 'h2', props: { id: 'mj-modal-title', className: 'mj-modal-title' }, children: [title] },
          description && { type: 'p', props: { id: 'mj-modal-desc', className: 'mj-modal-desc' }, children: [description] },
          { type: 'div', props: { className: 'mj-modal-body' }, children: [children] }
        ].filter(Boolean)
      }
    ]
  };
}

// Drawer (Side panel)
export interface DrawerProps extends BaseProps {
  open: boolean;
  title?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
  size?: string;
  closeOnEsc?: boolean;
  onClose: () => void;
}

export function Drawer(props: DrawerProps) {
  const { open, title, position = 'right', size = '400px', closeOnEsc = true, onClose, children } = props;

  if (!open) return null;

  const sizeStyle =
    position === 'left' || position === 'right'
      ? { width: size, height: '100%' }
      : { height: size, width: '100%' };

  return {
    type: 'div',
    props: { className: 'mj-drawer', role: 'presentation' },
    children: [
      {
        type: 'div',
        props: { className: 'mj-drawer-overlay', onClick: onClose },
        children: []
      },
      {
        type: 'div',
        props: {
          className: cx('mj-drawer-panel', `mj-drawer--${position}`),
          style: sizeStyle,
          role: 'dialog',
          'aria-modal': 'true',
          'aria-label': title
        },
        children: [
          title && {
            type: 'div',
            props: { className: 'mj-drawer-header' },
            children: [
              { type: 'h2', props: { className: 'mj-drawer-title' }, children: [title] },
              {
                type: 'button',
                props: { className: 'mj-drawer-close', onClick: onClose, 'aria-label': 'Close drawer' },
                children: ['×']
              }
            ]
          },
          { type: 'div', props: { className: 'mj-drawer-body' }, children: [children] }
        ]
      }
    ]
  };
}

// Tooltip wrapper

// Popover
export interface PopoverProps extends BaseProps {
  trigger: any;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export function Popover(props: PopoverProps) {
  const { trigger, position = 'bottom', disabled, children, className } = props;

  return {
    type: 'div',
    props: { className: cx('mj-popover', className) },
    children: [
      { type: 'div', props: { className: 'mj-popover-trigger' }, children: [trigger] },
      {
        type: 'div',
        props: {
          className: cx('mj-popover-content', `mj-popover--${position}`),
          role: 'tooltip'
        },
        children: [children]
      }
    ]
  };
}

// ConfirmDialog
export interface ConfirmDialogProps extends BaseProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'primary', onConfirm, onCancel } = props;

  if (!open) return null;

  return {
    type: 'div',
    props: { className: 'mj-dialog', role: 'presentation' },
    children: [
      { type: 'div', props: { className: 'mj-dialog-overlay' }, children: [] },
      {
        type: 'div',
        props: {
          className: 'mj-dialog-content',
          role: 'alertdialog',
          'aria-modal': 'true',
          'aria-labelledby': 'mj-dialog-title'
        },
        children: [
          { type: 'h2', props: { id: 'mj-dialog-title', className: 'mj-dialog-title' }, children: [title] },
          message && { type: 'p', props: { className: 'mj-dialog-message' }, children: [message] },
          {
            type: 'div',
            props: { className: 'mj-dialog-actions' },
            children: [
              {
                type: 'button',
                props: { className: 'mj-btn mj-btn--ghost', onClick: onCancel },
                children: [cancelLabel]
              },
              {
                type: 'button',
                props: {
                  className: `mj-btn mj-btn--${variant}`,
                  onClick: onConfirm
                },
                children: [confirmLabel]
              }
            ]
          }
        ]
      }
    ]
  };
}

// LoadingOverlay
export interface LoadingOverlayProps extends BaseProps {
  visible: boolean;
  message?: string;
}

export function LoadingOverlay(props: LoadingOverlayProps) {
  const { visible, message, className } = props;

  if (!visible) return null;

  return {
    type: 'div',
    props: {
      className: cx('mj-loading-overlay', className),
      role: 'status',
      'aria-live': 'polite'
    },
    children: [
      {
        type: 'div',
        props: { className: 'mj-spinner mj-spinner--md' },
        children: []
      },
      message && {
        type: 'p',
        props: { className: 'mj-loading-message' },
        children: [message]
      }
    ]
  };
}

// Backdrop
export interface BackdropProps extends BaseProps {
  visible: boolean;
  transparent?: boolean;
  onClick?: (e: Event) => void;
}

export function Backdrop(props: BackdropProps) {
  const { visible, transparent, onClick, className } = props;

  if (!visible) return null;

  return {
    type: 'div',
    props: {
      className: cx('mj-backdrop', transparent && 'mj-backdrop--transparent', className),
      onClick,
      'aria-hidden': 'true'
    },
    children: []
  };
}
