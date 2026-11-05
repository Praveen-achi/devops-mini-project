const request = require('supertest');
const app = require('../src/app');

describe('DevOps Mini Project API Tests', () => {
  it('GET / should return 200 OK and HTML dashboard', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain('DevOps Mini Project');
  });

  it('GET /health should return 200 and status UP', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'UP');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('GET /api/info should return application metadata', async () => {
    const res = await request(app).get('/api/info');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('app', 'devops-mini-project');
    expect(res.body).toHaveProperty('version', '1.0.0');
  });
});
