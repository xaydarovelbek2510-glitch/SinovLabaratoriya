document.addEventListener('DOMContentLoaded', () => {
  applyI18n(currentLang);

  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.addEventListener('click', () => applyI18n(btn.dataset.lang));
  });

  // ---------- Enhanced Mobile Navigation ----------
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  
  function toggleNav() {
    mainNav.classList.toggle('open');
    const isOpen = mainNav.classList.contains('open');
    navToggle.innerHTML = isOpen ? '✕' : '☰';
    navToggle.setAttribute('aria-expanded', isOpen);
    
    // Prevent body scroll when nav is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }
  
  function closeNav() {
    mainNav.classList.remove('open');
    navToggle.innerHTML = '☰';
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  
  navToggle.addEventListener('click', toggleNav);
  
  // Close nav when clicking on links
  mainNav.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      closeNav();
      // Smooth scroll to target
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    });
  });
  
  // Close nav when clicking outside
  document.addEventListener('click', (e) => {
    if (mainNav.classList.contains('open') && 
        !navToggle.contains(e.target) && 
        !mainNav.contains(e.target)) {
      closeNav();
    }
  });
  
  // Close nav on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav.classList.contains('open')) {
      closeNav();
    }
  });
  
  // Handle resize - close nav if switching to desktop
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (window.innerWidth > 900 && mainNav.classList.contains('open')) {
        closeNav();
      }
    }, 100);
  });

  // ---------- Application form ----------
  const applyForm = document.getElementById('applyForm');
  const applyMsg = document.getElementById('applyMsg');

  applyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    applyMsg.className = 'form-msg';
    applyMsg.textContent = I18N[currentLang].apply_sending;

    const payload = {
      full_name: document.getElementById('fullName').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      email: document.getElementById('email').value.trim(),
      service_type: document.getElementById('serviceType').value,
      message: document.getElementById('message').value.trim(),
    };

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('failed');
      applyMsg.textContent = I18N[currentLang].apply_ok;
      applyMsg.className = 'form-msg ok';
      applyForm.reset();
    } catch (err) {
      applyMsg.textContent = I18N[currentLang].apply_err;
      applyMsg.className = 'form-msg err';
    }
  });

  // ---------- Certificate check ----------
  const checkBtn = document.getElementById('checkBtn');
  const certInput = document.getElementById('certInput');
  const checkMsg = document.getElementById('checkMsg');
  const resultCard = document.getElementById('resultCard');

  async function doCheck() {
    const cert = certInput.value.trim();
    resultCard.classList.add('hidden');
    if (!cert) return;
    checkMsg.className = 'form-msg';
    checkMsg.textContent = I18N[currentLang].check_sending;

    try {
      const res = await fetch(`/api/test-results/${encodeURIComponent(cert)}`);
      if (res.status === 404) {
        checkMsg.textContent = I18N[currentLang].check_notfound;
        checkMsg.className = 'form-msg err';
        return;
      }
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      checkMsg.textContent = '';

      const statusKeyMap = { kutilmoqda: 'st_kutilmoqda', otkazildi: 'st_otkazildi', otkazilmadi: 'st_otkazilmadi' };
      const statusLabel = I18N[currentLang][statusKeyMap[data.status]] || data.status;
      const statusClass = data.status || 'kutilmoqda';

      resultCard.innerHTML = `
        <div class="row"><span>${I18N[currentLang].r_client}</span><span>${escapeHtml(data.client_name)}</span></div>
        <div class="row"><span>${I18N[currentLang].r_sample}</span><span>${escapeHtml(data.sample_type)}</span></div>
        <div class="row"><span>${I18N[currentLang].r_standard}</span><span class="mono">${escapeHtml(data.standard_ref || '—')}</span></div>
        <div class="row"><span>${I18N[currentLang].r_date}</span><span class="mono">${escapeHtml(data.test_date ? data.test_date.substring(0,10) : '—')}</span></div>
        <div class="row"><span>${I18N[currentLang].r_summary}</span><span>${escapeHtml(data.result_summary || '—')}</span></div>
        <div class="row"><span>${I18N[currentLang].r_status}</span><span class="status-pill ${statusClass}">${statusLabel}</span></div>
      `;
      resultCard.classList.remove('hidden');
    } catch (err) {
      checkMsg.textContent = I18N[currentLang].check_notfound;
      checkMsg.className = 'form-msg err';
    }
  }

  checkBtn.addEventListener('click', doCheck);
  certInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doCheck(); });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
