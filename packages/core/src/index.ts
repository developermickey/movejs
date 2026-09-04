// MoveJS Core - The reactive UI framework
// Signals-based reactivity with compiled optimizations

// Reactive System
export {
  Signal,
  Computed,
  Effect,
  createSignal,
  createComputed,
  createEffect,
  createStore,
  batch,
  untrack,
  on,
  onMount,
  onError
} from './reactive/signals';

export type { SignalOptions, EffectOptions, Store } from './reactive/signals';

// Virtual DOM
export {
  createElement,
  render,
  patch,
  applyProps,
  Portal
} from './dom/renderer';

export {
  Fragment,
  isVNode,
  createText,
  cloneVNode,
  equalsVNode
} from './dom/vnode';

export type { VNode, VNodeChild, Component, Ref, ComponentInstance } from './dom/vnode';

// JSX Runtime
export { jsx, jsxs, jsxDEV, Fragment as FragmentComponent } from './jsx/jsx-runtime';

// Version
export const VERSION = '0.1.0';
