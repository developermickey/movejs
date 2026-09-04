export type VNodeChild = VNode | string | number | boolean | null | undefined;

export interface VNode {
  type: string | Component | null;
  props: Record<string, any>;
  children: VNodeChild[];
  key?: string | number;
  ref?: Ref | ((el: any) => void);
  _dom?: Node | null;
  _component?: ComponentInstance | null;
  _pending?: boolean;
}

export interface Ref<T = any> {
  current: T | null;
}

export type Component<P = {}> = (props: P) => VNode | null;

export interface ComponentInstance {
  props: Record<string, any>;
  mounted: boolean;
  cleanup: (() => void)[];
}

// JSX factory
export function createElement(
  type: string | Component | null,
  props: Record<string, any> | null,
  ...children: VNodeChild[]
): VNode {
  const flatChildren = flattenChildren(children);

  const key = props?.key ?? undefined;
  const ref = props?.ref ?? undefined;

  const newProps: Record<string, any> = {};
  for (const [k, v] of Object.entries(props || {})) {
    if (k !== 'key' && k !== 'ref') {
      newProps[k] = v;
    }
  }

  return {
    type,
    props: newProps,
    children: flatChildren,
    key,
    ref
  };
}

function flattenChildren(children: VNodeChild[]): VNodeChild[] {
  const result: VNodeChild[] = [];

  for (const child of children) {
    if (Array.isArray(child)) {
      result.push(...flattenChildren(child));
    } else if (child != null && child !== false) {
      result.push(child);
    }
  }

  return result;
}

export function createText(text: string | number): VNode {
  return {
    type: null,
    props: {},
    children: [String(text)]
  };
}

export function Fragment(props: { children: VNodeChild[] }): VNode {
  return createElement(null, null, ...props.children);
}

// Virtual DOM utilities
export function isVNode(value: any): value is VNode {
  return value && typeof value === 'object' && 'type' in value && 'props' in value;
}

export function isVNodeChild(value: any): value is VNodeChild {
  return isVNode(value) || typeof value === 'string' || typeof value === 'number';
}

export function cloneVNode(vnode: VNode, props: Record<string, any>): VNode {
  return {
    ...vnode,
    props: { ...vnode.props, ...props }
  };
}

export function equalsVNode(a: VNode | null, b: VNode | null): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.type !== b.type) return false;
  if (a.key !== b.key) return false;

  const aProps = a.props;
  const bProps = b.props;
  const aKeys = Object.keys(aProps);
  const bKeys = Object.keys(bProps);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (aProps[key] !== bProps[key]) return false;
  }

  if (a.children.length !== b.children.length) return false;

  for (let i = 0; i < a.children.length; i++) {
    const ac = a.children[i];
    const bc = b.children[i];

    if (isVNode(ac) && isVNode(bc)) {
      if (!equalsVNode(ac, bc)) return false;
    } else if (ac !== bc) {
      return false;
    }
  }

  return true;
}
