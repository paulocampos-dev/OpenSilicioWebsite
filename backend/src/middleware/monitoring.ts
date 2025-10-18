import { Request, Response, NextFunction } from 'express';

interface MetricData {
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  errors: number;
  lastAccess: Date;
}

interface RouteMetrics {
  [key: string]: MetricData;
}

/**
 * Simple performance monitoring
 * Tracks request counts, durations, and error rates
 */
class PerformanceMonitor {
  private metrics: RouteMetrics = {};

  /**
   * Record a request metric
   */
  record(route: string, duration: number, statusCode: number) {
    if (!this.metrics[route]) {
      this.metrics[route] = {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        errors: 0,
        lastAccess: new Date(),
      };
    }

    const metric = this.metrics[route];
    metric.count++;
    metric.totalDuration += duration;
    metric.avgDuration = metric.totalDuration / metric.count;
    metric.minDuration = Math.min(metric.minDuration, duration);
    metric.maxDuration = Math.max(metric.maxDuration, duration);
    metric.lastAccess = new Date();

    if (statusCode >= 400) {
      metric.errors++;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): RouteMetrics {
    return this.metrics;
  }

  /**
   * Get metrics for a specific route
   */
  getRouteMetrics(route: string): MetricData | null {
    return this.metrics[route] || null;
  }

  /**
   * Get summary statistics
   */
  getSummary() {
    const routes = Object.keys(this.metrics);
    const totalRequests = routes.reduce((sum, route) => sum + this.metrics[route].count, 0);
    const totalErrors = routes.reduce((sum, route) => sum + this.metrics[route].errors, 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    // Find slowest endpoint
    let slowestRoute = '';
    let slowestTime = 0;
    routes.forEach(route => {
      if (this.metrics[route].avgDuration > slowestTime) {
        slowestTime = this.metrics[route].avgDuration;
        slowestRoute = route;
      }
    });

    return {
      totalRequests,
      totalErrors,
      errorRate: errorRate.toFixed(2) + '%',
      uniqueRoutes: routes.length,
      slowestRoute: slowestRoute ? `${slowestRoute} (${slowestTime.toFixed(2)}ms)` : 'N/A',
      uptime: process.uptime(),
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics = {};
  }
}

// Singleton instance
const monitor = new PerformanceMonitor();

/**
 * Performance monitoring middleware
 * Tracks request duration and status for each route
 */
export const monitoringMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const route = `${req.method}:${req.route?.path || req.path}`;

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    monitor.record(route, duration, res.statusCode);

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(`⚠️  Slow request [${req.requestId}]: ${route} took ${duration}ms`);
    }

    // Log errors
    if (res.statusCode >= 500) {
      console.error(`❌ Server error [${req.requestId}]: ${route} returned ${res.statusCode}`);
    }
  });

  next();
};

/**
 * Get performance metrics
 */
export function getMetrics() {
  return monitor.getMetrics();
}

/**
 * Get performance summary
 */
export function getMetricsSummary() {
  return monitor.getSummary();
}

/**
 * Reset metrics
 */
export function resetMetrics() {
  monitor.reset();
}

export default monitor;
