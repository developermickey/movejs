import type { BaseProps } from '../shared';
import { cx } from '../shared';

// Table
export interface TableProps extends BaseProps {
  caption?: string;
  striped?: boolean;
  hoverable?: boolean;
  borderless?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
}

export function Table(props: TableProps) {
  const { caption, striped, hoverable, borderless, compact, stickyHeader, children, className, ...rest } = props;

  return {
    type: 'table',
    props: {
      className: cx(
        'mj-table',
        striped && 'mj-table--striped',
        hoverable && 'mj-table--hoverable',
        borderless && 'mj-table--borderless',
        compact && 'mj-table--compact',
        stickyHeader && 'mj-table--sticky',
        className
      ),
      ...rest
    },
    children: [
      caption && { type: 'caption', props: { className: 'mj-table-caption' }, children: [caption] },
      children
    ]
  };
}

export function TableHead(props: BaseProps) {
  const { children, className, ...rest } = props;
  return { type: 'thead', props: { className: cx('mj-thead', className), ...rest }, children: [children] };
}

export function TableBody(props: BaseProps) {
  const { children, className, ...rest } = props;
  return { type: 'tbody', props: { className: cx('mj-tbody', className), ...rest }, children: [children] };
}

export function TableFoot(props: BaseProps) {
  const { children, className, ...rest } = props;
  return { type: 'tfoot', props: { className: cx('mj-tfoot', className), ...rest }, children: [children] };
}

export function TableRow(props: BaseProps & { selected?: boolean }) {
  const { children, selected, className, ...rest } = props;
  return { type: 'tr', props: { className: cx('mj-tr', selected && 'mj-tr--selected', className), ...rest }, children: [children] };
}

export function TableCell(props: BaseProps & { align?: 'left' | 'center' | 'right' }) {
  const { children, align, className, ...rest } = props;
  return { type: 'td', props: { className: cx('mj-td', className), style: align ? { textAlign: align } : undefined, ...rest }, children: [children] };
}

export function TableHeaderCell(props: BaseProps & { sortable?: boolean; sorted?: 'asc' | 'desc'; onSort?: () => void }) {
  const { children, sortable, sorted, onSort, className, ...rest } = props;

  return {
    type: 'th',
    props: {
      className: cx('mj-th', sortable && 'mj-th--sortable', className),
      'aria-sort': sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined,
      onClick: sortable ? onSort : undefined,
      style: sortable ? { cursor: 'pointer' } : undefined,
      ...rest
    },
    children: sortable ? [children, ' ', sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : ''] : [children]
  };
}

// Pagination
export interface PaginationProps extends BaseProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  siblingCount?: number;
  disabled?: boolean;
}

export function Pagination(props: PaginationProps) {
  const { page, totalPages, onPageChange, siblingCount = 1, disabled, className } = props;

  const pages: Array<number | string> = [];
  const rangeStart = Math.max(1, page - siblingCount);
  const rangeEnd = Math.min(totalPages, page + siblingCount);

  if (rangeStart > 1) {
    pages.push(1);
    if (rangeStart > 2) pages.push('...');
  }

  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  if (rangeEnd < totalPages) {
    if (rangeEnd < totalPages - 1) pages.push('...');
    pages.push(totalPages);
  }

  const createPageButton = (p: number | string, isCurrent = false) => ({
    type: 'button',
    props: {
      className: cx('mj-page-btn', isCurrent && 'mj-page-btn--active'),
      onClick: typeof p === 'number' && !disabled ? () => onPageChange(p) : undefined,
      disabled: disabled || typeof p !== 'number',
      'aria-label': typeof p === 'number' ? `Go to page ${p}` : undefined,
      'aria-current': isCurrent ? 'page' : undefined,
      'aria-disabled': disabled ? 'true' : undefined
    },
    children: [String(p)]
  });

  return {
    type: 'nav',
    props: { className: cx('mj-pagination', className), role: 'navigation', 'aria-label': 'Pagination' },
    children: [
      {
        type: 'div',
        props: { className: 'mj-pagination-list' },
        children: [
          createPageButton('‹', false),
          ...pages.map(p => createPageButton(p, p === page)),
          createPageButton('›', false)
        ]
      }
    ]
  };
}

// List
export interface ListProps extends BaseProps {
  ordered?: boolean;
  unstyled?: boolean;
  inline?: boolean;
}

export function List(props: ListProps) {
  const { ordered, unstyled, inline, children, className, ...rest } = props;

  const tag = ordered ? 'ol' : 'ul';

  return {
    type: tag,
    props: {
      className: cx('mj-list', unstyled && 'mj-list--unstyled', inline && 'mj-list--inline', className),
      ...rest
    },
    children: [children]
  };
}

export function ListItem(props: BaseProps & { icon?: string; action?: any }) {
  const { children, icon, action, className, ...rest } = props;

  return {
    type: 'li',
    props: { className: cx('mj-list-item', className), ...rest },
    children: [
      icon && { type: 'span', props: { className: 'mj-list-icon', 'aria-hidden': 'true' }, children: [icon] },
      { type: 'div', props: { className: 'mj-list-content' }, children: [children] },
      action && { type: 'div', props: { className: 'mj-list-action' }, children: [action] }
    ]
  };
}

// Empty State
export interface EmptyStateProps extends BaseProps {
  icon?: string;
  title: string;
  description?: string;
  action?: any;
}

export function EmptyState(props: EmptyStateProps) {
  const { icon, title, description, action, children, className } = props;

  return {
    type: 'div',
    props: { className: cx('mj-empty-state', className) },
    children: [
      icon && { type: 'div', props: { className: 'mj-empty-icon' }, children: [icon] },
      { type: 'h3', props: { className: 'mj-empty-title' }, children: [title] },
      description && { type: 'p', props: { className: 'mj-empty-desc' }, children: [description] },
      action && { type: 'div', props: { className: 'mj-empty-action' }, children: [action] }
    ].filter(Boolean)
  };
}

// Stat / Metric
export interface StatProps extends BaseProps {
  label: string;
  value: string | number;
  icon?: string;
  trend?: number;
  trendDirection?: 'up' | 'down';
  description?: string;
}

export function Stat(props: StatProps) {
  const { label, value, icon, trend, trendDirection = 'up', description, className } = props;

  return {
    type: 'div',
    props: { className: cx('mj-stat', className) },
    children: [
      icon && { type: 'div', props: { className: 'mj-stat-icon' }, children: [icon] },
      {
        type: 'div',
        props: { className: 'mj-stat-content' },
        children: [
          { type: 'p', props: { className: 'mj-stat-label' }, children: [label] },
          { type: 'h3', props: { className: 'mj-stat-value' }, children: [String(value)] },
          trend !== undefined && {
            type: 'p',
            props: {
              className: cx('mj-stat-trend', `mj-stat-trend--${trendDirection}`),
              'aria-label': `${trendDirection === 'up' ? 'Increase' : 'Decrease'} of ${Math.abs(trend)}%`
            },
            children: [`${trendDirection === 'up' ? '↑' : '↓'} ${Math.abs(trend)}%`]
          }
        ]
      }
    ]
  };
}
