export type SignalOptions<T> = {
  equals?: boolean | ((prev: T, next: T) => boolean);
  debugName?: string;
};

export type EffectOptions = {
  deferred?: boolean;
  debugName?: string;
};

type CleanupFn = () => void;

// Global tracking context
let currentEffect: Effect | null = null;
let currentComputed: Computed<any> | null = null;
const effectStack: (Effect | Computed<any>)[] = [];

// Batch update tracking
let batchDepth = 0;
let pendingEffects: Set<Effect> = new Set();
let pendingRecompute: Set<Computed<any>> = new Set();

export class Signal<T> {
  private _value: T;
  private _subscribers: Set<any>;
  private _equals: boolean | ((prev: T, next: T) => boolean);
  private _debugName?: string;

  constructor(value: T, options?: SignalOptions<T>) {
    this._value = value;
    this._subscribers = new Set();
    this._equals = options?.equals ?? true;
    this._debugName = options?.debugName;
  }

  get value(): T {
    if (currentEffect) {
      this._track(currentEffect);
    }
    if (currentComputed) {
      this._track(currentComputed);
    }
    return this._value;
  }

  set value(newValue: T) {
    if (this._equals) {
      const isEqual =
        typeof this._equals === 'function'
          ? this._equals(this._value, newValue)
          : Object.is(this._value, newValue);
      if (isEqual) return;
    }

    this._value = newValue;
    this._notify();
  }

  update(fn: (prev: T) => T): void {
    this.value = fn(this._value);
  }

  peek(): T {
    return this._value;
  }

  private _track(dep: any): void {
    dep._addDependency(this);
    this._subscribers.add(dep);
  }

  private _notify(): void {
    // Snapshot subscribers: effects re-subscribe during execution, and
    // mutating a Set while iterating it visits newly added entries (infinite loop).
    for (const sub of Array.from(this._subscribers)) {
      if (batchDepth > 0) {
        if (sub instanceof Effect) {
          pendingEffects.add(sub);
        } else {
          pendingRecompute.add(sub);
        }
      } else {
        sub._notify();
      }
    }
  }

  subscribe(effect: any): CleanupFn {
    this._subscribers.add(effect);
    return () => {
      this._subscribers.delete(effect);
    };
  }

  unsubscribe(effect: any): void {
    this._subscribers.delete(effect);
  }

  [Symbol.iterator]() {
    let done = false;
    return {
      next: () => {
        if (done) return { done: true, value: undefined };
        done = true;
        return { done: false, value: this.value };
      },
      return: () => {
        done = true;
        return { done: true, value: undefined };
      },
      [Symbol.iterator]() {
        return this;
      }
    };
  }
}

export class Computed<T> {
  private _fn: () => T;
  private _value: T | undefined;
  private _dirty: boolean = true;
  private _subscribers: Set<any>;
  private _dependencies: Set<Signal<any>>;
  private _debugName?: string;

  constructor(fn: () => T, options?: { debugName?: string }) {
    this._fn = fn;
    this._subscribers = new Set();
    this._dependencies = new Set();
    this._debugName = options?.debugName;
  }

  get value(): T {
    if (this._dirty) {
      this._recompute();
    }

    if (currentEffect) {
      this._track(currentEffect);
    }
    if (currentComputed && currentComputed !== this) {
      this._track(currentComputed);
    }

    return this._value!;
  }

  peek(): T {
    if (this._dirty) {
      this._recompute();
    }
    return this._value!;
  }

  private _recompute(): void {
    const prevComputed = currentComputed;
    currentComputed = this;

    // Unsubscribe from old dependencies
    for (const dep of this._dependencies) {
      dep.unsubscribe(this);
    }
    this._dependencies.clear();

    try {
      this._value = this._fn();
      this._dirty = false;
    } finally {
      currentComputed = prevComputed;
    }
  }

  private _track(dep: any): void {
    dep._addDependency(this);
    this._subscribers.add(dep);
  }

  _addDependency(dep: any): void {
    this._dependencies.add(dep);
  }

  _notify(): void {
    this._dirty = true;
    for (const sub of Array.from(this._subscribers)) {
      if (sub instanceof Effect) {
        if (batchDepth > 0) {
          pendingEffects.add(sub);
        } else {
          sub._notify();
        }
      } else if (sub instanceof Computed) {
        sub._notify();
      }
    }
  }

  subscribe(effect: Effect): CleanupFn {
    this._subscribers.add(effect);
    return () => {
      this._subscribers.delete(effect);
    };
  }

  unsubscribe(effect: any): void {
    this._subscribers.delete(effect);
  }
}

export class Effect {
  private _fn: () => void | CleanupFn;
  private _cleanup: CleanupFn | null = null;
  private _dependencies: Set<Signal<any> | Computed<any>>;
  private _active: boolean = true;
  private _deferred: boolean;
  private _debugName?: string;

