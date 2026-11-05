const express = require('express');
const os = require('os');
const { register, metricsMiddleware, activeDeploymentsGauge } = require('./metrics');
const db = require('./db');
const cache = require('./cache');

const app = express();

app.use(express.json());
app.use(metricsMiddleware);

// ==========================================
// 1. Prometheus Metrics Endpoint
// ==========================================
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// ==========================================
// 2. Health & Kubernetes Probes
// ==========================================
// Liveness probe (container running?)
app.get('/health/liveness', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Backward compatibility for legacy healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', uptime: process.uptime() });
});

// Readiness probe (DB + Cache ready?)
app.get('/health/readiness', (req, res) => {
  const isDbUp = db.checkDBHealth();
  const isRedisUp = cache.checkRedisHealth();

  res.status(200).json({
    status: isDbUp ? 'READY' : 'DEGRADED',
    checks: {
      database: isDbUp ? 'CONNECTED' : 'IN_MEMORY_FALLBACK',
      cache: isRedisUp ? 'CONNECTED' : 'IN_MEMORY_FALLBACK'
    },
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 3. API Endpoints
// ==========================================
// Live system telemetry stats
app.get('/api/stats', (req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  res.json({
    hostname: os.hostname(),
    platform: `${os.platform()} (${os.arch()})`,
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    cpuModel: cpus[0] ? cpus[0].model : 'Unknown',
    cpuCores: cpus.length,
    memoryUsageMB: Math.round(usedMem / (1024 * 1024)),
    memoryTotalMB: Math.round(totalMem / (1024 * 1024)),
    memoryPercent: Math.round((usedMem / totalMem) * 100),
    processMemoryMB: Math.round(process.memoryUsage().rss / (1024 * 1024))
  });
});

// Microservices catalog
app.get('/api/services', async (req, res) => {
  const cached = await cache.getCache('services_list');
  if (cached) {
    return res.json({ source: 'redis_cache', data: cached });
  }

  const services = await db.getServices();
  await cache.setCache('services_list', services, 15);
  res.json({ source: 'database', data: services });
});

app.post('/api/services', async (req, res) => {
  const { name, status, version, environment, replicas } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Service name is required' });
  }
  const created = await db.addService({ name, status, version, environment, replicas });
  await cache.setCache('services_list', null, 0); // invalidate
  res.status(201).json(created);
});

// Deployment tracking
app.get('/api/deployments', async (req, res) => {
  const deployments = await db.getDeployments();
  activeDeploymentsGauge.set(deployments.length);
  res.json(deployments);
});

app.post('/api/deployments', async (req, res) => {
  const { service_name, version, status, deployed_by } = req.body;
  const dep = await db.logDeployment({ service_name, version, status, deployed_by });
  res.status(201).json(dep);
});

// ==========================================
// 4. Web UI - Enterprise DevOps Control Center
// ==========================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DevOps Telemetry & CI/CD Platform</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #151c2c;
      --border: #232f48;
      --text: #f3f4f6;
      --muted: #94a3b8;
      --accent: #38bdf8;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --purple: #a855f7;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 1.5rem;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.25rem;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.4rem;
      font-weight: 700;
      color: var(--accent);
    }
    .status-badge {
      background: rgba(16, 185, 129, 0.15);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.3);
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--success);
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      position: relative;
    }
    .card-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }
    .card-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--text);
    }
    .card-sub {
      font-size: 0.8rem;
      color: var(--muted);
      margin-top: 0.5rem;
    }
    .main-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 900px) {
      .main-grid { grid-template-columns: 1fr; }
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    th, td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border);
    }
    th {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--muted);
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-healthy { background: rgba(16, 185, 129, 0.2); color: var(--success); }
    .badge-degraded { background: rgba(245, 158, 11, 0.2); color: var(--warning); }
    .endpoint-list a {
      display: block;
      color: var(--accent);
      text-decoration: none;
      padding: 0.5rem 0.75rem;
      background: #0b0f19;
      border-radius: 6px;
      margin-bottom: 0.5rem;
      font-family: monospace;
      font-size: 0.85rem;
      border: 1px solid var(--border);
      transition: all 0.2s;
    }
    .endpoint-list a:hover {
      background: #1e293b;
      border-color: var(--accent);
    }
    .btn {
      background: var(--accent);
      color: #0b0f19;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>

  <header>
    <div class="logo">
      <span>⚡ DevOps Telemetry Platform</span>
      <span style="font-size: 0.85rem; color: var(--muted); font-weight: normal;">(v2.0.0 Architecture)</span>
    </div>
    <div class="status-badge">
      <div class="pulse-dot"></div>
      <span>All CI/CD Pipeline Gates Passed</span>
    </div>
  </header>

  <div class="grid-4">
    <div class="card">
      <div class="card-title">Memory Allocation</div>
      <div class="card-value" id="val-mem">--%</div>
      <div class="card-sub" id="sub-mem">Usage</div>
    </div>
    <div class="card">
      <div class="card-title">Container Host</div>
      <div class="card-value" style="font-size: 1.3rem;" id="val-host">--</div>
      <div class="card-sub" id="sub-platform">OS & Architecture</div>
    </div>
    <div class="card">
      <div class="card-title">Prometheus Metrics</div>
      <div class="card-value" style="color: var(--purple);">ACTIVE</div>
      <div class="card-sub">Exporting to /metrics</div>
    </div>
    <div class="card">
      <div class="card-title">Database & Cache</div>
      <div class="card-value" style="color: var(--success);" id="val-db">READY</div>
      <div class="card-sub">PostgreSQL & Redis Sync</div>
    </div>
  </div>

  <div class="main-grid">
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="margin: 0;">Microservices Registry</h3>
        <span class="badge badge-healthy" id="service-count">4 Services Active</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Version</th>
            <th>Environment</th>
            <th>Replicas</th>
            <th>Health</th>
          </tr>
        </thead>
        <tbody id="services-table">
          <tr><td colspan="5">Loading microservices registry...</td></tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3 style="margin-top: 0;">DevOps Telemetry Endpoints</h3>
      <p style="font-size: 0.85rem; color: var(--muted);">Click any endpoint below to inspect real-time raw telemetry feeds:</p>
      <div class="endpoint-list">
        <a href="/metrics" target="_blank">📊 /metrics (Prometheus Exporter)</a>
        <a href="/health/liveness" target="_blank">💚 /health/liveness (K8s Liveness Probe)</a>
        <a href="/health/readiness" target="_blank">💛 /health/readiness (DB/Redis Probe)</a>
        <a href="/api/stats" target="_blank">💻 /api/stats (Host OS Metrics)</a>
        <a href="/api/services" target="_blank">📦 /api/services (Services Catalog)</a>
        <a href="/api/deployments" target="_blank">🚀 /api/deployments (Pipeline History)</a>
      </div>
    </div>
  </div>

  <script>
    async function loadData() {
      try {
        const statsRes = await fetch('/api/stats');
        const stats = await statsRes.json();
        document.getElementById('val-mem').innerText = stats.memoryPercent + '%';
        document.getElementById('sub-mem').innerText = stats.memoryUsageMB + ' MB / ' + stats.memoryTotalMB + ' MB';
        document.getElementById('val-host').innerText = stats.hostname;
        document.getElementById('sub-platform').innerText = stats.platform + ' • ' + stats.cpuCores + ' vCPUs';

        const srvRes = await fetch('/api/services');
        const srvData = await srvRes.json();
        const services = srvData.data || [];
        document.getElementById('service-count').innerText = services.length + ' Services Active';

        const tbody = document.getElementById('services-table');
        tbody.innerHTML = services.map(s => \`
          <tr>
            <td><strong>\${s.name}</strong></td>
            <td><code style="background:#0b0f19; padding:2px 6px; border-radius:4px;">\${s.version}</code></td>
            <td>\${s.environment}</td>
            <td>\${s.replicas} pods</td>
            <td><span class="badge \${s.status === 'HEALTHY' ? 'badge-healthy' : 'badge-degraded'}">\${s.status}</span></td>
          </tr>
        \`).join('');
      } catch (err) {
        console.error('Error fetching dashboard telemetry:', err);
      }
    }

    loadData();
    setInterval(loadData, 5000);
  </script>
</body>
</html>
  `);
});

module.exports = app;
