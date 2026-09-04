import { describe, it, expect } from 'vitest';
import { renderToString, renderToDocument, createElement } from '../src/index';

describe('renderToString', () => {
  it('renders a simple element', () => {
    const vnode = createElement('div', null, 'hello');
    expect(renderToString(vnode)).toBe('<div>hello</div>');
  });

  it('renders nested children', () => {
    const vnode = createElement(
      'div',
      null,
      createElement('h1', null, 'Title'),
      createElement('p', null, 'Body ', 42)
    );
    expect(renderToString(vnode)).toBe('<div><h1>Title</h1><p>Body 42</p></div>');
  });

  it('maps className to class', () => {
    const vnode = createElement('div', { className: 'foo bar' }, 'x');
    expect(renderToString(vnode)).toBe('<div class="foo bar">x</div>');
  });

  it('maps htmlFor to for', () => {
    const vnode = createElement('label', { htmlFor: 'name' }, 'Name');
    expect(renderToString(vnode)).toBe('<label for="name">Name</label>');
  });

  it('serializes style objects to CSS strings', () => {
    const vnode = createElement('div', { style: { display: 'flex', marginTop: '4px' } }, 'x');
    expect(renderToString(vnode)).toBe('<div style="display: flex; margin-top: 4px">x</div>');
  });

  it('renders boolean attributes', () => {
    const vnode = createElement('input', { type: 'checkbox', checked: true, disabled: false });
    expect(renderToString(vnode)).toBe('<input type="checkbox" checked />');
  });

  it('renders void elements without closing tags', () => {
    const vnode = createElement('div', null, createElement('br', null));
    expect(renderToString(vnode)).toBe('<div><br /></div>');
  });

  it('drops null/undefined/false children', () => {
    const vnode = createElement('div', null, 'a', null, 'b', false, 'c');
    expect(renderToString(vnode)).toBe('<div>abc</div>');
  });

  it('omits event handlers', () => {
    const vnode = createElement('button', { onClick: () => {}, id: 'b' }, 'Go');
    expect(renderToString(vnode)).toBe('<button id="b">Go</button>');
  });

  it('omits key and ref props', () => {
    const vnode = createElement('div', { key: 'x', ref: {}, id: 'y' }, 'z');
    expect(renderToString(vnode)).toBe('<div id="y">z</div>');
  });

  it('escapes HTML in text content', () => {
    const vnode = createElement('p', null, '<script>alert(1)</script> & "quoted"');
    expect(renderToString(vnode)).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quoted&quot;</p>'
    );
  });

  it('renders component functions', () => {
    const Greeter = ({ name }: { name: string }) => createElement('h1', null, `Hi ${name}`);
    expect(renderToString(Greeter, { name: 'Ada' })).toBe('<h1>Hi Ada</h1>');
  });

  it('renders nested components', () => {
    const Label = ({ text }: { text: string }) => createElement('span', null, text);
    const Card = () =>
      createElement('div', { className: 'card' }, createElement(Label, { text: 'Card!' }));
    expect(renderToString(Card)).toBe('<div class="card"><span>Card!</span></div>');
  });

  it('renders fragments', () => {
    const vnode = createElement(null, null, createElement('a', null, '1'), createElement('b', null, '2'));
    expect(renderToString(vnode)).toBe('<a>1</a><b>2</b>');
  });

  it('renders an element with no children', () => {
    const vnode = createElement('div', {});
    expect(renderToString(vnode)).toBe('<div></div>');
  });

  it('returns empty string for null', () => {
    expect(renderToString(null)).toBe('');
  });
});

describe('renderToDocument', () => {
  it('wraps body in a full document', () => {
    const doc = renderToDocument('<h1>Hello</h1>', { title: 'My Page' });
    expect(doc).toContain('<!DOCTYPE html>');
    expect(doc).toContain('<html lang="en">');
    expect(doc).toContain('<title>My Page</title>');
    expect(doc).toContain('<body><h1>Hello</h1></body>');
  });

  it('renders meta tags', () => {
    const doc = renderToDocument('', {
      meta: [{ name: 'description', content: 'desc' }]
    });
    expect(doc).toContain('<meta name="description" content="desc" />');
  });

  it('renders link tags', () => {
    const doc = renderToDocument('', {
      links: [{ rel: 'stylesheet', href: '/app.css' }]
    });
    expect(doc).toContain('<link rel="stylesheet" href="/app.css" />');
  });

  it('renders inline and external scripts', () => {
    const doc = renderToDocument('', {
      scripts: [{ content: 'window.x = 1;' }, { src: '/app.js' }]
    });
    expect(doc).toContain('<script>window.x = 1;</script>');
    expect(doc).toContain('<script src="/app.js"></script>');
  });
});
