// MoveJS website - small UI primitives used across pages

// Code block with copy button and header
export function Code(props: { lang?: string; filename?: string; children: string }) {
  const { lang = 'js', filename, children } = props;
  return (
    <div className="code">
      <div className="code-head">
        <span>{filename || lang}</span>
        <button type="button" className="copy">Copy</button>
      </div>
      <pre>
        <code className={`language-${lang}`}>{children}</code>
      </pre>
    </div>
  );
}

// Callout / admonition box
export function Callout(props: {
  type?: 'info' | 'warn' | 'tip';
  children: any;
}) {
  const icon = props.type === 'warn' ? '⚠️' : props.type === 'tip' ? '💡' : 'ℹ️';
  return (
    <div className={`callout ${props.type || 'info'}`}>
      <span className="ico" aria-hidden="true">{icon}</span>
      <div>{props.children}</div>
    </div>
  );
}