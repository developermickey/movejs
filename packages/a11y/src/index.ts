// MoveJS A11y - Accessibility engine

export type {
  A11yConfig,
  A11yRule,
  A11yViolation,
  A11yReport,
  FocusTrapOptions,
  LiveRegionOptions
} from './types';

export { builtInRules, getRuleById } from './rules/index';

export { A11yChecker, summarizeReport } from './checkers/index';

export {
  FocusTrap,
  LiveRegion,
  SkipLink,
  enableKeyboardNavigation,
  announce
} from './components/index';

// Version
export const VERSION = '0.1.0';
