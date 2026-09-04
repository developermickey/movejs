import type { FocusTrapOptions, LiveRegionOptions } from '../types';

// Focus Trap
export class FocusTrap {
  private container: HTMLElement;
  private options: FocusTrapOptions;
  private lastFocused: HTMLElement | null = null;
  private focusedElements: HTMLElement[] = [];
  private isActive = false;

  constructor(container: HTMLElement, options: FocusTrapOptions = {}) {
    this.container = container;
    this.options = {
      initialFocus: true as any,
      finalFocus: undefined,
      escapeDeactivates: true,
      returnFocus: true,
      preventScroll: false,
      ...options
    };
  }

  // Activate the focus trap
  activate(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Save current focus
    this.lastFocused = document.activeElement as HTMLElement;

    // Set initial focus
    const initialFocus = this.resolveInitialFocus();
    if (initialFocus) {
      initialFocus.focus({ preventScroll: this.options.preventScroll });
    }

    // Add event listeners
    document.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('focusin', this.handleFocusIn);
  }

  // Deactivate the focus trap
  deactivate(): void {
    if (!this.isActive) return;
    this.isActive = false;

    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('focusin', this.handleFocusIn);

    // Restore focus
    if (this.options.returnFocus && this.lastFocused) {
      this.lastFocused.focus({ preventScroll: this.options.preventScroll });
    }
  }

  // Get focusable elements
  private getFocusableElements(): HTMLElement[] {
    if (!this.container) return [];

    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]'
    ];

    return Array.from(
      this.container.querySelectorAll<HTMLElement>(focusableSelectors.join(','))
    ).filter(el => !el.hasAttribute('disabled') && !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');
  }

  // Resolve the initial focus target
  private resolveInitialFocus(): HTMLElement | null {
    const { initialFocus } = this.options;

    if (initialFocus === false) {
      return null;
    }

    if (typeof initialFocus === 'string') {
      return this.container.querySelector(initialFocus);
    }

    if (initialFocus instanceof HTMLElement) {
      return initialFocus;
    }

    // Default: first focusable element
    const focusable = this.getFocusableElements();
    return focusable[0] || this.container;
  }

  // Handle keydown events
  private handleKeydown = (e: KeyboardEvent): void => {
    // Escape to deactivate
    if (this.options.escapeDeactivates && e.key === 'Escape') {
      this.deactivate();
      return;
    }

    // Tab navigation
    if (e.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) {
      e.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Shift+Tab on first element
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    }
    // Tab on last element
    else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  // Handle focus in events
  private handleFocusIn = (e: FocusEvent): void => {
    const target = e.target as HTMLElement;
    
    // If focus moved outside container, bring it back
    if (!this.container.contains(target)) {
      const focusable = this.getFocusableElements();
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }
  };
}

// Live Region for screen readers
export class LiveRegion {
  private region: HTMLElement | null = null;
  private options: LiveRegionOptions;
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: LiveRegionOptions = {}) {
    this.options = {
      assertive: false,
      debounce: 150,
      ...options
    };
    this.createRegion();
  }

  // Create the live region element
  private createRegion(): void {
    this.region = document.createElement('div');
    this.region.setAttribute('aria-live', this.options.assertive ? 'assertive' : 'polite');
    this.region.setAttribute('role', 'status');
    this.region.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      border: 0;
      clip: rect(0 0 0 0);
      overflow: hidden;
      white-space: nowrap;
    `;
    
    document.body.appendChild(this.region);
  }

  // Announce a message to screen readers
  announce(message: string): void {
    if (!this.region) return;

    // Debounce updates
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }

    this.cleanupTimer = setTimeout(() => {
      // Set text content (this triggers screen reader announcement)
      this.region!.textContent = message;
    }, this.options.debounce || 0);
  }

  // Clear the live region
  clear(): void {
    if (this.region) {
      this.region.textContent = '';
    }
  }

  // Remove the live region
  destroy(): void {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
    }
    if (this.region?.parentElement) {
      this.region.parentElement.removeChild(this.region);
    }
    this.region = null;
  }
}

// Skip Link component
export function SkipLink(props: {
  href?: string;
  children?: any;
  label?: string;
}): string {
  const href = props.href || '#main-content';
  const label = props.label || 'Skip to main content';

  return `
<a href="${href}" class="movejs-skip-link">
  ${label}
</a>
<style>
.movejs-skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: 9999;
  padding: 0.75rem 1.25rem;
  background: #000;
  color: #fff;
  font-size: 1rem;
  text-decoration: none;
}
.movejs-skip-link:focus {
  left: 0;
}
</style>
`.trim();
}

// Keyboard navigation helpers
export function enableKeyboardNavigation(): () => void {
  const handlers: Array<() => void> = [];

  // Ensure all interactive elements are keyboard focusable
  const addKeydownToClickables = () => {
    const clickables = document.querySelectorAll<HTMLElement>('[onclick]');
    
    clickables.forEach(el => {
      if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '0');
      }
    });
  };

  addKeydownToClickables();

  // Handle Enter/Space on custom clickable elements
  const handleClickableKeydown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[onclick]')) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      target.click();
    }
  };

  document.addEventListener('keydown', handleClickableKeydown);
  handlers.push(() => document.removeEventListener('keydown', handleClickableKeydown));

  return () => {
    handlers.forEach(h => h());
  };
}

// Create singleton live region
let defaultLiveRegion: LiveRegion | null = null;

export function announce(message: string): void {
  if (!defaultLiveRegion) {
    defaultLiveRegion = new LiveRegion();
  }
  defaultLiveRegion.announce(message);
}
