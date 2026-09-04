import type { VNode, VNodeChild, Component } from '../dom/vnode';
import { isVNode } from '../dom/vnode';

// MoveJS SSR - Render VNode trees to HTML strings

// HTML void elements that don't need a closing tag
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

// Event handler prefixes
const EVENT_PREFIX = /^on[A-Z]/;

function escapeHtml(value: any): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveComponent(
  type: string | Component | null,
  props: Record<string, any>,
  children: VNodeChild[]
): VNode | VNodeChild[] | null {
  if (typeof type === 'function') {
    const result = (type as Component)({ ...props, children });
    return result;
  }
  return null;
}

function styleToString(style: string | Record<string, any> | undefined): string {
  if (!style) return '';
  if (typeof style === 'string') return style;
  return Object.entries(style)
    .map(([key, value]) => {
      if (value == null || value === false) return '';
      const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${cssKey}: ${value}`;
    })
    .filter(Boolean)
    .join('; ');
}

function serializeAttributes(props: Record<string, any>): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(props)) {
    if (key === 'key' || key === 'ref') continue;
    if (EVENT_PREFIX.test(key)) continue;
    if (value == null || value === false) continue;

    if (key === 'className') {
      parts.push(`class="${escapeHtml(value)}"`);
    } else if (key === 'style') {
      const s = styleToString(value);
      if (s) parts.push(`style="${escapeHtml(s)}"`);
    } else if (key === 'htmlFor') {
      parts.push(`for="${escapeHtml(value)}"`);
    } else if (value === true) {
      parts.push(key);
    } else {
      parts.push(`${key}="${escapeHtml(value)}"`);
    }
  }

  return parts.length ? ` ${parts.join(' ')}` : '';
}

function serializeChildren(children: VNodeChild[]): string {
  let html = '';
  for (const child of children) {
    if (child == null || child === false) continue;
    html += serializeToChild(child);
  }
  return html;
}

function serializeToChild(child: VNodeChild): string {
  if (typeof child === 'string') return escapeHtml(child);
  if (typeof child === 'number') return String(child);
  if (isVNode(child)) return serializeVNode(child);
  return '';
}

function serializeVNode(vnode: VNode): string {
  const { type, props, children } = vnode;

  // Component (function)
  if (typeof type === 'function') {
    const resolved = resolveComponent(type, props, children);
    if (resolved == null) return '';
    if (Array.isArray(resolved)) {
      return resolved.map((c) => (isVNode(c) ? serializeVNode(c) : typeof c === 'string' ? escapeHtml(c) : '')).join('');
    }
    if (isVNode(resolved)) return serializeVNode(resolved);
    return serializeToChild(resolved);
  }

  // Fragment
  if (type === null) {
    return serializeChildren(children);
  }

  // Regular element
  const tag = type as string;
  const attrs = serializeAttributes(props);

  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${attrs} />`;
  }

  const inner = serializeChildren(children);
  return `<${tag}${attrs}>${inner}</${tag}>`;
}

// Escape text content within a <script>/<style> context is handled by the caller.
// Main render-to-string entry
export function renderToString(root: any, props: Record<string, any> = {}): string {
  // Resolve a component function to a VNode first
  let vnode: any = root;
  if (typeof root === 'function') {
    vnode = (root as Component)(props);
  }
  if (isVNode(vnode)) {
    return serializeVNode(vnode);
  }
  if (vnode == null) return '';
  return serializeToChild(vnode);
}

// Render a full HTML document (used by the framework to wrap page content)
export function renderToDocument(
  body: string,
  head: {
    title?: string;
    meta?: Array<Record<string, any>>;
    links?: Array<Record<string, any>>;
    scripts?: Array<Record<string, any>>;
  } = {}
): string {
  const title = head.title ? `<title>${escapeHtml(head.title)}</title>` : '';
  const meta = (head.meta || [])
    .map((m) => `<meta ${Object.entries(m).map(([k, v]) => `${k}="${escapeHtml(v)}"`).join(' ')} />`)
    .join('');
  const links = (head.links || [])
    .map((l) => `<link ${Object.entries(l).map(([k, v]) => `${k}="${escapeHtml(v)}"`).join(' ')} />`)
    .join('');
  const scripts = (head.scripts || [])
    .map((s) => {
      if (s.content) return `<script>${s.content}</script>`;
      return `<script src="${escapeHtml(s.src || '')}"></script>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${title}${meta}${links}
</head>
<body>${body}${scripts}</body>
</html>`;
}