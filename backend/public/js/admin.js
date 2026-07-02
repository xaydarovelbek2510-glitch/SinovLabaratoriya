let token = localStorage.getItem('admin_token') || null;

const loginScreen = document.getElementById('loginScreen');
const panelScreen = document.getElementById('panelScreen');

function showPanel() {
  loginScreen.classList.add('hidden');
  panelScreen.classList.remove('hidden');
  loadResults();
  loadApplications();
}

if (token) showPanel();

document.getElementById('loginBtn').addEventListener('click', async () => {
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');
  msg.textContent = 'Tekshirilmoqda...';
  msg.className = 'form-msg';
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error();
    const data = await res.json();
    token = data.token;
    localStorage.setItem('admin_token', token);
    showPanel();
  } catch {
    msg.textContent = "Parol noto'g'ri";
    msg.className = 'form-msg err';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.removeItem('admin_token');
  token = null;
  location.reload();
});

// ---------- Tabs ----------
document.querySelectorAll('.tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tabResults').classList.toggle('hidden', btn.dataset.tab !== 'results');
    document.getElementById('tabApplications').classList.toggle('hidden', btn.dataset.tab !== 'applications');
  });
});

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

async function apiFetch(url, options = {}) {
  const res = await fetch(url, { ...options, headers: { ...(options.headers || {}), ...authHeaders() } });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    location.reload();
    throw new Error('unauthorized');
  }
  return res;
}

// ---------- Results ----------
document.getElementById('addResultBtn').addEventListener('click', async () => {
  const msg = document.getElementById('resultMsg');
  const payload = {
    cert_number: document.getElementById('r_cert').value.trim(),
    client_name: document.getElementById('r_client').value.trim(),
    sample_type: document.getElementById('r_sample').value.trim(),
    standard_ref: document.getElementById('r_standard').value.trim(),
    test_date: document.getElementById('r_date').value,
    result_summary: document.getElementById('r_summary').value.trim(),
    status: document.getElementById('r_status').value,
  };
  msg.textContent = 'Saqlanmoqda...';
  msg.className = 'form-msg';
  try {
    const res = await apiFetch('/api/admin/test-results', { method: 'POST', body: JSON.stringify(payload) });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Xatolik');
    }
    msg.textContent = 'Saqlandi.';
    msg.className = 'form-msg ok';
    ['r_cert','r_client','r_sample','r_standard','r_date','r_summary'].forEach(id => document.getElementById(id).value = '');
    loadResults();
  } catch (e) {
    msg.textContent = e.message;
    msg.className = 'form-msg err';
  }
});

async function loadResults() {
  const res = await apiFetch('/api/admin/test-results');
  const rows = await res.json();
  
  // Desktop table
  const tbody = document.querySelector('#resultsTable tbody');
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="mono">${escapeHtml(r.cert_number)}</td>
      <td>${escapeHtml(r.client_name)}</td>
      <td>${escapeHtml(r.sample_type)}</td>
      <td class="mono">${r.test_date ? r.test_date.substring(0,10) : ''}</td>
      <td>${escapeHtml(r.status)}</td>
      <td><button class="logout" onclick="deleteResult(${r.id})">O'chirish</button></td>
    </tr>
  `).join('');
  
  // Mobile cards
  const cardsContainer = document.getElementById('resultsCards');
  cardsContainer.innerHTML = rows.map(r => `
    <div class="table-card">
      <div class="card-row">
        <span class="card-label">Sertifikat</span>
        <span class="card-value mono">${escapeHtml(r.cert_number)}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Mijoz</span>
        <span class="card-value">${escapeHtml(r.client_name)}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Namuna</span>
        <span class="card-value">${escapeHtml(r.sample_type)}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Sana</span>
        <span class="card-value mono">${r.test_date ? r.test_date.substring(0,10) : ''}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Holat</span>
        <span class="card-value">${escapeHtml(r.status)}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Amallar</span>
        <span class="card-value">
          <button class="logout" onclick="deleteResult(${r.id})" style="padding: 6px 12px; font-size: 11px;">O'chirish</button>
        </span>
      </div>
    </div>
  `).join('');
}

async function deleteResult(id) {
  if (!confirm("Ushbu natijani o'chirmoqchimisiz?")) return;
  await apiFetch(`/api/admin/test-results/${id}`, { method: 'DELETE' });
  loadResults();
}

// ---------- Applications ----------
async function loadApplications() {
  const res = await apiFetch('/api/admin/applications');
  const rows = await res.json();
  
  // Desktop table
  const tbody = document.querySelector('#applicationsTable tbody');
  tbody.innerHTML = rows.map(a => `
    <tr>
      <td class="mono">${new Date(a.created_at).toLocaleDateString('uz-UZ')}</td>
      <td>${escapeHtml(a.full_name)}</td>
      <td class="mono">${escapeHtml(a.phone)}</td>
      <td>${escapeHtml(a.service_type)}</td>
      <td>${escapeHtml(a.message || '—')}</td>
      <td>
        <select class="small" onchange="updateAppStatus(${a.id}, this.value)">
          <option value="yangi" ${a.status==='yangi'?'selected':''}>Yangi</option>
          <option value="jarayonda" ${a.status==='jarayonda'?'selected':''}>Jarayonda</option>
          <option value="yakunlandi" ${a.status==='yakunlandi'?'selected':''}>Yakunlandi</option>
        </select>
      </td>
    </tr>
  `).join('');
  
  // Mobile cards
  const cardsContainer = document.getElementById('applicationsCards');
  cardsContainer.innerHTML = rows.map(a => `
    <div class="table-card">
      <div class="card-row">
        <span class="card-label">Sana</span>
        <span class="card-value mono">${new Date(a.created_at).toLocaleDateString('uz-UZ')}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Ism</span>
        <span class="card-value">${escapeHtml(a.full_name)}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Telefon</span>
        <span class="card-value mono">${escapeHtml(a.phone)}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Xizmat</span>
        <span class="card-value">${escapeHtml(a.service_type)}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Izoh</span>
        <span class="card-value">${escapeHtml(a.message || '—')}</span>
      </div>
      <div class="card-row">
        <span class="card-label">Holat</span>
        <span class="card-value">
          <select class="small" onchange="updateAppStatus(${a.id}, this.value)" style="width: 100%; padding: 6px;">
            <option value="yangi" ${a.status==='yangi'?'selected':''}>Yangi</option>
            <option value="jarayonda" ${a.status==='jarayonda'?'selected':''}>Jarayonda</option>
            <option value="yakunlandi" ${a.status==='yakunlandi'?'selected':''}>Yakunlandi</option>
          </select>
        </span>
      </div>
    </div>
  `).join('');
}

async function updateAppStatus(id, status) {
  await apiFetch(`/api/admin/applications/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}
