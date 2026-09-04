import type { A11yRule, A11yViolation } from '../types';

// Built-in accessibility rules
export const builtInRules: A11yRule[] = [
  {
    id: 'img-alt',
    title: 'Images must have alt text',
    description: 'All <img> elements must have an alt attribute that describes the image',
    severity: 'error',
    check: (node: any) => {
      if (node.tagName?.toLowerCase() === 'img' && !node.hasAttribute?.('alt')) {
        return {
          ruleId: 'img-alt',
          message: 'Image is missing alt attribute',
          severity: 'error',
          element: 'img',
          attribute: 'alt',
          fixable: true
        };
      }
      return null;
    },
    fix: (node: any) => {
      node.setAttribute?.('alt', '');
      if (node.hasAttribute?.('role') && node.getAttribute('role') === 'presentation') {
        node.setAttribute('alt', '');
        node.setAttribute('aria-hidden', 'true');
      }
    }
  },
  {
    id: 'heading-level',
    title: 'Headings must not skip levels',
    description: 'Heading levels should increase by one at a time',
    severity: 'warning',
    check: (node: any) => {
      const level = parseInt(node.tagName?.match(/^h(\d)$/i)?.[1] || '0', 10);
      if (level > 1 && !node.parentElement) {
        // Check if previous heading skips a level
        const prevHeading = findPreviousHeading(node);
        if (prevHeading && level - prevHeading.level > 1) {
          return {
            ruleId: 'heading-level',
            message: `Heading level jumps from h${prevHeading.level} to h${level}`,
            severity: 'warning',
            element: node.tagName,
            fixable: false
          };
        }
      }
      return null;
    }
  },
  {
    id: 'aria-role',
    title: 'Valid ARIA roles',
    description: 'ARIA roles must be valid and appropriate for the element',
    severity: 'error',
    check: (node: any) => {
      const role = node.getAttribute?.('role');
      if (role) {
        const validRoles = [
          'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
          'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
          'contentinfo', 'definition', 'dialog', 'directory', 'document',
          'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
          'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
          'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
          'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
          'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
          'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 'slider',
          'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
          'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
          'treeitem'
        ];
        
        if (!validRoles.includes(role)) {
          return {
            ruleId: 'aria-role',
            message: `Invalid ARIA role: "${role}"`,
            severity: 'error',
            element: node.tagName,
            attribute: 'role',
            fixable: false
          };
        }
      }
      return null;
    }
  },
  {
    id: 'button-name',
    title: 'Buttons must have accessible names',
    description: 'Buttons must have text content, aria-label, or title',
    severity: 'error',
    check: (node: any) => {
      if (node.tagName?.toLowerCase() === 'button') {
        const text = (node.textContent || '').trim();
        const ariaLabel = node.getAttribute?.('aria-label');
        const title = node.getAttribute?.('title');
        
        if (!text && !ariaLabel && !title) {
          return {
            ruleId: 'button-name',
            message: 'Button does not have an accessible name',
            severity: 'error',
            element: 'button',
            fixable: true
          };
        }
      }
      return null;
    }
  },
  {
    id: 'link-name',
    title: 'Links must have accessible names',
    description: 'Links must have discernible text content',
    severity: 'error',
    check: (node: any) => {
      if (node.tagName?.toLowerCase() === 'a' && node.hasAttribute?.('href')) {
        const text = (node.textContent || '').trim();
        const ariaLabel = node.getAttribute?.('aria-label');
        
        if (!text && !ariaLabel) {
          return {
            ruleId: 'link-name',
            message: 'Link does not have an accessible name',
            severity: 'error',
            element: 'a',
            fixable: true
          };
        }
      }
      return null;
    }
  },
  {
    id: 'label',
    title: 'Form inputs must have labels',
    description: 'All form controls must have an associated label',
    severity: 'error',
    check: (node: any) => {
      const tag = node.tagName?.toLowerCase();
      const formTags = ['input', 'select', 'textarea'];
      
      if (formTags.includes(tag) && node.type !== 'hidden') {
        const id = node.getAttribute?.('id');
        const ariaLabel = node.getAttribute?.('aria-label');
        const ariaLabelledby = node.getAttribute?.('aria-labelledby');
        const hasIdLabel = id && node.ownerDocument?.querySelector(`label[for="${id}"]`);
        
        if (!ariaLabel && !ariaLabelledby && !hasIdLabel && tag !== 'input') {
          return {
            ruleId: 'label',
            message: `<${tag}> is missing an associated label`,
            severity: 'error',
            element: tag,
            fixable: true
          };
        }
      }
      return null;
    }
  },
  {
    id: 'color-contrast',
    title: 'Sufficient color contrast',
    description: 'Text must have high enough contrast against background',
    severity: 'warning',
    check: (node: any) => {
      const textNodes = getTextContent(node);
      if (textNodes.trim().length === 0) return null;

      const color = getComputedColor(node, 'color');
      const bg = getComputedColor(node, 'background-color');
      
      if (color && bg) {
        const contrast = calculateContrast(color, bg);
        if (contrast < 4.5) {
          return {
            ruleId: 'color-contrast',
            message: `Text has insufficient contrast (${contrast.toFixed(2)}:1, minimum 4.5:1)`,
            severity: 'warning',
            element: node.tagName,
            fixable: false
          };
        }
      }
      return null;
    }
  },
  {
    id: 'focus-visible',
    title: 'Focus must be visible',
    description: 'Interactive elements must have a visible focus indicator',
    severity: 'warning',
    check: (node: any) => {
      const tag = node.tagName?.toLowerCase();
      const interactiveTags = ['a', 'button', 'input', 'select', 'textarea', '[tabindex]'];
      
      if (interactiveTags.includes(tag) && !node.getAttribute?.('tabindex')) {
        const style = node.getAttribute?.('style') || '';
        if (style.includes('outline: none') || style.includes('outline: 0')) {
          return {
            ruleId: 'focus-visible',
            message: 'Element has no visible focus indicator',
            severity: 'warning',
            element: tag,
            fixable: true
          };
        }
      }
      return null;
    }
  },
  {
    id: 'keyboard-handler',
    title: 'Interactive elements need keyboard handlers',
    description: 'Click handlers must have keyboard equivalents',
    severity: 'error',
    check: (node: any) => {
      const onclick = node.getAttribute?.('onclick') || node.onclick;
      const onKeyDown = node.getAttribute?.('onkeydown') || node.onkeydown;
      const tag = node.tagName?.toLowerCase();
      
      if (onclick && !onKeyDown && !['a', 'button', 'input'].includes(tag)) {
        return {
          ruleId: 'keyboard-handler',
          message: 'Click handler must have keyboard event handler',
          severity: 'error',
          element: tag,
          fixable: true
        };
      }
      return null;
    }
  },
  {
    id: 'list-structure',
    title: 'Proper list structure',
    description: 'List items must be direct children of list elements',
    severity: 'error',
    check: (node: any) => {
      const tag = node.tagName?.toLowerCase();
      
      if (tag === 'li') {
        const parent = node.parentElement;
        if (!parent || !['ul', 'ol', 'menu'].includes(parent.tagName?.toLowerCase())) {
          return {
            ruleId: 'list-structure',
            message: '<li> must be a direct child of <ul> or <ol>',
            severity: 'error',
            element: 'li',
            fixable: false
          };
        }
      }
      return null;
    }
  },
  {
    id: 'landmark',
    title: 'Use landmark regions',
    description: 'Pages should use semantic HTML landmarks',
    severity: 'warning',
    check: (node: any) => {
      // Check if page has main landmark (on body)
      if (node.tagName?.toLowerCase() === 'body') {
        const hasMain = node.querySelector?.('main, [role="main"]');
        if (!hasMain) {
          return {
            ruleId: 'landmark',
            message: 'Page does not have a main landmark',
            severity: 'warning',
            element: 'body',
            fixable: false
          };
        }
      }
      return null;
    }
  },
  {
    id: 'svg-svg-alt',
    title: 'SVGs with <title>',
    description: 'Decorative SVGs should be hidden, informative SVGs need titles',
    severity: 'warning',
    check: (node: any) => {
      const tag = node.tagName?.toLowerCase();
      
      if (tag === 'svg') {
        const hasTitle = node.querySelector?.('title');
        const ariaHidden = node.getAttribute?.('aria-hidden') === 'true';
        
        if (!hasTitle && !ariaHidden) {
          return {
            ruleId: 'svg-svg-alt',
            message: 'SVG should have a <title> or be hidden with aria-hidden',
            severity: 'warning',
            element: 'svg',
            fixable: true
          };
        }
      }
      return null;
    }
  }
];

