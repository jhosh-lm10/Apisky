const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');

// Recibe el pool de PostgreSQL como parámetro
module.exports = (dbPool) => {
  // Registro de usuario
  router.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
      }
      const userExists = await dbPool.query('SELECT id FROM usuarios WHERE email = $1', [email]);
      if (userExists.rows.length > 0) {
        return res.status(409).json({ success: false, message: 'El email ya está registrado.' });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      await dbPool.query('INSERT INTO usuarios (email, password) VALUES ($1, $2)', [email, hashedPassword]);
      return res.json({ success: true, message: 'Usuario registrado correctamente.' });
    } catch (err) {
      console.error('Error en /api/register:', err);
      return res.status(500).json({ success: false, message: 'Error interno al registrar usuario.' });
    }
  });

  // Login de usuario
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email y contraseña requeridos.' });
      }
      const user = await dbPool.query('SELECT id, email, password, suscripcion_activa FROM usuarios WHERE email = $1', [email]);
      if (user.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
      }
      const valid = await bcrypt.compare(password, user.rows[0].password);
      if (!valid) {
        return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
      }
      return res.json({ success: true, user: { id: user.rows[0].id, email: user.rows[0].email, suscripcion_activa: user.rows[0].suscripcion_activa } });
    } catch (err) {
      console.error('Error en /api/login:', err);
      return res.status(500).json({ success: false, message: 'Error interno al iniciar sesión.' });
    }
  });

  return router;
};
