// MoveJS UI - Shared types and utilities

export type Variant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'info' | 'ghost';

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface BaseProps {
  className?: string;
  id?: string;
  style?: Record<string, string>;
  children?: any;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    primaryHover: string;
    background: string;
    text: string;
    border: string;
    danger: string;
    success: string;
    warning: string;
    info: string;
    surface: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

export const defaultTheme: ThemeConfig = {
  colors: {
    primary: '#6366f1',
    primaryHover: '#4f46e5',
    background: '#ffffff',
    text: '#111827',
    border: '#e5e7eb',
    danger: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
    surface: '#f9fafb'
  },
  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px'
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  }
};

// Class helper
export function cx(...classes: Array<string | undefined | false | null>): string {
  return classes.filter(Boolean).join(' ');
}

// Style helper
export function createStyles(theme: ThemeConfig = defaultTheme): Record<string, string> {
  return {
    primary: styleFromColor(theme.colors.primary),
    primaryHover: styleFromColor(theme.colors.primaryHover),
    danger: styleFromColor(theme.colors.danger),
    success: styleFromColor(theme.colors.success),
    warning: styleFromColor(theme.colors.warning),
    info: styleFromColor(theme.colors.info)
  };
}

function styleFromColor(color: string): string {
  // Convert hex to rgba
  return color;
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
