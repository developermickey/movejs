import { VNode, VNodeChild, isVNode, Component, Ref } from './vnode';
import { Effect, createEffect, batch } from '../reactive/signals';

// DOM namespace
const SVG_NS = 'http://www.w3.org/2000/svg';
const MATH_NS = 'http://www.w3.org/1998/Math/MathML';

interface RenderOptions {
  isSvg?: boolean;
  parentNamespace?: string;
}

// Create real DOM from VNode
export function createElement(vnode: VNode, options: RenderOptions = {}): Node {
  if (vnode.type === null) {
    // Text node
    const text = document.createTextNode(String(vnode.children[0] || ''));
    vnode._dom = text;
    return text;
  }

  if (typeof vnode.type === 'function') {
    // Component
    return createComponentElement(vnode, options);
  }

  // Regular element
  return createElementNode(vnode, options);
}

function createElementNode(vnode: VNode, options: RenderOptions): Node {
  const { isSvg = false } = options;
  let el: Element;

  if (vnode.type === 'svg') {
    el = document.createElementNS(SVG_NS, 'svg');
    options.isSvg = true;
  } else if (isSvg) {
    el = document.createElementNS(SVG_NS, vnode.type as string);
  } else {
    el = document.createElement(vnode.type as string);
  }

  vnode._dom = el;

  // Set properties and attributes
  applyProps(el, {}, vnode.props, isSvg);

  // Render children
  for (const child of vnode.children) {
    const childEl = renderChild(child, { ...options, isSvg });
    if (childEl) {
      el.appendChild(childEl);
    }
  }

  // Handle ref
  if (vnode.ref) {
    if (typeof vnode.ref === 'function') {
      (vnode as any)._refCallback = vnode.ref;
      (vnode as any)._refCallback(el);
    } else {
      vnode.ref.current = el;
    }
  }

  return el;
}

function createComponentElement(vnode: VNode, options: RenderOptions): Node {
  const ComponentFn = vnode.type as Component;
  const instance = {
    props: vnode.props,
    mounted: false,
    cleanup: [] as (() => void)[]
  };

  vnode._component = instance;

  // Create a placeholder
  const placeholder = document.createComment('component');
  vnode._dom = placeholder;

  // Run the component
  const effect = createEffect(() => {
    const result = ComponentFn(vnode.props);
    if (result) {
      const newDom = createElement(result, options);
      const parent = placeholder.parentNode;
      if (parent) {
        if (placeholder.nextSibling) {
          parent.insertBefore(newDom, placeholder.nextSibling);
        } else {
          parent.appendChild(newDom);
        }
        // Remove old content after placeholder
        while (placeholder.nextSibling && placeholder.nextSibling !== newDom) {
          parent.removeChild(placeholder.nextSibling);
        }
      }
      vnode._dom = newDom;
      if (vnode.ref) {
        if (typeof vnode.ref === 'function') {
          vnode.ref(newDom);
        } else {
          vnode.ref.current = newDom;
        }
      }
    }
  });

  instance.cleanup.push(effect);

  return placeholder;
}

function renderChild(
  child: VNodeChild,
  options: RenderOptions
): Node | null {
  if (child == null || child === false) {
    return null;
  }

  if (typeof child === 'string' || typeof child === 'number') {
    return document.createTextNode(String(child));
  }

  if (isVNode(child)) {
    return createElement(child, options);
  }

  return null;
}

// Apply props to DOM element
export function applyProps(
  el: Element,
  oldProps: Record<string, any>,
  newProps: Record<string, any>,
  isSvg: boolean = false
): void {
  // Remove old props
  for (const key of Object.keys(oldProps)) {
    if (!(key in newProps)) {
      setProperty(el, key, oldProps[key], undefined, isSvg);
    }
  }

  // Set new props
  for (const key of Object.keys(newProps)) {
    if (oldProps[key] !== newProps[key]) {
      setProperty(el, key, oldProps[key], newProps[key], isSvg);
    }
  }
}

