require('dotenv').config();
const app = require('./app');
const db = require('./db');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  // Initialize Database connection & tables
  await db.initDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 DevOps Telemetry Platform running on http://localhost:${PORT}`);
    console.log(`📊 Prometheus Metrics available at http://localhost:${PORT}/metrics`);
    console.log(`💚 Liveness & Readiness Probes active at /health/liveness and /health/readiness`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Gracefully shutting down...`);
    server.close(async () => {
      try {
        await db.pool.end();
        console.log('✓ Database connection pool closed.');
      } catch (err) {
        // ignore
      }
      console.log('✓ HTTP server closed. Exiting process.');
      process.exit(0);
    });

    // Force shutdown if taking longer than 5 seconds
    setTimeout(() => {
      console.error('Forcefully terminating process after timeout.');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