  constructor(fn: () => void | CleanupFn, options?: EffectOptions) {
    this._fn = fn;
    this._dependencies = new Set();
    this._deferred = options?.deferred ?? false;
    this._debugName = options?.debugName;

    this._execute();
  }

  private _execute(): void {
    if (!this._active) return;

    const prevEffect = currentEffect;
    currentEffect = this;

    // Cleanup previous effect
    this._cleanup?.();

    // Unsubscribe from old dependencies
    for (const dep of this._dependencies) {
      dep.unsubscribe(this);
    }
    this._dependencies.clear();

    try {
      const cleanup = this._fn();
      if (typeof cleanup === 'function') {
        this._cleanup = cleanup;
      }
    } finally {
      currentEffect = prevEffect;
    }
  }

  _addDependency(dep: Signal<any> | Computed<any>): void {
    this._dependencies.add(dep);
  }

  _notify(): void {
    if (!this._active) return;
    if (this._deferred) {
      pendingEffects.add(this);
      scheduleFlush();
    } else {
      this._execute();
    }
  }

  dispose(): void {
    this._active = false;
    this._cleanup?.();
    for (const dep of this._dependencies) {
      dep.unsubscribe(this);
    }
    this._dependencies.clear();
  }

  pause(): void {
    this._active = false;
  }

  resume(): void {
    if (!this._active) {
      this._active = true;
      this._execute();
    }
  }
}

interface Dependency {
  _addDependency(effect: any): void;
  unsubscribe(effect: any): void;
  _notify(): void;
}

// Batch updates
export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      flushPending();
    }
  }
}

function flushPending(): void {
  // First recompute all computed values
  for (const computed of pendingRecompute) {
    computed._notify();
  }
  pendingRecompute.clear();

  // Then run all effects
  for (const effect of pendingEffects) {
    effect._notify();
  }
  pendingEffects.clear();
}

function scheduleFlush(): void {
  if (batchDepth === 0) {
    queueMicrotask(flushPending);
  }
}

// Convenience functions
export function createSignal<T>(
  value: T,
  options?: SignalOptions<T>
): [() => T, (value: T | ((prev: T) => T)) => void] {
  const signal = new Signal<T>(value, options);

  const getter = () => signal.value;
  const setter = (newValue: T | ((prev: T) => T)) => {
    if (typeof newValue === 'function') {
      signal.update(newValue as (prev: T) => T);
    } else {
      signal.value = newValue;
    }
  };

  return [getter, setter];
}

export function createComputed<T>(
  fn: () => T,
  options?: { debugName?: string }
): () => T {
  const computed = new Computed<T>(fn, options);
  return () => computed.value;
}

export function createEffect(
  fn: () => void | CleanupFn,
  options?: EffectOptions
): () => void {
  const effect = new Effect(fn, options);
  return () => effect.dispose();
}

export function untrack<T>(fn: () => T): T {
  const prevEffect = currentEffect;
  const prevComputed = currentComputed;
  currentEffect = null;
  currentComputed = null;

  try {
    return fn();
  } finally {
    currentEffect = prevEffect;
    currentComputed = prevComputed;
  }
}

export function on<T>(
  source: Signal<T> | Computed<T>,
  fn: (value: T) => void | CleanupFn,
  options?: { defer?: boolean }
): () => void {
  return createEffect(() => {
    const value = source.value;
    if (options?.defer) {
      return undefined;
    }
    return fn(value);
  });
}

export function onMount(fn: () => void | CleanupFn): void {
  createEffect(fn, { deferred: true });
}

export function onError(fn: (error: Error) => void): () => void {
  // Error boundary implementation
  const dispose = createEffect(() => {
    try {
      // This will be called when errors occur in child effects
    } catch (error) {
      fn(error as Error);
    }
  });
  return dispose;
}

// Store - reactive object
export type Store<T> = {
  [K in keyof T]: T[K] extends object ? Store<T[K]> : T[K];
};

export function createStore<T extends object>(initial: T): Store<T> {
  const signals = new Map<string, Signal<any>>();

  const createProxy = (obj: any, path: string[] = []): any => {
    return new Proxy(obj, {
      get(target, prop) {
        if (typeof prop === 'symbol') return target[prop];

        const fullPath = [...path, prop as string].join('.');

        if (typeof target[prop] === 'object' && target[prop] !== null) {
          return createProxy(target[prop], [...path, prop as string]);
        }

        if (!signals.has(fullPath)) {
          signals.set(fullPath, new Signal(target[prop]));
        }

        return signals.get(fullPath)!.value;
      },
      set(target, prop, newValue) {
        if (typeof prop === 'symbol') {
          target[prop] = newValue;
          return true;
        }

        const fullPath = [...path, prop as string].join('.');
        const oldValue = target[prop];

        target[prop] = newValue;

        if (signals.has(fullPath)) {
          signals.get(fullPath)!.value = newValue;
        }

        return true;
      }
    });
  };

  return createProxy(initial);
}
