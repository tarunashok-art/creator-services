const API_BASE = '';
const TOKEN_KEY = 'studio_admin_token';

const loginView = document.getElementById('loginView');
const dashboardView = document.getElementById('dashboardView');
const loginForm = document.getElementById('loginForm');
const loginMsg = document.getElementById('loginMsg');
const logoutBtn = document.getElementById('logoutBtn');

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}
function setToken(t) {
  sessionStorage.setItem(TOKEN_KEY, t);
}
function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${getToken()}`,
    },
  });
  if (res.status === 401) {
    clearToken();
    showLogin();
    throw new Error('Session expired. Please log in again.');
  }
  return res;
}

function showLogin() {
  loginView.style.display = 'block';
  dashboardView.style.display = 'none';
}
function showDashboard() {
  loginView.style.display = 'none';
  dashboardView.style.display = 'block';
  loadLeads();
  loadPortfolio();
}

if (getToken()) {
  showDashboard();
} else {
  showLogin();
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginMsg.textContent = '';
  loginMsg.className = 'form-msg';

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');
    setToken(data.token);
    showDashboard();
  } catch (err) {
    loginMsg.textContent = err.message;
    loginMsg.classList.add('err');
  }
});

logoutBtn.addEventListener('click', () => {
  clearToken();
  showLogin();
});

// ---------- Tabs ----------

document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Panel').classList.add('active');
  });
});

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

// ---------- Leads ----------

const leadsTableWrap = document.getElementById('leadsTableWrap');

async function loadLeads() {
  try {
    const res = await apiFetch('/api/admin/leads');
    const leads = await res.json();

    if (leads.length === 0) {
      leadsTableWrap.innerHTML = '<p class="empty-note">No leads yet. They\'ll show up here as soon as someone submits the contact form.</p>';
      return;
    }

    leadsTableWrap.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Date</th><th>Name</th><th>Contact</th><th>Service</th><th>Budget</th><th>Message</th><th>Status</th><th></th>
          </tr>
        </thead>
        <tbody>
          ${leads.map((l) => `
            <tr data-id="${l.id}">
              <td>${new Date(l.created_at).toLocaleDateString()}</td>
              <td>${escapeHtml(l.name)}</td>
              <td>${escapeHtml(l.email)}${l.phone ? '<br>' + escapeHtml(l.phone) : ''}</td>
              <td>${escapeHtml(l.service)}</td>
              <td>${escapeHtml(l.budget)}</td>
              <td class="msg-cell">${escapeHtml(l.message)}</td>
              <td>
                <select class="status-select" data-id="${l.id}">
                  ${['new', 'contacted', 'won', 'lost'].map((s) => `<option value="${s}" ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}
                </select>
              </td>
              <td><button class="icon-btn" data-delete-lead="${l.id}">Delete</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    leadsTableWrap.querySelectorAll('.status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        try {
          await apiFetch(`/api/admin/leads/${sel.dataset.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: sel.value }),
          });
        } catch (err) {
          alert(err.message);
        }
      });
    });

    leadsTableWrap.querySelectorAll('[data-delete-lead]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this lead? This cannot be undone.')) return;
        try {
          await apiFetch(`/api/admin/leads/${btn.dataset.deleteLead}`, { method: 'DELETE' });
          loadLeads();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    leadsTableWrap.innerHTML = `<p class="empty-note">${escapeHtml(err.message)}</p>`;
  }
}

// ---------- Portfolio ----------

const portfolioForm = document.getElementById('portfolioForm');
const pfMsg = document.getElementById('pfMsg');
const portfolioTableWrap = document.getElementById('portfolioTableWrap');

portfolioForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  pfMsg.textContent = '';
  pfMsg.className = 'form-msg';

  const payload = {
    title: document.getElementById('pfTitle').value.trim(),
    category: document.getElementById('pfCategory').value.trim(),
    image_url: document.getElementById('pfImage').value.trim(),
    link_url: document.getElementById('pfLink').value.trim(),
    description: document.getElementById('pfDescription').value.trim(),
  };

  try {
    const res = await apiFetch('/api/admin/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not add item.');
    pfMsg.textContent = 'Added to portfolio.';
    pfMsg.classList.add('ok');
    portfolioForm.reset();
    loadPortfolio();
  } catch (err) {
    pfMsg.textContent = err.message;
    pfMsg.classList.add('err');
  }
});

async function loadPortfolio() {
  try {
    const res = await fetch(`${API_BASE}/api/portfolio`);
    const items = await res.json();

    if (items.length === 0) {
      portfolioTableWrap.innerHTML = '<p class="empty-note">No portfolio items yet. Add your first one above.</p>';
      return;
    }

    portfolioTableWrap.innerHTML = `
      <table>
        <thead><tr><th>Title</th><th>Category</th><th>Description</th><th></th></tr></thead>
        <tbody>
          ${items.map((p) => `
            <tr data-id="${p.id}">
              <td>${escapeHtml(p.title)}</td>
              <td>${escapeHtml(p.category)}</td>
              <td class="msg-cell">${escapeHtml(p.description || '')}</td>
              <td><button class="icon-btn" data-delete-portfolio="${p.id}">Delete</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    portfolioTableWrap.querySelectorAll('[data-delete-portfolio]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this portfolio item?')) return;
        try {
          await apiFetch(`/api/admin/portfolio/${btn.dataset.deletePortfolio}`, { method: 'DELETE' });
          loadPortfolio();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    portfolioTableWrap.innerHTML = `<p class="empty-note">Couldn't load portfolio items.</p>`;
  }
}