function setProperty(
  el: Element,
  name: string,
  oldValue: any,
  newValue: any,
  isSvg: boolean
): void {
  if (name === 'class' || name === 'className') {
    if (isSvg) {
      if (typeof newValue === 'string') {
        el.setAttribute('class', newValue);
      } else if (typeof newValue === 'object') {
        const classes = Object.entries(newValue)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(' ');
        el.setAttribute('class', classes);
      }
    } else {
      if (typeof newValue === 'string') {
        el.className = newValue;
      } else if (typeof newValue === 'object') {
        el.className = Object.entries(newValue)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(' ');
      }
    }
    return;
  }

  if (name === 'style') {
    if (typeof newValue === 'string') {
      (el as HTMLElement).style.cssText = newValue;
    } else if (typeof newValue === 'object') {
      const style = (el as HTMLElement).style;
      if (oldValue && typeof oldValue === 'object') {
        for (const key of Object.keys(oldValue)) {
          if (!(key in newValue)) {
            style.setProperty(key, '');
          }
        }
      }
      for (const [key, value] of Object.entries(newValue)) {
        if (typeof value === 'number') {
          style.setProperty(key, `${value}px`);
        } else {
          style.setProperty(key, String(value));
        }
      }
    }
    return;
  }

  if (name.startsWith('on')) {
    const eventName = name.slice(2).toLowerCase();
    if (oldValue) {
      el.removeEventListener(eventName, oldValue);
    }
    if (newValue) {
      el.addEventListener(eventName, newValue);
    }
    return;
  }

  if (name === 'ref') {
    return; // Handled separately
  }

  if (name === 'dangerouslySetInnerHTML') {
    (el as HTMLElement).innerHTML = newValue?.__html || '';
    return;
  }

  if (name === 'value' && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
    (el as any).value = newValue ?? '';
    return;
  }

  if (name === 'checked' && el instanceof HTMLInputElement) {
    el.checked = !!newValue;
    return;
  }

  if (name === 'disabled') {
    if (newValue) {
      el.setAttribute('disabled', '');
    } else {
      el.removeAttribute('disabled');
    }
    return;
  }

  if (name === 'contentEditable') {
    el.setAttribute('contenteditable', String(newValue));
    return;
  }

  if (name === 'tabIndex') {
    el.setAttribute('tabindex', String(newValue));
    return;
  }

  if (name === 'role') {
    el.setAttribute('role', String(newValue));
    return;
  }

  if (name.startsWith('aria')) {
    if (newValue) {
      el.setAttribute(name.toLowerCase(), String(newValue));
    } else {
      el.removeAttribute(name.toLowerCase());
    }
    return;
  }

  if (name === 'data-*' || name.startsWith('data-')) {
    if (newValue) {
      el.setAttribute(name, String(newValue));
    } else {
      el.removeAttribute(name);
    }
    return;
  }

  if (isSvg && name !== 'className') {
    el.setAttribute(name, String(newValue));
  } else {
    (el as any)[name] = newValue;
  }
}

// Diff and patch algorithm
export function patch(
  parent: Node,
  oldVNode: VNode | null,
  newVNode: VNode | null,
  options: RenderOptions = {}
): void {
  if (oldVNode === newVNode) return;

  if (!oldVNode) {
    if (newVNode) {
      const el = createElement(newVNode, options);
      parent.appendChild(el);
    }
    return;
  }

  if (!newVNode) {
    if (oldVNode._dom) {
      parent.removeChild(oldVNode._dom);
    }
    cleanupVNode(oldVNode);
    return;
  }

  if (oldVNode.type !== newVNode.type) {
    const newEl = createElement(newVNode, options);
    parent.replaceChild(newEl, oldVNode._dom!);
    cleanupVNode(oldVNode);
    return;
  }

  if (typeof oldVNode.type === 'function') {
    // Component update
    if (newVNode._component) {
      newVNode._component.props = newVNode.props;
    }
    return;
  }

  // Element update
  const el = oldVNode._dom as Element;
  newVNode._dom = el;

  // Update props
  const isSvg = oldVNode.type === 'svg' || options.isSvg;
  applyProps(el, oldVNode.props, newVNode.props, isSvg);

  // Update children
  patchChildren(el, oldVNode, newVNode, { ...options, isSvg });

  // Update ref
  if (oldVNode.ref && oldVNode.ref !== newVNode.ref) {
    if (typeof oldVNode.ref === 'function') {
      oldVNode.ref(null);
    } else {
      (oldVNode.ref as Ref).current = null;
    }
  }
  if (newVNode.ref) {
    if (typeof newVNode.ref === 'function') {
      newVNode.ref(el);
    } else {
      (newVNode.ref as Ref).current = el;
    }
  }
}