// Helper functions
function findPreviousHeading(node: any): { level: number } | null {
  let prev = node.previousElementSibling;
  
  while (prev) {
    const level = parseInt(prev.tagName?.match(/^h(\d)$/i)?.[1] || '0', 10);
    if (level > 0) {
      return { level };
    }
    prev = prev.previousElementSibling;
  }
  
  // Check parent
  if (node.parentElement) {
    let parent = node.parentElement;
    const parentLevel = parseInt(parent.tagName?.match(/^h(\d)$/i)?.[1] || '0', 10);
    if (parentLevel > 0) {
      return { level: parentLevel };
    }
  }
  
  return null;
}

function getTextContent(node: any): string {
  return node.textContent || '';
}

function getComputedColor(node: any, property: string): string | null {
  try {
    const style = getComputedStyle(node);
    return ((style as unknown) as Record<string, string>)[property];
  } catch {
    return null;
  }
}

function calculateContrast(a: string, b: string): number {
  const rgbA = parseColor(a);
  const rgbB = parseColor(b);
  
  if (!rgbA || !rgbB) return 4.5; // Return minimum if we can't parse
  
  const lumA = relativeLuminance(rgbA);
  const lumB = relativeLuminance(rgbB);
  
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  
  return (lighter + 0.05) / (darker + 0.05);
}

function parseColor(color: string): [number, number, number] | null {
  // Handle named colors
  const match = color.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/);
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
  }
  
  // Handle hex
  const hex = color.replace('#', '');
  if (hex.length === 3) {
    return [
      parseInt(hex[0] + hex[0], 16),
      parseInt(hex[1] + hex[1], 16),
      parseInt(hex[2] + hex[2], 16)
    ];
  } else if (hex.length === 6) {
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16)
    ];
  }
  
  return null;
}

function relativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getRuleById(id: string): A11yRule | undefined {
  return builtInRules.find(r => r.id === id);
}
