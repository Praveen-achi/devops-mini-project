const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root endpoint - DevOps Dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>DevOps Mini Project</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #0f172a;
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
        }
        .card {
          background: #1e293b;
          border-radius: 12px;
          padding: 2.5rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
          max-width: 550px;
          width: 90%;
          border: 1px solid #334155;
        }
        .badge {
          display: inline-block;
          background: #10b981;
          color: #064e3b;
          font-weight: bold;
          font-size: 0.85rem;
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          margin-bottom: 1rem;
        }
        h1 { margin-top: 0; color: #38bdf8; font-size: 1.8rem; }
        p { color: #94a3b8; line-height: 1.6; }
        .info-grid {
          margin-top: 1.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .info-item {
          background: #0f172a;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          border: 1px solid #1e293b;
        }
        .info-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
        .info-val { font-size: 0.95rem; font-weight: 600; color: #e2e8f0; margin-top: 0.25rem; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">&#x2714; Service Active</span>
        <h1>DevOps Mini Project</h1>
        <p>Continuous Integration & Continuous Deployment pipeline powered by Docker and Jenkins.</p>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Host Name</div>
            <div class="info-val">${os.hostname()}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Platform</div>
            <div class="info-val">${os.platform()} (${os.arch()})</div>
          </div>
          <div class="info-item">
            <div class="info-label">Environment</div>
            <div class="info-val">${process.env.NODE_ENV || 'development'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Uptime</div>
            <div class="info-val">${Math.floor(process.uptime())}s</div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.status(200).json({
    app: 'devops-mini-project',
    version: '1.0.0',
    description: 'DevOps CI/CD with Jenkins & Docker',
    hostname: os.hostname(),
    platform: os.platform(),
    nodeVersion: process.version
  });
});

// Start listening if run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Application running on http://localhost:${PORT}`);
  });
}

module.exports = app;
