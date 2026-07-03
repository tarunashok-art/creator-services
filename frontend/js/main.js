// Same-origin API since the backend serves this frontend directly.
const API_BASE = '';

document.getElementById('year').textContent = new Date().getFullYear();

// ---------- Scrubber: scroll progress + active chapter ----------

const scrubberFill = document.getElementById('scrubberFill');
const chapterLinks = Array.from(document.querySelectorAll('#chapters a'));
const sections = chapterLinks
  .map((a) => document.getElementById(a.dataset.section))
  .filter(Boolean);

function updateScrubber() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
  scrubberFill.style.width = pct + '%';

  let activeId = sections[0] ? sections[0].id : null;
  for (const section of sections) {
    if (section.getBoundingClientRect().top - 120 <= 0) {
      activeId = section.id;
    }
  }
  chapterLinks.forEach((a) => {
    a.classList.toggle('active', a.dataset.section === activeId);
  });
}

window.addEventListener('scroll', updateScrubber, { passive: true });
updateScrubber();

// ---------- Mobile chapter menu ----------

const mobileToggle = document.getElementById('mobileToggle');
const chapters = document.getElementById('chapters');
mobileToggle.addEventListener('click', () => {
  chapters.classList.toggle('open');
});
chapterLinks.forEach((a) => a.addEventListener('click', () => chapters.classList.remove('open')));

// ---------- Portfolio: load + filter ----------

const binGrid = document.getElementById('binGrid');
const binFilters = document.getElementById('binFilters');
let portfolioItems = [];

function renderPortfolio(filter) {
  const items = filter === 'all' ? portfolioItems : portfolioItems.filter((p) => p.category === filter);

  if (items.length === 0) {
    binGrid.innerHTML = '<div class="bin-empty">No work logged in this category yet. Check back soon, or add items from the admin dashboard.</div>';
    return;
  }

  binGrid.innerHTML = items.map((item) => `
    <a class="bin-card" href="${item.link_url ? escapeAttr(item.link_url) : '#'}" ${item.link_url ? 'target="_blank" rel="noopener"' : 'onclick="return false;"'}>
      <div class="bin-thumb">
        ${item.image_url ? `<img src="${escapeAttr(item.image_url)}" alt="${escapeAttr(item.title)}" loading="lazy">` : ''}
        <span class="bin-thumb-tag">${escapeHtml(item.category)}</span>
      </div>
      <div class="bin-body">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.description || '')}</p>
      </div>
    </a>
  `).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

async function loadPortfolio() {
  try {
    const res = await fetch(`${API_BASE}/api/portfolio`);
    portfolioItems = await res.json();

    const categories = ['all', ...new Set(portfolioItems.map((p) => p.category))];
    binFilters.innerHTML = categories.map((c) => `
      <button class="bin-filter ${c === 'all' ? 'active' : ''}" data-filter="${escapeAttr(c)}">${c === 'all' ? 'All' : escapeHtml(c)}</button>
    `).join('');

    binFilters.querySelectorAll('.bin-filter').forEach((btn) => {
      btn.addEventListener('click', () => {
        binFilters.querySelectorAll('.bin-filter').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderPortfolio(btn.dataset.filter);
      });
    });

    renderPortfolio('all');
  } catch (err) {
    binGrid.innerHTML = '<div class="bin-empty">Couldn\'t load portfolio right now.</div>';
  }
}

loadPortfolio();

// ---------- Contact form ----------

const leadForm = document.getElementById('leadForm');
const formMsg = document.getElementById('formMsg');

leadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  formMsg.textContent = '';
  formMsg.className = 'form-msg';

  const submitBtn = leadForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  const payload = {
    name: leadForm.name.value.trim(),
    email: leadForm.email.value.trim(),
    phone: leadForm.phone.value.trim(),
    service: leadForm.service.value,
    budget: leadForm.budget.value.trim(),
    message: leadForm.message.value.trim(),
  };

  try {
    const res = await fetch(`${API_BASE}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Something went wrong.');

    formMsg.textContent = 'Thanks — your inquiry has been sent. I\'ll reply soon.';
    formMsg.classList.add('ok');
    leadForm.reset();
  } catch (err) {
    formMsg.textContent = err.message || 'Could not send your inquiry. Please try again.';
    formMsg.classList.add('err');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Inquiry';
  }
});
