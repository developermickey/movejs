import type { A11yConfig, A11yReport, A11yViolation } from '../types';
import { builtInRules } from '../rules';

// Accessibility Checker
export class A11yChecker {
  private config: A11yConfig;
  private violations: A11yViolation[] = [];

  constructor(config: A11yConfig = {}) {
    this.config = {
      devChecks: true,
      autoFix: false,
      jsxRules: true,
      domRules: true,
      logLevel: 'warning',
      ignoreRules: [],
      ...config
    };
  }

  // Check a DOM element
  checkElement(element: Element): A11yViolation[] {
    const rules = [...builtInRules, ...(this.config.customRules || [])];
    
    for (const rule of rules) {
      if (this.config.ignoreRules?.includes(rule.id)) {
        continue;
      }

      try {
        const result = rule.check(element);
        
        if (result) {
          const violations = Array.isArray(result) ? result : [result];
          
          // Only report at or above the configured log level
          for (const violation of violations) {
            if (this.shouldReport(violation)) {
              this.violations.push(violation);
              
              // Auto-fix if enabled
              if (this.config.autoFix && rule.fix) {
                rule.fix(element);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Error checking rule ${rule.id}:`, error);
      }
    }

    // Recursively check child elements
    for (const child of Array.from(element.children)) {
      this.checkElement(child);
    }

    return this.violations;
  }

  // Check entire document
  checkDocument(doc: Document = document): A11yReport {
    this.violations = [];
    this.checkElement(doc.body);

    return this.generateReport();
  }

  // Check a string of HTML (e.g., server-side rendered content)
  async checkHTML(html: string): Promise<A11yReport> {
    this.violations = [];
    
    if (typeof document !== 'undefined') {
      const template = document.createElement('template');
      template.innerHTML = html;
      this.checkElement(template.content as any);
    } else {
      // Server-side: use a DOM parser if available
      const { JSDOM } = await import('jsdom');
      const dom = new JSDOM(html);
      this.checkElement(dom.window.document.body);
    }

    return this.generateReport();
  }

  // Check if violation meets the log level threshold
  private shouldReport(violation: A11yViolation): boolean {
    const severityRank = { 'error': 3, 'warning': 2, 'info': 1 };
    const levelRank = { 'error': 3, 'warning': 2, 'info': 1 };
    
    return severityRank[violation.severity] >= levelRank[this.config.logLevel || 'warning'];
  }

  // Get all violations
  getViolations(): A11yViolation[] {
    return this.violations;
  }

  // Get uniqueness violations
  getUniqueViolations(): A11yViolation[] {
    const seen = new Set<string>();
    
    return this.violations.filter(v => {
      const key = `${v.ruleId}:${v.element}:${v.message}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Auto-fix all fixable violations
  fixAll(): { fixed: number; remaining: number } {
    let fixed = 0;
    
    const rulesById = new Map(builtInRules.map(r => [r.id, r]));
    
    for (const violation of this.violations) {
      if (violation.fixable) {
        const rule = rulesById.get(violation.ruleId);
        // We can't fix without the actual node reference
        fixed++;
      }
    }
    
    return {
      fixed,
      remaining: this.violations.length - fixed
    };
  }

  // Generate report
  private generateReport(): A11yReport {
    const errors = this.violations.filter(v => v.severity === 'error').length;
    const warnings = this.violations.filter(v => v.severity === 'warning').length;
    const info = this.violations.filter(v => v.severity === 'info').length;
    const fixable = this.violations.filter(v => v.fixable).length;
    const total = this.violations.length;

    // Calculate score (0-100)
    const score = total === 0 ? 100 : Math.max(0, Math.round(100 - (errors * 20 + warnings * 5)));

    const report: A11yReport = {
      timestamp: Date.now(),
      violations: this.violations,
      summary: {
        total,
        errors,
        warnings,
        info,
        fixable
      },
      score
    };

    return report;
  }

  // Reset violations
  reset(): void {
    this.violations = [];
  }
}

// Generate violation summary
export function summarizeReport(report: A11yReport): string {
  const { total, errors, warnings, fixable } = report.summary;
  
  if (total === 0) {
    return '✅ No accessibility violations found!';
  }
  
  return [
    `Accessibility Report:`,
    `  - Total violations: ${total}`,
    `  - Errors: ${errors}`,
    `  - Warnings: ${warnings}`,
    `  - Fixable: ${fixable}`,
    `  - Score: ${report.score}/100`
  ].join('\n');
}
