'use strict';

var API_BASE = '/api';

// ---------------------------------------------------------------
// Detect which page we are on
// ---------------------------------------------------------------
var isLoginPage     = !!document.getElementById('officialLoginForm');
var isDashboardPage = !!document.getElementById('officialDashboard');

if (isLoginPage)     { initLogin(); }
if (isDashboardPage) { initDashboard(); }

// ===============================================================
// LOGIN PAGE
// ===============================================================
function initLogin() {
  // Redirect if already logged in
  try {
    if (localStorage.getItem('ecocity_official')) {
      window.location.href = 'official-dashboard.html';
      return;
    }
  } catch (e) {}

  var form     = document.getElementById('officialLoginForm');
  var btnText  = document.getElementById('loginBtnText');
  var btnSpin  = document.getElementById('loginBtnSpinner');

  // Blur validation
  document.getElementById('offUsername').addEventListener('blur', function () {
    setError('grpUsername', this.value.trim() === '');
  });
  document.getElementById('offPassword').addEventListener('blur', function () {
    setError('grpPassword', this.value === '');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var username = document.getElementById('offUsername').value.trim();
    var password = document.getElementById('offPassword').value;
    var valid = true;

    if (!username) { setError('grpUsername', true); valid = false; }
    else           { setError('grpUsername', false); }
    if (!password) { setError('grpPassword', true); valid = false; }
    else           { setError('grpPassword', false); }

    if (!valid) return;

    btnText.style.display = 'none';
    btnSpin.style.display = 'inline';

    fetch(API_BASE + '/auth/official/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username, password: password })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          var toStore = Object.assign({}, data.official, { token: data.token || '' });
          try { localStorage.setItem('ecocity_official', JSON.stringify(toStore)); } catch (e) {}
          showToast('Καλωσόρισες, ' + data.official.fullName + '!', 'success');
          setTimeout(function () { window.location.href = 'official-dashboard.html'; }, 1200);
        } else {
          showToast(data.message || 'Λάθος στοιχεία σύνδεσης.', 'error');
          btnText.style.display = 'inline';
          btnSpin.style.display = 'none';
        }
      })
      .catch(function () {
        showToast('Σφάλμα σύνδεσης με τον server. Δοκίμασε αργότερα.', 'error');
        btnText.style.display = 'inline';
        btnSpin.style.display = 'none';
      });
  });
}

