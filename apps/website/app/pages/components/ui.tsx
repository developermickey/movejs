// MoveJS website - small UI primitives used across pages

// Lightweight syntax highlighting (renders server-side into span tokens).
// Only code languages get colored; the rest render as plain text.

const RULES: Array<[RegExp, string]> = [
  [/\/\/[^\n]*|\/\*[\s\S]*?\*\//, 'c'],
  [/(["'`])(?:\\.|(?!\1)[^\\])*\1/, 's'],
  [/\b(import|export|default|const|let|var|function|return|if|else|for|while|switch|case|break|continue|new|class|extends|async|await|from|typeof|in|of|true|false|null|undefined|drizzle|pg)\b/, 'k'],
  [/\b\d+(?:\.\d+)?\b/, 'n'],
  [/[A-Za-z_$][\w$]*(?=\s*\()/, 'fn']
];

export function Code(props: { lang?: string; filename?: string; children: string }) {
  const { lang = 'js', filename, children } = props;
  const colorized = ['ts', 'tsx', 'js', 'jsx'].indexOf(lang) >= 0;
  return (
    <div className="code">
      <div className="code-head">
        <span className="code-name">{filename || lang}</span>
        <button type="button" className="copy" aria-label={`Copy ${filename || lang} code`}>Copy</button>
      </div>
      <pre>
        <code className={`language-${lang}`}>
          {colorized ? tokenize(children) : children}
        </code>
      </pre>
    </div>
  );
}

// Split source into plain-string / span elements for highlighting.
// RULES order is the precedence: comments > strings > keywords > numbers > calls.
function tokenize(code: string) {
  const out: any[] = [];
  let rest = code;
  while (rest.length > 0) {
    let consumed = false;
    for (const [regex, cls] of RULES) {
      regex.lastIndex = 0;
      const m = regex.exec(rest);
      if (m && m.index === 0) {
        out.push(<span className={cls}>{m[0]}</span>);
        rest = rest.slice(m[0].length);
        consumed = true;
        break;
      }
    }
    if (consumed) continue;
    const next = findNext(rest);
    if (next <= 0) {
      out.push(rest);
      rest = '';
    } else {
      out.push(rest.slice(0, next));
      rest = rest.slice(next);
    }
  }
  return out;
}

// Position of the next token any rule matches (or 0 when none found)
function findNext(code: string): number {
  let min = -1;
  for (const [regex] of RULES) {
    regex.lastIndex = 0;
    const m = regex.exec(code);
    if (m && (min === -1 || m.index < min)) min = m.index;
  }
  return min === -1 ? 0 : min;
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