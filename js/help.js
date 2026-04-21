'use strict';

/* ============================================================
   EcoCity Tracker — js/help.js
   Βεντουράτος, Χριστοδούλου, Παπαδάκης · ΣΑΕΚ ΑΙΓΑΛΕΩ 2026
   ============================================================ */

var currentUser = null;

/* ─── Session ─────────────────────────────────────────────── */
function checkSession() {
  try {
    var stored = localStorage.getItem('ecocity_user');
    if (stored) currentUser = JSON.parse(stored);
  } catch (e) {
    localStorage.removeItem('ecocity_user');
    currentUser = null;
  }
}

/* ─── Redirect to login ────────────────────────────────────── */
function goToLogin() {
  localStorage.setItem('ecocity_redirect', window.location.pathname + '?tab=report');
  window.location.href = 'auth.html';
}

/* ─── Open Tawk.to chat window ─────────────────────────────── */
function openTawk() {
  if (typeof Tawk_API !== 'undefined' && Tawk_API.maximize) {
    Tawk_API.maximize();
  }
}

/* ─── Handle "Live Chat" tab click ────────────────────────── */
function handleChatTab() {
  showTab('report');
  if (!currentUser) {
    document.getElementById('chatLoginPrompt').style.display = 'flex';
    document.getElementById('chatReady').style.display = 'none';
  } else {
    document.getElementById('chatLoginPrompt').style.display = 'none';
    document.getElementById('chatReady').style.display = 'flex';

    if (typeof Tawk_API !== 'undefined') {
      var attrs = {
        name:  currentUser.fullName || currentUser.username || '',
        email: currentUser.email   || ''
      };
      Tawk_API.onLoad = function () {
        Tawk_API.setAttributes(attrs, function () {});
        Tawk_API.maximize();
      };
      if (Tawk_API.maximize) {
        try { Tawk_API.setAttributes(attrs, function () {}); } catch (e) {}
        Tawk_API.maximize();
      }
    }
  }
}

/* ─── Tab switching ────────────────────────────────────────── */
function showTab(tab) {
  var tabs = ['faq', 'municipality', 'report'];
  tabs.forEach(function (t) {
    var panel = document.getElementById('panel-' + t);
    var btn   = document.getElementById('tab-'   + t);
    if (panel) panel.classList.toggle('active', t === tab);
    if (btn)   btn.classList.toggle('active', t === tab);
  });
  var navFaq    = document.getElementById('navFaq');
  var navReport = document.getElementById('navReport');
  if (navFaq)    navFaq.classList.toggle('active', tab === 'faq');
  if (navReport) navReport.classList.toggle('active', tab === 'report');
  var links = document.getElementById('navLinks');
  if (links) links.classList.remove('open');
}

/* ─── FAQ accordion ────────────────────────────────────────── */
function toggleFaq(el) {
  var wasOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(function (i) { i.classList.remove('open'); });
  if (!wasOpen) el.classList.add('open');
}

/* ─── Municipality form — file selection ───────────────────── */
function handleFileSelect(input) {
  var file = input.files[0];
  if (!file) return;
  var area = document.getElementById('munUploadArea');
  document.getElementById('munUploadPlaceholder').style.display = 'none';
  document.getElementById('munUploadSelected').style.display    = 'flex';
  document.getElementById('munFileName').textContent = file.name;
  document.getElementById('munFileSize').textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
  area.classList.add('has-file');
  setFieldError('errDocument', false);
}

function clearFile(e) {
  e.stopPropagation();
  var input = document.getElementById('munDocument');
  input.value = '';
  document.getElementById('munUploadPlaceholder').style.display = 'block';
  document.getElementById('munUploadSelected').style.display    = 'none';
  document.getElementById('munUploadArea').classList.remove('has-file');
}

/* ─── Municipality form — validation helpers ───────────────── */
function setFieldError(errId, show, msg) {
  var el = document.getElementById(errId);
  if (!el) return;
  el.style.display = show ? 'block' : 'none';
  if (msg) el.textContent = msg;
  var group = el.closest('.form-group');
  if (group) group.classList.toggle('has-error', show);
}

function validateMunForm() {
  var ok = true;
  var fullName     = document.getElementById('munFullName').value.trim();
  var municipality = document.getElementById('munMunicipality').value.trim();
  var email        = document.getElementById('munEmail').value.trim();
  var file         = document.getElementById('munDocument').files[0];

  if (!fullName) { setFieldError('errFullName', true); ok = false; }
  else            { setFieldError('errFullName', false); }

  if (!municipality) { setFieldError('errMunicipality', true); ok = false; }
  else                { setFieldError('errMunicipality', false); }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setFieldError('errEmail', true, 'Απαιτείται έγκυρο email.'); ok = false;
  } else {
    setFieldError('errEmail', false);
  }

  if (!file) { setFieldError('errDocument', true); ok = false; }
  else        { setFieldError('errDocument', false); }

  return ok;
}

