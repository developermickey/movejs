// MoveJS website - Signals & Reactivity guide

import LearnLayout from '../components/LearnLayout';
import { Code, Callout } from '../components/ui';

export const config = {
  render: 'ssg',
  revalidate: 300,
  seo: {
    title: 'Signals & Reactivity - MoveJS Documentation',
    description: 'Signal-based state management in MoveJS with createSignal, createComputed, createEffect and batch updates.',
    ogType: 'article',
    ogImage: '/logo.svg',
    schema: 'TechArticle',
    canonical: '/learn/signals',
    themeColor: '#0b0f1a'
  },
  headLinks: [
    { rel: 'stylesheet', href: '/styles.css' },
    { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
    { rel: 'apple-touch-icon', href: '/logo.svg' }
  ],
  headScripts: [
    { src: '/app.js' }
  ]
};

export default function Signals() {
  return (
    <LearnLayout slug="signals">
      <h1>Signals &amp; Reactivity</h1>
      <p className="doc-lede">
        MoveJS state is built on <em>signals</em> — observable values that automatically track
        where they are used. When a signal changes, only the parts of the UI that depend on it
        update. No Virtual DOM diffing, no reconciliation.
      </p>

      <h2>Why signals?</h2>
      <p>
        A signal is a value wrapped in getter/setter functions. Reading a signal inside a
        component or effect subscribes you to it; writing it notifies subscribers. Because
        subscription happens at the point of access, updates are surgical:
      </p>
      <ul>
        <li><strong>Granular</strong> — only dependent components re-render</li>
        <li><strong>Predictable</strong> — no stale closures, no dependency arrays</li>
        <li><strong>Fast</strong> — a direct path from change to DOM update</li>
      </ul>

      <h2>createSignal</h2>
      <Code lang="tsx" filename="counter.tsx">{`import { createSignal } from '@movejs/core';

function Counter() {
  const [count, setCount] = createSignal(0);

  return (
    <button onClick={() => setCount(count() + 1)}>
      Clicked {count()} times
    </button>
  );
}`}</Code>
      <p>
        <code>createSignal</code> returns a tuple: <code>[getter, setter]</code>. Call the getter
        (with no arguments) to read, the setter (with a value or updater function) to write.
      </p>

      <h2>createComputed</h2>
      <p>
        Derived values are memoized and recompute only when their inputs change:
      </p>
      <Code lang="tsx" filename="derived.tsx">{`import { createSignal, createComputed } from '@movejs/core';

const [items, setItems] = createSignal<number[]>([]);

const total = createComputed(() =>
  items().reduce((sum, n) => sum + n, 0)
);

// total() is cached until items changes
<p>Total: {total()}</p>`}</Code>

      <h2>createEffect</h2>
      <p>
        Effects run a function whenever any signal read inside them changes. This is how side
        effects — logging, syncing, refs — stay in sync with state:
      </p>
      <Code lang="tsx" filename="effect.tsx">{`import { createSignal, createEffect } from '@movejs/core';

const [name, setName] = createSignal('Ada');

createEffect(() => {
  console.log('Name is', name());
});

setName('Grace');   // → logs "Name is Grace"`}</Code>

      <Callout type="info">
        The underlying signal optimizes effect delivery: notifications are collected and flushed
        in a batch, so writing ten signals inside one handler causes exactly one round of updates.
      </Callout>

      <h2>Batched updates</h2>
      <p>
        Wrap multiple writes in <code>batch</code> to defer notifications until the end:
      </p>
      <Code lang="tsx" filename="batch.tsx">{`import { createSignal, batch } from '@movejs/core';

const [a, setA] = createSignal(0);
const [b, setB] = createSignal(0);

batch(() => {
  setA(1);
  setB(2);
  // effects run once, after this block
});`}</Code>

      <h2>Untracked reads</h2>
      <p>
        Use <code>untrack</code> to read a signal without subscribing to it:
      </p>
      <Code lang="tsx" filename="untrack.tsx">{`import { createSignal, createEffect, untrack } from '@movejs/core';

const [open, setOpen] = createSignal(false);
const [unread, setUnread] = createSignal(3);

createEffect(() => {
  if (open()) {
    console.log('Unread:', untrack(() => unread()));
  }
});
// unread() changes no longer re-run this effect`}</Code>

      <h2>Lifecycle: onMount</h2>
      <p>
        Run one-time setup when a component mounts:
      </p>
      <Code lang="tsx" filename="onmount.tsx">{`import { onMount } from '@movejs/core';

function Profile() {
  onMount(() => {
    // fetch initial data, focus an input, etc.
  });

  return <section>…</section>;
}`}</Code>

      <h2>Store</h2>
      <p>
        For deeply nested state, <code>createStore</code> gives you a mutable store with
        signal-like reactivity — ideal for forms and large objects.
      </p>
      <Callout type="warning">
        Signals are for state your UI depends on. For plain module-level data used across the
        server (data loaded in loaders), use normal variables or the ORM directly.
      </Callout>
    </LearnLayout>
  );
}