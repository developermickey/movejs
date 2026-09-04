import { describe, it, expect } from 'vitest';
import {
  createSignal,
  createEffect,
  createComputed,
  batch,
  untrack
} from '../src/index';

describe('createSignal', () => {
  it('returns a [getter, setter] tuple', () => {
    const [get, set] = createSignal(10);
    expect(typeof get).toBe('function');
    expect(typeof set).toBe('function');
    expect(get()).toBe(10);
  });

  it('updates and reads values', () => {
    const [get, set] = createSignal(0);
    set(5);
    expect(get()).toBe(5);
    set(42);
    expect(get()).toBe(42);
  });

  it('supports functional updates', () => {
    const [get, set] = createSignal(1);
    set((prev) => prev + 2);
    expect(get()).toBe(3);
  });

  it('does not notify on identical values by default', () => {
    const [get, set] = createSignal(1);
    let calls = 0;
    createEffect(() => {
      void get();
      calls++;
    });
    expect(calls).toBe(1);
    set(1); // same value
    // effect only runs once because equality skips notify
    expect(calls).toBe(1);
    set(2);
    expect(calls).toBe(2);
  });

  it('respects a custom equals function', () => {
    const records = [{ id: 1 }, { id: 1 }];
    const [get, set] = createSignal(records[0], {
      equals: (a, b) => a.id === b.id
    });
    expect(get()).toBe(records[0]);
    set(records[1]);
    expect(get()).toBe(records[0]); // unchanged reference due to equal id
  });
});

describe('createComputed', () => {
  it('recomputes lazily when dependencies change', () => {
    const [count, setCount] = createSignal(1);
    let recomputes = 0;
    const double = createComputed(() => {
      recomputes++;
      return count() * 2;
    });
    expect(recomputes).toBe(0); // lazy: not computed until read
    expect(double()).toBe(2);
    expect(recomputes).toBe(1);
    setCount(3);
    expect(double()).toBe(6);
    expect(recomputes).toBe(2);
  });
});

describe('createEffect', () => {
  it('runs immediately and on dependency change', () => {
    const [count, setCount] = createSignal(0);
    const log: number[] = [];
    createEffect(() => {
      log.push(count());
    });
    expect(log).toEqual([0]);
    setCount(1);
    expect(log).toEqual([0, 1]);
    setCount(2);
    expect(log).toEqual([0, 1, 2]);
  });

  it('runs cleanup functions before re-running', () => {
    const [count, setCount] = createSignal(0);
    const events: string[] = [];
    createEffect(() => {
      count();
      events.push('run');
      return () => events.push('cleanup');
    });
    expect(events).toEqual(['run']);
    setCount(1);
    expect(events).toEqual(['run', 'cleanup', 'run']);
  });

  it('returns a dispose function that stops the effect', () => {
    const [count, setCount] = createSignal(0);
    const log: number[] = [];
    const dispose = createEffect(() => {
      log.push(count());
    });
    dispose();
    setCount(5);
    expect(log).toEqual([0]);
  });

  it('does not track reads inside untrack()', () => {
    const [count, setCount] = createSignal(0);
    let readValue = -1;
    createEffect(() => {
      // the only read is inside untrack, so it should not create a dependency
      void untrack(() => {
        readValue = count();
      });
    });
    expect(readValue).toBe(0); // effect ran once
    setCount(5);
    expect(readValue).toBe(0); // effect did NOT re-run (untracked read)
  });
});

describe('batch', () => {
  it('defers effect runs until the batch completes', () => {
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);
    const log: number[] = [];
    createEffect(() => {
      log.push(`${a()}-${b()}`);
    });
    expect(log).toEqual(['0-0']);

    batch(() => {
      setA(1);
      setB(1);
    });
    // only one effect run with both values applied
    expect(log).toEqual(['0-0', '1-1']);
  });

  it('supports nested batches', () => {
    const [a, setA] = createSignal(0);
    const log: number[] = [];
    createEffect(() => {
      log.push(a());
    });
    batch(() => {
      setA(1);
      batch(() => setA(2));
      setA(3);
    });
    expect(log).toEqual([0, 3]);
  });
});