// ===============================================================
// DASHBOARD PAGE
// ===============================================================
function initDashboard() {
  // Auth guard
  var official = null;
  try { official = JSON.parse(localStorage.getItem('ecocity_official') || 'null'); } catch (e) {}
  if (!official) { window.location.replace('official-login.html'); return; }

  // Fill header info
  document.getElementById('officialNameDisplay').textContent = official.fullName || '—';
  document.getElementById('officialMuniName').textContent    = official.municipality || '—';
  document.getElementById('muniNameHeader').textContent      = official.municipality || '—';

  // Logout
  document.getElementById('btnLogout').addEventListener('click', function () {
    try { localStorage.removeItem('ecocity_official'); } catch (e) {}
    window.location.href = 'official-login.html';
  });

  // State
  var allReports    = [];
  var currentFilter = 'all';
  var searchTerm    = '';

  // Load on page ready
  loadReports();
  loadCitizenCount();

  document.getElementById('btnRefresh').addEventListener('click', function () {
    loadReports();
    loadCitizenCount();
  });

  // ---- Fetch reports ----
  function loadReports() {
    var tbody = document.getElementById('reportsTableBody');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-light);">⏳ Φόρτωση...</td></tr>';

    fetch(API_BASE + '/reports?municipality=' + encodeURIComponent(official.municipality), {
      headers: official.token ? { 'Authorization': 'Bearer ' + official.token } : {}
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        allReports = data.reports || [];
        renderStats(allReports);
        renderTable();
      })
      .catch(function () {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--status-critical);">⚠️ Δεν ήταν δυνατή η φόρτωση. Βεβαιώσου ότι το API είναι ενεργό.</td></tr>';
      });
  }

  // ---- Fetch citizen count for this municipality ----
  function loadCitizenCount() {
    fetch(API_BASE + '/stats/citizens?municipality=' + encodeURIComponent(official.municipality), {
      headers: official.token ? { 'Authorization': 'Bearer ' + official.token } : {}
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        document.getElementById('statCitizens').textContent = data.count != null ? data.count : '—';
      })
      .catch(function () {
        document.getElementById('statCitizens').textContent = '—';
      });
  }

  // ---- Stats ----
  function renderStats(reports) {
    document.getElementById('statTotal').textContent    = reports.length;
    document.getElementById('statPending').textContent  = reports.filter(function (r) { return r.status === 'pending'; }).length;
    document.getElementById('statResolved').textContent = reports.filter(function (r) { return r.status === 'resolved'; }).length;
    document.getElementById('statCritical').textContent = reports.filter(function (r) { return r.severity === 'critical'; }).length;
  }

  // ---- Table ----
  function renderTable() {
    var filtered = allReports.slice();

    if (currentFilter === 'critical') {
      filtered = filtered.filter(function (r) { return r.severity === 'critical'; });
    } else if (currentFilter !== 'all') {
      filtered = filtered.filter(function (r) { return r.status === currentFilter; });
    }

    if (searchTerm) {
      var s = searchTerm.toLowerCase();
      filtered = filtered.filter(function (r) {
        return (r.title    || '').toLowerCase().indexOf(s) !== -1 ||
               (r.category || '').toLowerCase().indexOf(s) !== -1;
      });
    }

    var tbody = document.getElementById('reportsTableBody');

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-light);">Δεν βρέθηκαν αναφορές.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (r) {
      return '<tr>' +
        '<td>#' + r.id + '</td>' +
        '<td>' + escHtml(r.title) + '</td>' +
        '<td>' + escHtml(r.category) + '</td>' +
        '<td><span class="badge-' + r.severity + '">' + severityLabel(r.severity) + '</span></td>' +
        '<td>' + formatDate(r.created_at) + '</td>' +
        '<td>' +
          '<select class="status-select" onchange="window.updateStatus(' + r.id + ', this.value)">' +
            '<option value="pending"' + (r.status === 'pending'  ? ' selected' : '') + '>⏳ Εκκρεμεί</option>' +
            '<option value="reviewed"' + (r.status === 'reviewed' ? ' selected' : '') + '>🔍 Υπό εξέταση</option>' +
            '<option value="resolved"' + (r.status === 'resolved' ? ' selected' : '') + '>✅ Επιλύθηκε</option>' +
          '</select>' +
        '</td>' +
        '<td><button class="btn btn-sm btn-secondary" onclick="window.viewReport(' + r.id + ')">👁 Δες</button></td>' +
      '</tr>';
    }).join('');
  }

  // ---- Filter buttons ----
  document.querySelectorAll('.off-filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.off-filter-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentFilter = this.dataset.filter;
      renderTable();
    });
  });

  // ---- Search ----
  document.getElementById('offSearch').addEventListener('input', function () {
    searchTerm = this.value;
    renderTable();
  });

  // ---- Status update (called from table row) ----
  window.updateStatus = function (id, status) {
    fetch(API_BASE + '/reports/' + id, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, official.token ? { 'Authorization': 'Bearer ' + official.token } : {}),
      body: JSON.stringify({ status: status })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.success) {
          var r = allReports.find(function (r) { return r.id == id; });
          if (r) r.status = status;
          renderStats(allReports);
          showToast('Το status ενημερώθηκε.', 'success');
        } else {
          showToast(data.message || 'Σφάλμα ενημέρωσης.', 'error');
        }
      })
      .catch(function () { showToast('Σφάλμα σύνδεσης.', 'error'); });
  };

  // ---- View report modal ----
  window.viewReport = function (id) {
    var r = allReports.find(function (r) { return r.id == id; });
    if (!r) return;

    document.getElementById('modalTitle').textContent = '#' + r.id + ' — ' + (r.title || '');
    document.getElementById('modalBody').innerHTML =
      '<table style="width:100%;border-collapse:collapse;font-size:.9rem;">' +
        modalRow('Κατηγορία', escHtml(r.category)) +
        modalRow('Σοβαρότητα', '<span class="badge-' + r.severity + '">' + severityLabel(r.severity) + '</span>') +
        modalRow('Status', statusLabel(r.status)) +
        modalRow('Ημερομηνία', formatDate(r.created_at)) +
        (r.reporter_name  ? modalRow('Αναφέρθηκε από', escHtml(r.reporter_name))  : '') +
        (r.reporter_email ? modalRow('Email', escHtml(r.reporter_email)) : '') +
        (r.gps_lat ? modalRow('GPS', r.gps_lat + ', ' + r.gps_lng) : '') +
        '<tr><td colspan="2" style="padding:12px 0;"><strong>Περιγραφή:</strong><br />' + escHtml(r.description) + '</td></tr>' +
        (r.photo_url ? '<tr><td colspan="2" style="padding:8px 0;"><img src="' + escHtml(r.photo_url) + '" style="max-width:100%;border-radius:8px;" /></td></tr>' : '') +
      '</table>';

    var modal = document.getElementById('reportModal');
    modal.style.display = 'flex';
  };

  document.getElementById('closeModal').addEventListener('click', function () {
    document.getElementById('reportModal').style.display = 'none';
  });
  document.getElementById('reportModal').addEventListener('click', function (e) {
    if (e.target === this) this.style.display = 'none';
  });

  function modalRow(label, value) {
    return '<tr style="border-bottom:1px solid var(--border);">' +
      '<td style="padding:8px 12px 8px 0;color:var(--text-mid);white-space:nowrap;font-weight:500;">' + label + '</td>' +
      '<td style="padding:8px 0;">' + value + '</td>' +
    '</tr>';
  }
}

// ===============================================================
// SHARED HELPERS
// ===============================================================
function setError(groupId, show) {
  var el = document.getElementById(groupId);
  if (!el) return;
  if (show) { el.classList.add('has-error'); }
  else      { el.classList.remove('has-error'); }
}

function showToast(message, type) {
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast toast-' + (type || 'success');
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3500);
}

function escHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function severityLabel(s) {
  if (s === 'critical') return '🔴 Κρίσιμο';
  if (s === 'medium')   return '🟡 Μέτριο';
  return '🟢 Χαμηλό';
}

function statusLabel(s) {
  if (s === 'resolved') return '✅ Επιλύθηκε';
  if (s === 'reviewed') return '🔍 Υπό εξέταση';
  return '⏳ Εκκρεμεί';
}

function formatDate(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('el-GR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
