export interface A11yConfig {
  /** Run checks in development */
  devChecks?: boolean;
  /** Enable auto-fix */
  autoFix?: boolean;
  /** Enable React/JSX rule set */
  jsxRules?: boolean;
  /** Enable DOM rule set */
  domRules?: boolean;
  /** Log severity level */
  logLevel?: 'error' | 'warning' | 'info';
  /** Ignore specific rules */
  ignoreRules?: string[];
  /** Custom rules */
  customRules?: A11yRule[];
}

export interface A11yRule {
  id: string;
  title: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  check: (node: any) => A11yViolation | A11yViolation[] | null;
  fix?: (node: any) => void;
}

export interface A11yViolation {
  ruleId: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  element?: string;
  attribute?: string;
  fixable: boolean;
}

export interface A11yReport {
  timestamp: number;
  violations: A11yViolation[];
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
    fixable: number;
  };
  score: number;
}

export interface FocusTrapOptions {
  initialFocus?: HTMLElement | string | boolean | null;
  finalFocus?: HTMLElement | string;
  escapeDeactivates?: boolean;
  returnFocus?: boolean;
  preventScroll?: boolean;
}

export interface LiveRegionOptions {
  assertive?: boolean;
  timeout?: number;
  debounce?: number;
}
