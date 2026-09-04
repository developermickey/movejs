import type { WebVitalMetric, WebVitalReport } from '../types';

// Core Web Vitals Monitor
export class WebVitalsMonitor {
  private metrics: Map<string, WebVitalMetric> = new Map();
  private handlers: Array<(metric: WebVitalMetric) => void> = [];
  private reportHandler: ((report: WebVitalReport) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  // Initialize monitoring
  private init(): void {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            this.setMetric('LCP', lastEntry.startTime, getRating(lastEntry.startTime, 'LCP'));
          }
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {}
    }

    // CLS - Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as any) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });

        // Report CLS on pagehide
        window.addEventListener('pagehide', () => {
          this.setMetric('CLS', clsValue, getRating(clsValue, 'CLS'));
        });
      } catch (e) {}
    }

    // FID - First Input Delay
    if ('PerformanceObserver' in window) {
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries() as any;
          for (const entry of entries) {
            this.setMetric('FID', entry.processingStart - entry.startTime, getRating(entry.processingStart - entry.startTime, 'FID'));
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {}
    }

    // FCP - First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length > 0) {
            this.setMetric('FCP', entries[0].startTime, getRating(entries[0].startTime, 'FCP'));
          }
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
      } catch (e) {}
    }

    // TTFB - Time to First Byte
    if ('PerformanceNavigationTiming' in window) {
      try {
        const navEntry = performance.getEntriesByType('navigation')[0] as any;
        if (navEntry) {
          const ttfb = navEntry.responseStart;
          this.setMetric('TTFB', ttfb, getRating(ttfb, 'TTFB'));
        }
      } catch (e) {}
    }

    // Report after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.generateReport();
      }, 1000);
    });
  }

  // Set a metric value
  private setMetric(name: string, value: number, rating: string): void {
    const previous = this.metrics.get(name);
    const delta = previous ? value - previous.value : value;

    const metric: WebVitalMetric = {
      name: name as WebVitalMetric['name'],
      value,
      delta,
      id: `${name}-${Date.now()}`,
      rating: rating as WebVitalMetric['rating'],
      navigationType: this.getNavigationType()
    };

    this.metrics.set(name, metric);

    // Notify handlers
    for (const handler of this.handlers) {
      handler(metric);
    }
  }

  // Get navigation type
  private getNavigationType(): string {
    try {
      const nav = performance.getEntriesByType('navigation')[0] as any;
      return nav?.type || 'navigate';
    } catch {
      return 'navigate';
    }
  }

  // Get a specific metric
  getMetric(name: string): WebVitalMetric | undefined {
    return this.metrics.get(name);
  }

  // Get all metrics
  getMetrics(): Record<string, WebVitalMetric> {
    return Object.fromEntries(this.metrics);
  }

  // Subscribe to metric changes
  onMetric(handler: (metric: WebVitalMetric) => void): () => void {
    this.handlers.push(handler);
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  // Generate report
  generateReport(): WebVitalReport {
    // Calculate overall score
    let totalScore = 0;
    const metricCount = this.metrics.size || 1;

    for (const metric of this.metrics.values()) {
      totalScore += getScore(metric);
    }

    const score = Math.round(totalScore / metricCount);

    const report: WebVitalReport = {
      metrics: this.getMetrics(),
      score,
      timestamp: Date.now()
    };

    if (this.reportHandler) {
      this.reportHandler(report);
    }

    return report;
  }

  // Set report handler
  onReport(handler: (report: WebVitalReport) => void): void {
    this.reportHandler = handler;
  }
}

// Get rating based on thresholds
function getRating(value: number, metric: string): string {
  switch (metric) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'FCP':
      return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor';
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    case 'INP':
      return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    default:
      return 'good';
  }
}

// Get score contribution from a metric
function getScore(metric: WebVitalMetric): number {
  switch (metric.rating) {
    case 'good':
      return 100;
    case 'needs-improvement':
      return 50;
    case 'poor':
      return 0;
    default:
      return 50;
  }
}

// Convenience hook/function
export function useWebVitals(): {
  monitor: WebVitalsMonitor;
  report: () => WebVitalReport;
} {
  const monitor = new WebVitalsMonitor();
  return {
    monitor,
    report: () => monitor.generateReport()
  };
}

// Singleton instance
let defaultMonitor: WebVitalsMonitor | null = null;

export function getWebVitalsMonitor(): WebVitalsMonitor {
  if (!defaultMonitor) {
    defaultMonitor = new WebVitalsMonitor();
  }
  return defaultMonitor;
}

// Report to console in dev mode
export function enableDevReporting(): void {
  const monitor = getWebVitalsMonitor();
  monitor.onReport((report) => {
    console.log('🎯 Core Web Vitals:', report.metrics);
    console.log('Score:', report.score);
  });
}
