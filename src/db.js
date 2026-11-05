const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'devops_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 10000,
  max: 10
});

let isConnected = false;

// In-memory fallback if database is booting or standalone
const memoryStore = {
  services: [
    { id: 1, name: 'auth-service', status: 'HEALTHY', version: 'v1.4.2', environment: 'production', replicas: 3 },
    { id: 2, name: 'payment-gateway', status: 'HEALTHY', version: 'v2.1.0', environment: 'production', replicas: 2 },
    { id: 3, name: 'notification-worker', status: 'DEGRADED', version: 'v1.0.8', environment: 'production', replicas: 1 },
    { id: 4, name: 'inventory-api', status: 'HEALTHY', version: 'v3.0.1', environment: 'staging', replicas: 2 }
  ],
  deployments: [
    { id: 1, service_name: 'auth-service', version: 'v1.4.2', status: 'SUCCESS', deployed_by: 'jenkins-ci', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, service_name: 'payment-gateway', version: 'v2.1.0', status: 'SUCCESS', deployed_by: 'jenkins-ci', timestamp: new Date(Date.now() - 7200000).toISOString() }
  ]
};

async function initDB() {
  try {
    const client = await pool.connect();
    isConnected = true;
    console.log('✓ Successfully connected to PostgreSQL Database.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        status VARCHAR(50) DEFAULT 'HEALTHY',
        version VARCHAR(50) NOT NULL,
        environment VARCHAR(50) DEFAULT 'production',
        replicas INT DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS deployments (
        id SERIAL PRIMARY KEY,
        service_name VARCHAR(100) NOT NULL,
        version VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'SUCCESS',
        deployed_by VARCHAR(100) DEFAULT 'jenkins-ci',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed default rows if empty
    const check = await client.query('SELECT COUNT(*) FROM services');
    if (parseInt(check.rows[0].count, 10) === 0) {
      for (const s of memoryStore.services) {
        await client.query(
          'INSERT INTO services (name, status, version, environment, replicas) VALUES ($1, $2, $3, $4, $5)',
          [s.name, s.status, s.version, s.environment, s.replicas]
        );
      }
      for (const d of memoryStore.deployments) {
        await client.query(
          'INSERT INTO deployments (service_name, version, status, deployed_by) VALUES ($1, $2, $3, $4)',
          [d.service_name, d.version, d.status, d.deployed_by]
        );
      }
      console.log('✓ Seeded initial services into PostgreSQL.');
    }

    client.release();
  } catch (err) {
    isConnected = false;
    console.warn('ℹ PostgreSQL connection not available. Running in resilient memory mode:', err.message);
  }
}

async function getServices() {
  if (isConnected) {
    try {
      const res = await pool.query('SELECT * FROM services ORDER BY id ASC');
      return res.rows;
    } catch {
      return memoryStore.services;
    }
  }
  return memoryStore.services;
}

async function addService({ name, status = 'HEALTHY', version = 'v1.0.0', environment = 'production', replicas = 1 }) {
  if (isConnected) {
    try {
      const res = await pool.query(
        'INSERT INTO services (name, status, version, environment, replicas) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [name, status, version, environment, replicas]
      );
      return res.rows[0];
    } catch {
      // Fallback
    }
  }
  const newService = { id: memoryStore.services.length + 1, name, status, version, environment, replicas };
  memoryStore.services.push(newService);
  return newService;
}

async function getDeployments() {
  if (isConnected) {
    try {
      const res = await pool.query('SELECT * FROM deployments ORDER BY id DESC LIMIT 10');
      return res.rows;
    } catch {
      return memoryStore.deployments;
    }
  }
  return memoryStore.deployments;
}

async function logDeployment({ service_name, version, status = 'SUCCESS', deployed_by = 'jenkins-ci' }) {
  if (isConnected) {
    try {
      const res = await pool.query(
        'INSERT INTO deployments (service_name, version, status, deployed_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [service_name, version, status, deployed_by]
      );
      return res.rows[0];
    } catch {
      // Fallback
    }
  }
  const newDep = {
    id: memoryStore.deployments.length + 1,
    service_name,
    version,
    status,
    deployed_by,
    created_at: new Date().toISOString()
  };
  memoryStore.deployments.unshift(newDep);
  return newDep;
}

function checkDBHealth() {
  return isConnected;
}

module.exports = {
  pool,
  initDB,
  getServices,
  addService,
  getDeployments,
  logDeployment,
  checkDBHealth
};
