import { createElement, Fragment } from '../dom/vnode';
import type { VNode, Component } from '../dom/vnode';

// JSX Runtime for automatic JSX transform
export { Fragment };

export function jsx(
  type: string | Component,
  props: Record<string, any>,
  key?: string | number
): VNode {
  return createElement(type, { ...props, key });
}

export function jsxs(
  type: string | Component,
  props: Record<string, any>,
  key?: string | number
): VNode {
  return createElement(type, { ...props, key });
}

export function jsxDEV(
  type: string | Component,
  props: Record<string, any>,
  key?: string | number,
  source?: { fileName: string; lineNumber: number },
  self?: any
): VNode {
  const vnode = createElement(type, { ...props, key });

  // Add dev information
  if (source) {
    (vnode as any).__source = source;
  }

  return vnode;
}
