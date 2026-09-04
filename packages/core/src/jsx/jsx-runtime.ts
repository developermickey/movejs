import { createElement, Fragment } from '../dom/vnode';
import type { VNode, Component } from '../dom/vnode';

// JSX Runtime for automatic JSX transform
export { Fragment };

export function jsx(
  type: string | Component,
  props: Record<string, any>,
  key?: string | number
): VNode {
  const { children, ...rest } = props || {};
  const kids = Array.isArray(children) ? (children as any[]) : children == null ? [] : [children];
  return createElement(type, { ...rest, key }, ...kids);
}

export function jsxs(
  type: string | Component,
  props: Record<string, any>,
  key?: string | number
): VNode {
  const { children, ...rest } = props || {};
  const kids = Array.isArray(children) ? (children as any[]) : children == null ? [] : [children];
  return createElement(type, { ...rest, key }, ...kids);
}

export function jsxDEV(
  type: string | Component,
  props: Record<string, any>,
  key?: string | number,
  source?: { fileName: string; lineNumber: number },
  self?: any
): VNode {
  const { children, ...rest } = props || {};
  const kids = Array.isArray(children) ? (children as any[]) : children == null ? [] : [children];
  const vnode = createElement(type, { ...rest, key }, ...kids);

  // Add dev information
  if (source) {
    (vnode as any).__source = source;
  }

  return vnode;
}
