const request = require('supertest');
const app = require('../index');

describe('Pipeline API', () => {
  test('GET /api/stages devuelve lista', async () => {
    const res = await request(app).get('/api/stages');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /api/stages crea etapa', async () => {
    const res = await request(app).post('/api/stages').send({ name: 'Nueva' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Nueva');
  });

  test('POST /api/messages guarda mensaje', async () => {
    const res = await request(app)
      .post('/api/messages')
      .send({ contactId: 1, content: 'hola' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body.content).toBe('hola');
  });
});
