require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Hash the admin password once at startup so we never compare plain text.
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

app.use(cors());
app.use(express.json());

// Serve the frontend as static files
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// ---------- Auth helpers ----------

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ---------- Public routes ----------

// Submit a new lead (contact form)
app.post('/api/leads', (req, res) => {
  const { name, email, phone, service, budget, message } = req.body || {};

  if (!name || !name.trim() || !email || !email.trim()) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const lead = db.createLead({
    name: name.trim(),
    email: email.trim(),
    phone: (phone || '').trim(),
    service: (service || '').trim(),
    budget: (budget || '').trim(),
    message: (message || '').trim(),
  });

  res.status(201).json({ id: lead.id, message: 'Thanks! Your inquiry has been received.' });
});

// List portfolio items (for the public site)
app.get('/api/portfolio', (req, res) => {
  res.json(db.getPortfolio());
});

// ---------- Admin auth ----------

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username !== ADMIN_USERNAME || !bcrypt.compareSync(password || '', ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

// ---------- Admin: leads ----------

app.get('/api/admin/leads', requireAuth, (req, res) => {
  res.json(db.getLeads());
});

app.patch('/api/admin/leads/:id', requireAuth, (req, res) => {
  const { status } = req.body || {};
  const allowed = ['new', 'contacted', 'won', 'lost'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${allowed.join(', ')}` });
  }
  const ok = db.updateLeadStatus(req.params.id, status);
  if (!ok) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ message: 'Lead updated.' });
});

app.delete('/api/admin/leads/:id', requireAuth, (req, res) => {
  const ok = db.deleteLead(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Lead not found.' });
  res.json({ message: 'Lead deleted.' });
});

// ---------- Admin: portfolio ----------

app.post('/api/admin/portfolio', requireAuth, (req, res) => {
  const { title, category, image_url, link_url, description, sort_order } = req.body || {};
  if (!title || !title.trim() || !category || !category.trim()) {
    return res.status(400).json({ error: 'Title and category are required.' });
  }
  const item = db.createPortfolioItem({
    title: title.trim(),
    category: category.trim(),
    image_url: (image_url || '').trim(),
    link_url: (link_url || '').trim(),
    description: (description || '').trim(),
    sort_order: Number.isFinite(sort_order) ? sort_order : 0,
  });
  res.status(201).json({ id: item.id });
});

app.put('/api/admin/portfolio/:id', requireAuth, (req, res) => {
  const { title, category, image_url, link_url, description, sort_order } = req.body || {};
  const ok = db.updatePortfolioItem(req.params.id, {
    title: (title || '').trim(),
    category: (category || '').trim(),
    image_url: (image_url || '').trim(),
    link_url: (link_url || '').trim(),
    description: (description || '').trim(),
    sort_order: Number.isFinite(sort_order) ? sort_order : 0,
  });
  if (!ok) return res.status(404).json({ error: 'Portfolio item not found.' });
  res.json({ message: 'Portfolio item updated.' });
});

app.delete('/api/admin/portfolio/:id', requireAuth, (req, res) => {
  const ok = db.deletePortfolioItem(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Portfolio item not found.' });
  res.json({ message: 'Portfolio item deleted.' });
});

// Fallback: send index.html for any other non-API route (nice for direct links)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin dashboard at http://localhost:${PORT}/admin.html`);
});
