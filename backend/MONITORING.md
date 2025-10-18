# Monitoring and Error Tracking Setup

This document explains how to set up monitoring and error tracking for the OpenSilício backend.

## Built-in Monitoring

The backend includes basic performance monitoring out of the box:

### Performance Metrics

Access real-time metrics at: `http://localhost:3001/metrics`

Metrics include:
- Total requests
- Error count and rate
- Slowest endpoints
- Request counts per route
- Average/min/max response times
- Server uptime

### Request Tracking

Every request includes:
- **Request ID**: Unique identifier for tracing (`X-Request-ID` header)
- **Performance monitoring**: Duration tracking and slow request warnings
- **Error logging**: Detailed error logs with request context

### Cache Monitoring

Cache headers are added to all cached responses:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response generated fresh
- `X-Cache-Key` - Cache key used

## External Error Tracking (Optional)

For production environments, consider integrating a dedicated error tracking service.

### Recommended Services

1. **Sentry** - Error tracking and performance monitoring
2. **Datadog** - Full-stack monitoring and APM
3. **New Relic** - Application performance monitoring
4. **LogRocket** - Session replay with error tracking

---

## Sentry Integration (Example)

### 1. Install Sentry SDK

```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

### 2. Configure Sentry

Create `backend/src/config/sentry.ts`:

```typescript
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      integrations: [
        new ProfilingIntegration(),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // Capture 10% of transactions
      // Set sampling rate for profiling
      profilesSampleRate: 0.1,
    });

    console.log('✅ Sentry initialized');
  }
}
```

### 3. Update server.ts

```typescript
import { initSentry } from './config/sentry';

// Initialize Sentry BEFORE creating Express app
initSentry();

const app = express();

// Request handler must be the first middleware
app.use(Sentry.Handlers.requestHandler());

// ... your middleware and routes ...

// Error handler must be before any other error middleware
app.use(Sentry.Handlers.errorHandler());

// Then your custom error handlers
app.use(notFoundHandler);
app.use(errorHandler);
```

### 4. Add Environment Variable

Add to `.env`:
```
SENTRY_DSN=your-sentry-dsn-here
```

### 5. Capture Custom Errors

You can manually capture errors in your code:

```typescript
import * as Sentry from '@sentry/node';

try {
  // Your code
} catch (error) {
  Sentry.captureException(error);
  throw error;
}
```

---

## Logging Best Practices

### 1. Structured Logging

Use structured logging for better searchability:

```typescript
console.log(JSON.stringify({
  level: 'info',
  message: 'User action',
  userId: user.id,
  action: 'login',
  timestamp: new Date().toISOString(),
  requestId: req.requestId,
}));
```

### 2. Log Levels

Use appropriate log levels:
- `console.log()` - General information
- `console.warn()` - Warnings (slow requests, deprecations)
- `console.error()` - Errors that need attention

### 3. Avoid Logging Sensitive Data

Never log:
- Passwords
- API keys
- Personal information (emails, names, addresses)
- Credit card numbers
- Session tokens

---

## Production Monitoring Checklist

- [ ] Set up error tracking (Sentry, Datadog, etc.)
- [ ] Configure log aggregation (CloudWatch, Papertrail, etc.)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Configure performance monitoring
- [ ] Set up alerts for critical errors
- [ ] Monitor database performance
- [ ] Track API response times
- [ ] Monitor memory and CPU usage
- [ ] Set up log rotation
- [ ] Configure backup monitoring

---

## Monitoring Endpoints

### Health Check
```
GET /health
```
Returns API and database status

### Metrics
```
GET /metrics
```
Returns performance metrics summary

---

## Environment Variables

Add these to your `.env` file for monitoring services:

```bash
# Error Tracking
SENTRY_DSN=your-sentry-dsn

# Performance Monitoring
DATADOG_API_KEY=your-datadog-key
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Log Level
LOG_LEVEL=info  # debug, info, warn, error
```

---

## Monitoring in Docker

When running in Docker, you can view logs:

```bash
# Follow logs
docker-compose -f docker/docker-compose.dev.yml logs -f backend

# View metrics
curl http://localhost:3001/metrics

# Check health
curl http://localhost:3001/health
```

---

## Troubleshooting

### Slow Requests

Check the logs for warnings:
```
⚠️  Slow request [a1b2c3d4...]: GET:/api/blog took 1234ms
```

Then:
1. Check the `/metrics` endpoint to identify slow routes
2. Review database queries for optimization
3. Consider adding/adjusting cache TTL
4. Check for N+1 query problems

### High Error Rate

1. Check `/metrics` for error rate
2. Review error logs for patterns
3. Check Sentry/error tracker for details
4. Verify database connectivity
5. Check external service integrations

### Memory Issues

1. Monitor Node.js memory usage
2. Check for memory leaks with profilers
3. Review cache size (consider limits)
4. Check for unclosed database connections

---

## Next Steps

1. Set up a monitoring service (start with the free tier)
2. Configure alerts for critical errors
3. Set up log aggregation for production
4. Create dashboards for key metrics
5. Establish SLOs (Service Level Objectives)
