import type { BaseProps } from '../shared';
import { cx } from '../shared';

// Container
export interface ContainerProps extends BaseProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fluid';
}

export function Container(props: ContainerProps) {
  const { size = 'lg', children, className, ...rest } = props;

  return {
    type: 'div',
    props: { className: cx('mj-container', `mj-container--${size}`, className), ...rest },
    children: [children]
  };
}

// Grid
export interface GridProps extends BaseProps {
  columns?: number | string;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around';
}

export function Grid(props: GridProps) {
  const { columns = 2, gap = '1rem', rowGap, columnGap, align, justify, children, className, style, ...rest } = props;

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
    gap,
    rowGap,
    columnGap,
    alignItems: align,
    justifyContent: justify,
    ...style
  };

  return {
    type: 'div',
    props: { className: cx('mj-grid', className), style: gridStyle, ...rest },
    children: [children]
  };
}

// Flex
export interface FlexProps extends BaseProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  wrap?: boolean;
  gap?: string;
}

export function Flex(props: FlexProps) {
  const { direction = 'row', align, justify = 'start', wrap = false, gap = '0.5rem', children, className, style, ...rest } = props;

  const flexStyle = {
    display: 'flex',
    flexDirection: direction,
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    gap,
    ...style
  };

  return {
    type: 'div',
    props: { className: cx('mj-flex', className), style: flexStyle, ...rest },
    children: [children]
  };
}

// Card
export interface CardProps extends BaseProps {
  hoverable?: boolean;
  padding?: string;
  clickable?: boolean;
  onClick?: (e: Event) => void;
}

export function Card(props: CardProps) {
  const { hoverable, padding, clickable, onClick, children, className, style, ...rest } = props;

  const cardStyle = {
    padding,
    ...style
  };

  return {
    type: 'div',
    props: {
      className: cx('mj-card', hoverable && 'mj-card--hoverable', clickable && 'mj-card--clickable', className),
      style: cardStyle,
      onClick,
      ...rest
    },
    children: [children]
  };
}

// Card sub-components
export function CardHeader(props: BaseProps) {
  const { children, className, ...rest } = props;
  return { type: 'div', props: { className: cx('mj-card-header', className), ...rest }, children: [children] };
}

export function CardBody(props: BaseProps) {
  const { children, className, ...rest } = props;
  return { type: 'div', props: { className: cx('mj-card-body', className), ...rest }, children: [children] };
}

export function CardFooter(props: BaseProps) {
  const { children, className, ...rest } = props;
  return { type: 'div', props: { className: cx('mj-card-footer', className), ...rest }, children: [children] };
}

// Stack
export interface StackProps extends BaseProps {
  spacing?: string;
  divide?: boolean;
  childrenWithSeparators?: boolean;
}

export function Stack(props: StackProps) {
  const { spacing = '1rem', divide = false, children, className, ...rest } = props;

  return {
    type: 'div',
    props: {
      className: cx('mj-stack', divide && 'mj-stack--divided', className),
      style: { '--mj-stack-gap': spacing } as any,
      ...rest
    },
    children: [children]
  };
}

// Section
export interface SectionProps extends BaseProps {
  title?: string;
  description?: string;
  centered?: boolean;
}

export function Section(props: SectionProps) {
  const { title, description, centered, children, className, ...rest } = props;

  return {
    type: 'section',
    props: { className: cx('mj-section', centered && 'mj-section--centered', className), ...rest },
    children: [
      (title || description) && {
        type: 'div',
        props: { className: 'mj-section-header' },
        children: [
          title && { type: 'h2', props: { className: 'mj-section-title' }, children: [title] },
          description && { type: 'p', props: { className: 'mj-section-desc' }, children: [description] }
        ]
      },
      { type: 'div', props: { className: 'mj-section-content' }, children: [children] }
    ].filter(Boolean)
  };
}

// Divider already in primitives

// Space
export interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  axis?: 'horizontal' | 'vertical';
}

export function Spacer(props: SpacerProps) {
  const { size = 'md', axis = 'vertical' } = props;

  const sizes: Record<string, string> = {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem'
  };

  const dimension = typeof size === 'string' && sizes[size] ? sizes[size] : size;
  const isHorizontal = axis === 'horizontal';

  return {
    type: 'div',
    props: {
      className: 'mj-spacer',
      'aria-hidden': 'true',
      style: isHorizontal ? { width: dimension, minWidth: dimension } : { height: dimension, minHeight: dimension }
    },
    children: []
  };
}
