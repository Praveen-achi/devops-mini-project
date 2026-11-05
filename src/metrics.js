const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'devops-telemetry-platform'
});

// Enable the collection of default metrics (CPU, Memory, Event Loop)
client.collectDefaultMetrics({ register });

// Custom Prometheus Metrics
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const totalHttpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'code']
});

const activeDeploymentsGauge = new client.Gauge({
  name: 'devops_active_deployments',
  help: 'Number of active application deployments'
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(totalHttpRequests);
register.registerMetric(activeDeploymentsGauge);

// Middleware to measure request duration
function metricsMiddleware(req, res, next) {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;

    totalHttpRequests.inc({
      method: req.method,
      route,
      code: res.statusCode
    });

    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route,
        code: res.statusCode
      },
      durationInSeconds
    );
  });

  next();
}

module.exports = {
  register,
  metricsMiddleware,
  activeDeploymentsGauge
};
