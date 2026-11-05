const request = require('supertest');
const app = require('../src/app');

describe('DevOps Enterprise Platform Tests', () => {
  it('GET / should return the telemetry dashboard UI', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('DevOps Telemetry Platform');
    expect(res.text).toContain('Prometheus Metrics');
  });

  it('GET /metrics should expose standard Prometheus metrics', async () => {
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toContain('process_cpu_user_seconds_total');
    expect(res.text).toContain('http_requests_total');
  });

  it('GET /health/liveness should return UP', async () => {
    const res = await request(app).get('/health/liveness');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  it('GET /health/readiness should report subsystem health', async () => {
    const res = await request(app).get('/health/readiness');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('checks');
  });

  it('GET /api/stats should return OS telemetry statistics', async () => {
    const res = await request(app).get('/api/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('hostname');
    expect(res.body).toHaveProperty('cpuCores');
    expect(res.body).toHaveProperty('memoryUsageMB');
  });

  it('GET and POST /api/services should register and return microservices', async () => {
    const newService = {
      name: 'order-processing-api',
      version: 'v2.5.0',
      environment: 'production',
      replicas: 4
    };

    const postRes = await request(app)
      .post('/api/services')
      .send(newService);
    expect(postRes.statusCode).toBe(201);
    expect(postRes.body.name).toBe('order-processing-api');

    const getRes = await request(app).get('/api/services');
    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.data.some(s => s.name === 'order-processing-api')).toBe(true);
  });

  it('GET and POST /api/deployments should track pipeline events', async () => {
    const deployment = {
      service_name: 'order-processing-api',
      version: 'v2.5.0',
      status: 'SUCCESS',
      deployed_by: 'jenkins-ci'
    };

    const postRes = await request(app)
      .post('/api/deployments')
      .send(deployment);
    expect(postRes.statusCode).toBe(201);

    const getRes = await request(app).get('/api/deployments');
    expect(getRes.statusCode).toBe(200);
    expect(Array.isArray(getRes.body)).toBe(true);
  });
});
