const request = require('supertest');
const app = require('../index');

describe('API endpoints', () => {
  test('GET /api/wa-qr devuelve el QR', async () => {
    const res = await request(app).get('/api/wa-qr');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('qr');
  });

  test('GET /api/wa-status indica estado listo', async () => {
    const res = await request(app).get('/api/wa-status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ready: true });
  });

  test('POST /api/send-wa responde success', async () => {
    const res = await request(app).post('/api/send-wa').send({ to: '12345', message: 'hola' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
  });

  test('GET /api/wa-contacts devuelve contactos', async () => {
    const res = await request(app).get('/api/wa-contacts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