function patchChildren(
  parent: Node,
  oldVNode: VNode,
  newVNode: VNode,
  options: RenderOptions
): void {
  const oldChildren = oldVNode.children;
  const newChildren = newVNode.children;

  // Simple case - same length
  if (oldChildren.length === newChildren.length) {
    for (let i = 0; i < oldChildren.length; i++) {
      patchChild(parent, oldChildren[i], newChildren[i], i, options);
    }
    return;
  }

  // Different lengths - use key-based diffing for better performance
  patchChildrenByKey(parent, oldChildren, newChildren, options);
}

function patchChild(
  parent: Node,
  oldChild: VNodeChild,
  newChild: VNodeChild,
  index: number,
  options: RenderOptions
): void {
  const oldVNode = isVNode(oldChild) ? oldChild : null;
  const newVNode = isVNode(newChild) ? newChild : null;

  if (oldVNode && newVNode) {
    patch(parent, oldVNode, newVNode, options);
  } else if (!oldVNode && newVNode) {
    const el = createElement(newVNode, options);
    if (parent.childNodes[index]) {
      parent.insertBefore(el, parent.childNodes[index]);
    } else {
      parent.appendChild(el);
    }
  } else if (oldVNode && !newVNode) {
    if (oldVNode._dom) {
      parent.removeChild(oldVNode._dom);
    }
    cleanupVNode(oldVNode);
  } else {
    // Text nodes
    const oldText = oldChild != null ? String(oldChild) : '';
    const newText = newChild != null ? String(newChild) : '';

    if (oldText !== newText) {
      if (parent.childNodes[index]) {
        parent.childNodes[index].textContent = newText;
      } else {
        parent.appendChild(document.createTextNode(newText));
      }
    }
  }
}

function patchChildrenByKey(
  parent: Node,
  oldChildren: VNodeChild[],
  newChildren: VNodeChild[],
  options: RenderOptions
): void {
  // Build key map for old children
  const oldKeyMap = new Map<string | number, { vnode: VNode; index: number }>();
  for (let i = 0; i < oldChildren.length; i++) {
    const child = oldChildren[i];
    if (isVNode(child) && child.key != null) {
      oldKeyMap.set(child.key, { vnode: child, index: i });
    }
  }

  let newChildIndex = 0;

  for (let i = 0; i < newChildren.length; i++) {
    const newChild = newChildren[i];

    if (isVNode(newChild) && newChild.key != null) {
      const old = oldKeyMap.get(newChild.key);
      if (old) {
        oldKeyMap.delete(old.index);
        patch(parent, old.vnode, newChild, options);
      } else {
        const el = createElement(newChild, options);
        if (parent.childNodes[newChildIndex]) {
          parent.insertBefore(el, parent.childNodes[newChildIndex]);
        } else {
          parent.appendChild(el);
        }
      }
    } else {
      patchChild(parent, oldChildren[newChildIndex] ?? null, newChild, newChildIndex, options);
    }

    newChildIndex++;
  }

  // Remove remaining old children
  for (const { vnode } of oldKeyMap.values()) {
    if (vnode._dom) {
      parent.removeChild(vnode._dom);
    }
    cleanupVNode(vnode);
  }

  // Remove extra DOM nodes
  while (parent.childNodes.length > newChildren.length) {
    parent.removeChild(parent.lastChild!);
  }
}

function cleanupVNode(vnode: VNode): void {
  if (vnode._component?.cleanup) {
    for (const cleanup of vnode._component.cleanup) {
      cleanup();
    }
  }

  if (vnode.ref) {
    if (typeof vnode.ref === 'function') {
      vnode.ref(null);
    } else {
      (vnode as any).ref.current = null;
    }
  }

  for (const child of vnode.children) {
    if (isVNode(child)) {
      cleanupVNode(child);
    }
  }
}

// Render to DOM
export function render(
  vnode: VNode | null,
  container: Element | ShadowRoot
): () => void {
  let oldVNode: VNode | null = null;

  // Initial render
  if (vnode) {
    const el = createElement(vnode);
    container.appendChild(el);
    oldVNode = vnode;
  }

  // Return update function
  return (newVNode?: VNode | null) => {
    batch(() => {
      patch(container, oldVNode, newVNode ?? null);
      oldVNode = newVNode ?? null;
    });
  };
}

// Portal - render to a different DOM node
export function Portal(props: {
  children: VNodeChild[];
  mount: Element;
}): VNode {
  const arr = Array.isArray(props.children) ? props.children : [props.children];
  return {
    type: null,
    props: {},
    children: arr as VNodeChild[]
  };
}
