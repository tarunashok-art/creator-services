// Lightweight JSON-file datastore. No native dependencies required, so it
// installs and runs anywhere Node.js runs — no build tools needed.

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = { leads: [], portfolio: [], nextLeadId: 1, nextPortfolioId: 1 };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ---------- Leads ----------

function createLead({ name, email, phone, service, budget, message }) {
  const data = loadData();
  const lead = {
    id: data.nextLeadId++,
    name,
    email,
    phone: phone || '',
    service: service || '',
    budget: budget || '',
    message: message || '',
    status: 'new',
    created_at: new Date().toISOString(),
  };
  data.leads.unshift(lead);
  saveData(data);
  return lead;
}

function getLeads() {
  return loadData().leads;
}

function updateLeadStatus(id, status) {
  const data = loadData();
  const lead = data.leads.find((l) => l.id === Number(id));
  if (!lead) return false;
  lead.status = status;
  saveData(data);
  return true;
}

function deleteLead(id) {
  const data = loadData();
  const before = data.leads.length;
  data.leads = data.leads.filter((l) => l.id !== Number(id));
  saveData(data);
  return data.leads.length < before;
}

// ---------- Portfolio ----------

function createPortfolioItem({ title, category, image_url, link_url, description, sort_order }) {
  const data = loadData();
  const item = {
    id: data.nextPortfolioId++,
    title,
    category,
    image_url: image_url || '',
    link_url: link_url || '',
    description: description || '',
    sort_order: Number.isFinite(sort_order) ? sort_order : 0,
    created_at: new Date().toISOString(),
  };
  data.portfolio.push(item);
  saveData(data);
  return item;
}

function getPortfolio() {
  const data = loadData();
  return [...data.portfolio].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return new Date(b.created_at) - new Date(a.created_at);
  });
}

function updatePortfolioItem(id, fields) {
  const data = loadData();
  const item = data.portfolio.find((p) => p.id === Number(id));
  if (!item) return false;
  Object.assign(item, {
    title: fields.title ?? item.title,
    category: fields.category ?? item.category,
    image_url: fields.image_url ?? item.image_url,
    link_url: fields.link_url ?? item.link_url,
    description: fields.description ?? item.description,
    sort_order: Number.isFinite(fields.sort_order) ? fields.sort_order : item.sort_order,
  });
  saveData(data);
  return true;
}

function deletePortfolioItem(id) {
  const data = loadData();
  const before = data.portfolio.length;
  data.portfolio = data.portfolio.filter((p) => p.id !== Number(id));
  saveData(data);
  return data.portfolio.length < before;
}

module.exports = {
  createLead,
  getLeads,
  updateLeadStatus,
  deleteLead,
  createPortfolioItem,
  getPortfolio,
  updatePortfolioItem,
  deletePortfolioItem,
};