/* ─── Municipality form — submit ───────────────────────────── */
function submitMunForm(e) {
  e.preventDefault();
  if (!validateMunForm()) return;

  var btn      = document.getElementById('munSubmitBtn');
  var btnText  = document.getElementById('munBtnText');
  var btnLoader = document.getElementById('munBtnLoader');
  var errBox   = document.getElementById('munError');

  btn.disabled     = true;
  btnText.style.display  = 'none';
  btnLoader.style.display = 'inline';
  errBox.style.display   = 'none';

  var fd = new FormData();
  fd.append('fullName',     document.getElementById('munFullName').value.trim());
  fd.append('municipality', document.getElementById('munMunicipality').value.trim());
  fd.append('position',     document.getElementById('munPosition').value.trim());
  fd.append('email',        document.getElementById('munEmail').value.trim());
  fd.append('phone',        document.getElementById('munPhone').value.trim());
  fd.append('message',      document.getElementById('munMessage').value.trim());
  fd.append('document',     document.getElementById('munDocument').files[0]);

  fetch('/api/municipality-request', { method: 'POST', body: fd })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.ok) {
        document.getElementById('munForm').style.display    = 'none';
        document.getElementById('munSuccess').style.display = 'block';
        showToast('✅ Το αίτημά σας στάλθηκε επιτυχώς!', 'success');
      } else {
        throw new Error(data.error || 'Άγνωστο σφάλμα.');
      }
    })
    .catch(function (err) {
      errBox.textContent    = '⚠️ ' + (err.message || 'Σφάλμα αποστολής. Δοκιμάστε ξανά.');
      errBox.style.display  = 'flex';
      btn.disabled          = false;
      btnText.style.display  = 'inline';
      btnLoader.style.display = 'none';
    });
}

/* ─── Municipality form — reset ────────────────────────────── */
function resetMunForm() {
  document.getElementById('munForm').reset();
  document.getElementById('munForm').style.display    = 'block';
  document.getElementById('munSuccess').style.display = 'none';
  clearFile({ stopPropagation: function () {} });
  document.querySelectorAll('.form-group.has-error').forEach(function (g) { g.classList.remove('has-error'); });
  document.querySelectorAll('.form-error').forEach(function (e) { e.style.display = 'none'; });
  document.getElementById('munSubmitBtn').disabled = false;
  document.getElementById('munBtnText').style.display   = 'inline';
  document.getElementById('munBtnLoader').style.display = 'none';
}

/* ─── Nav user display (shared pattern) ───────────────────── */
function initNavUser() {
  var user     = null;
  var official = null;
  try { user     = JSON.parse(localStorage.getItem('ecocity_user')     || 'null'); } catch (e) {}
  try { official = JSON.parse(localStorage.getItem('ecocity_official') || 'null'); } catch (e) {}

  var navUserMenu = document.getElementById('navUserMenu');
  var navUserName = document.getElementById('navUserName');
  var navDropdown = document.getElementById('navDropdown');
  var navUserBtn  = document.getElementById('navUserBtn');

  var nlm = document.getElementById('navLoginMenu');
  if (user || official) {
    if (nlm) nlm.style.display = 'none';
    currentUser = user || official;
    navUserMenu.style.display = 'flex';
    var displayName = (user || official).fullName || (user || official).username || 'Χρήστης';
    navUserName.textContent = displayName + (official ? ' (Αρμόδιος)' : '');
    document.getElementById('navInfoName').textContent  = displayName;
    document.getElementById('navInfoEmail').textContent = (user || official).email || '';

    if (user) {
      document.getElementById('navReports').style.display   = 'block';
      document.getElementById('navDashboard').style.display = 'none';
    } else {
      document.getElementById('navReports').style.display   = 'none';
      document.getElementById('navDashboard').style.display = 'block';
    }

    navUserBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      navDropdown.style.display = navDropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function (e) {
      if (!navUserMenu.contains(e.target)) navDropdown.style.display = 'none';
    });
    document.getElementById('navLogout').addEventListener('click', function (e) {
      e.preventDefault();
      try { localStorage.removeItem('ecocity_user'); localStorage.removeItem('ecocity_official'); } catch (ex) {}
      location.reload();
    });
    document.getElementById('navProfile').addEventListener('click', function (e) {
      e.preventDefault(); window.location.href = 'profile.html';
    });
    document.getElementById('navReports').addEventListener('click', function (e) {
      e.preventDefault(); window.location.href = 'my-reports.html';
    });
    document.getElementById('navDashboard').addEventListener('click', function (e) {
      e.preventDefault(); window.location.href = 'official-dashboard.html';
    });
  } else {
    navUserMenu.style.display = 'none';
    if (nlm) {
      nlm.style.display = 'flex';
      var nlBtn = document.getElementById('navLoginBtn'), nlDrop = document.getElementById('navLoginDropdown');
      if (nlBtn && nlDrop) {
        nlBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          var open = nlDrop.style.display === 'block';
          nlDrop.style.display = open ? 'none' : 'block';
          nlm.classList.toggle('open', !open);
        });
        document.addEventListener('click', function (e) {
          if (!nlm.contains(e.target)) { nlDrop.style.display = 'none'; nlm.classList.remove('open'); }
        });
      }
    }
  }
}

/* ─── Mobile nav toggle ────────────────────────────────────── */
function toggleMobileNav() {
  document.getElementById('navLinks').classList.toggle('open');
  document.getElementById('navToggle').classList.toggle('open');
}

/* ─── Toast ────────────────────────────────────────────────── */
function showToast(msg, type) {
  var container = document.getElementById('toastContainer');
  if (!container) return;
  var t = document.createElement('div');
  t.className = 'toast toast-' + (type || 'success');
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 4000);
}

/* ─── Init ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  checkSession();
  initNavUser();

  var params = new URLSearchParams(window.location.search);
  var tab    = params.get('tab');

  if (tab === 'report') {
    handleChatTab();
  } else if (tab === 'municipality') {
    showTab('municipality');
  }
});
