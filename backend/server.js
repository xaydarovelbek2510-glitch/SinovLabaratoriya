require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Auth middleware ----------
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token topilmadi' });
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token yaroqsiz yoki muddati tugagan' });
  }
}

// ---------- Health ----------
app.get('/api/health', (req, res) => res.json({ ok: true }));

// ---------- Admin login ----------
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Parol noto'g'ri" });
  }
  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// ---------- Public: submit application ----------
app.post('/api/applications', async (req, res) => {
  const { full_name, phone, email, service_type, message } = req.body || {};
  if (!full_name || !phone || !service_type) {
    return res.status(400).json({ error: "Ism, telefon va xizmat turi majburiy" });
  }
  try {
    const result = await pool.query(
      `INSERT INTO applications (full_name, phone, email, service_type, message)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [full_name, phone, email || null, service_type, message || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ---------- Public: verify test result by certificate number ----------
app.get('/api/test-results/:certNumber', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT cert_number, client_name, sample_type, standard_ref, test_date, result_summary, status
       FROM test_results WHERE cert_number = $1`,
      [req.params.certNumber.trim()]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bunday sertifikat raqami topilmadi' });
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ---------- Admin: list applications ----------
app.get('/api/admin/applications', requireAdmin, async (req, res) => {
  const result = await pool.query('SELECT * FROM applications ORDER BY created_at DESC');
  res.json(result.rows);
});

// ---------- Admin: update application status ----------
app.patch('/api/admin/applications/:id', requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  const result = await pool.query(
    'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi' });
  res.json(result.rows[0]);
});

// ---------- Admin: list all test results ----------
app.get('/api/admin/test-results', requireAdmin, async (req, res) => {
  const result = await pool.query('SELECT * FROM test_results ORDER BY created_at DESC');
  res.json(result.rows);
});

// ---------- Admin: create test result ----------
app.post('/api/admin/test-results', requireAdmin, async (req, res) => {
  const { cert_number, client_name, sample_type, standard_ref, test_date, result_summary, status } = req.body || {};
  if (!cert_number || !client_name || !sample_type || !test_date) {
    return res.status(400).json({ error: 'Majburiy maydonlar to\'ldirilmagan' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO test_results (cert_number, client_name, sample_type, standard_ref, test_date, result_summary, status)
       VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 'kutilmoqda')) RETURNING *`,
      [cert_number, client_name, sample_type, standard_ref || null, test_date, result_summary || null, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ error: 'Bu sertifikat raqami allaqachon mavjud' });
    }
    console.error(e);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ---------- Admin: update test result ----------
app.put('/api/admin/test-results/:id', requireAdmin, async (req, res) => {
  const { client_name, sample_type, standard_ref, test_date, result_summary, status } = req.body || {};
  try {
    const result = await pool.query(
      `UPDATE test_results SET client_name=$1, sample_type=$2, standard_ref=$3, test_date=$4,
       result_summary=$5, status=$6 WHERE id=$7 RETURNING *`,
      [client_name, sample_type, standard_ref, test_date, result_summary, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Topilmadi' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server xatosi' });
  }
});

// ---------- Admin: delete test result ----------
app.delete('/api/admin/test-results/:id', requireAdmin, async (req, res) => {
  await pool.query('DELETE FROM test_results WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Server ${PORT}-portda ishga tushdi`);
});
