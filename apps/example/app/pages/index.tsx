import { createSignal, createEffect, batch } from '@movejs/core';
import { Button, Card, CardBody, CardHeader, Input, Alert, toast } from '@movejs/ui';

export const config = {
  render: 'ssr',
  seo: {
    title: 'MoveJS Example App',
    description: 'A demonstration of the MoveJS full-stack framework',
    ogImage: '/logo.png',
    schema: 'WebSite'
  }
};

// Example counter component using signals
function Counter() {
  const [count, setCount] = createSignal(0);
  const double = () => count() * 2;

  createEffect(() => {
    console.log(`Count changed to: ${count()}`);
  });

  return (
    <div className="counter">
      <h2>Signal-based Counter</h2>
      <p>Count: {count()}</p>
      <p>Double: {double()}</p>
      <Flex gap="0.5rem">
        <Button onClick={() => setCount(c => c - 1)} variant="secondary">-</Button>
        <Button onClick={() => setCount(c => c + 1)} variant="primary">+</Button>
        <Button onClick={() => batch(() => {
          setCount(c => c + 10);
          setCount(c => c * 2);
        })}>Batch</Button>
        <Button onClick={() => toast.success('Count updated!')}>Toast</Button>
      </Flex>
    </div>
  );
}

// Form example
function ContactForm() {
  const [name, setName] = createSignal('');

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    toast.info(`Form submitted with name: ${name()}`);
  };

  return (
    <Card>
      <CardHeader>Contact Form</CardHeader>
      <CardBody>
        <Input
          label="Name"
          name="name"
          placeholder="Enter your name"
          required
          hint="This is a required field"
          value={name()}
          onChange={(e) => setName((e.target as HTMLInputElement).value)}
        />
        <Button onClick={handleSubmit} type="button">Submit</Button>
      </CardBody>
    </Card>
  );
}

// Main page
export default function IndexPage() {
  return (
    <main>
      <Alert variant="info" title="Welcome to MoveJS">
        A fast, secure, full-stack JavaScript framework
      </Alert>
      
      <Counter />
      <ContactForm />

      <div className="features">
        <h2>What can you build with MoveJS?</h2>
        <ul>
          <li>⚡ Blazing fast with signal-based reactivity</li>
          <li>🔍 SEO optimized out of the box</li>
          <li>🧠 AI-powered features</li>
          <li>🗄️ Built-in database management</li>
          <li>🔐 Secure authentication</li>
          <li>♿ Accessible by default</li>
        </ul>
      </div>
    </main>
  );
}

function Flex(props: { children: any; gap?: string }) {
  return {
    type: 'div',
    props: { style: { display: 'flex', gap: props.gap || '0.5rem', marginTop: '0.5rem' } },
    children: [props.children]
  };
}
