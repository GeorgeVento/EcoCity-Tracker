'use strict';

(function () {

  // ── Nav Toggle ────────────────────────────────────────────────
  var toggle   = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      navLinks.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        toggle.classList.remove('open');
      }
    });
  }

  // --- Redirect if already logged in ---
  try {
    if (localStorage.getItem('ecocity_user')) {
      window.location.href = 'report.html';
    }
  } catch (e) {}

  // --- DOM references ---
  var tabLogin       = document.getElementById('tabLogin');
  var tabRegister    = document.getElementById('tabRegister');
  var loginPanel     = document.getElementById('loginPanel');
  var registerPanel  = document.getElementById('registerPanel');
  var loginForm      = document.getElementById('loginForm');
  var registerForm   = document.getElementById('registerForm');
  var toastContainer = document.getElementById('toastContainer');

  // --- Tab switching ---
  function showLogin() {
    loginPanel.style.display    = 'block';
    registerPanel.style.display = 'none';
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
  }

  function showRegister() {
    loginPanel.style.display    = 'none';
    registerPanel.style.display = 'block';
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
  }

  tabLogin.addEventListener('click', showLogin);
  tabRegister.addEventListener('click', showRegister);

  document.getElementById('switchToRegister').addEventListener('click', function (e) {
    e.preventDefault(); showRegister();
  });
  document.getElementById('switchToLogin').addEventListener('click', function (e) {
    e.preventDefault(); showLogin();
  });

  if (new URLSearchParams(window.location.search).get('mode') === 'register') showRegister();

  // --- Toast helper ---
  function showToast(message, type) {
    type = type || 'success';
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
  }

  // --- Validation helpers ---
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(groupId, show) {
    var el = document.getElementById(groupId);
    if (!el) return;
    if (show) el.classList.add('has-error');
    else      el.classList.remove('has-error');
  }

  function validateEmail(val) {
    return emailRegex.test(val.trim());
  }

  // --- Blur validation ---
  document.getElementById('loginUsername').addEventListener('blur', function () {
    setError('grpLoginUsername', this.value.trim() === '');
  });
  document.getElementById('loginPassword').addEventListener('blur', function () {
    setError('grpLoginPassword', this.value === '');
  });
  document.getElementById('regFullName').addEventListener('blur', function () {
    setError('grpFullName', this.value.trim() === '');
  });
  document.getElementById('regUsername').addEventListener('blur', function () {
    setError('grpUsername', this.value.trim().length < 3);
  });
  document.getElementById('regEmail').addEventListener('blur', function () {
    setError('grpRegEmail', !validateEmail(this.value));
    var confirm = document.getElementById('regEmailConfirm');
    if (confirm && confirm.value) {
      setError('grpRegEmailConfirm', confirm.value.trim().toLowerCase() !== this.value.trim().toLowerCase());
    }
  });
  document.getElementById('regEmailConfirm').addEventListener('blur', function () {
    var email = document.getElementById('regEmail').value.trim().toLowerCase();
    setError('grpRegEmailConfirm', this.value.trim().toLowerCase() !== email);
  });
  document.getElementById('regMunicipality').addEventListener('blur', function () {
    setError('grpMunicipality', this.value === '');
  });
  document.getElementById('regPassword').addEventListener('blur', function () {
    setError('grpRegPassword', this.value.length < 6);
  });
  document.getElementById('regPasswordConfirm').addEventListener('blur', function () {
    var password = document.getElementById('regPassword').value;
    setError('grpRegPasswordConfirm', this.value !== password);
  });

  // --- Session helper ---
  function saveSession(user) {
    try { localStorage.setItem('ecocity_user', JSON.stringify(user)); } catch (e) {}
  }

  // --- Κλείδωμα / ξεκλείδωμα κουμπιού ---
  function setBusy(form, busy) {
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = busy;
  }

  // ═══════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var username = document.getElementById('loginUsername').value.trim();
    var password = document.getElementById('loginPassword').value;

    if (!username || !password) {
      setError('grpLoginUsername', !username);
      setError('grpLoginPassword', !password);
      return;
    }
    setError('grpLoginUsername', false);
    setError('grpLoginPassword', false);

    setBusy(loginForm, true);

    fetch('/api/auth/citizen/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username: username, password: password })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) {
        showToast(data.message || 'Αποτυχία σύνδεσης.', 'error');
        setBusy(loginForm, false);
        return;
      }
      saveSession(data.user);

      if (!data.user.isVerified) {
        showToast('Σύνδεση επιτυχής! Υπενθύμιση: επιβεβαίωσε το email σου.', 'success');
      } else {
        showToast('Καλωσόρισες πίσω, ' + data.user.fullName + '!', 'success');
      }

      setTimeout(function () { window.location.href = 'report.html'; }, 1200);
    })
    .catch(function () {
      showToast('Δεν ήταν δυνατή η επικοινωνία με τον διακομιστή.', 'error');
      setBusy(loginForm, false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // REGISTER
  // ═══════════════════════════════════════════════════════════
  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var fullName         = document.getElementById('regFullName').value.trim();
    var username         = document.getElementById('regUsername').value.trim();
    var email            = document.getElementById('regEmail').value.trim().toLowerCase();
    var emailConfirm     = document.getElementById('regEmailConfirm').value.trim().toLowerCase();
    var password         = document.getElementById('regPassword').value;
    var passwordConfirm  = document.getElementById('regPasswordConfirm').value;
    var homeMunicipality = document.getElementById('regMunicipality').value;
    var valid            = true;

    if (fullName === '')             { setError('grpFullName',        true);  valid = false; } else { setError('grpFullName',        false); }
    if (username.length < 3)         { setError('grpUsername',        true);  valid = false; } else { setError('grpUsername',        false); }
    if (!validateEmail(email))       { setError('grpRegEmail',        true);  valid = false; } else { setError('grpRegEmail',        false); }
    if (emailConfirm !== email)      { setError('grpRegEmailConfirm', true);  valid = false; } else { setError('grpRegEmailConfirm', false); }
    if (password.length < 6)         { setError('grpRegPassword',     true);  valid = false; } else { setError('grpRegPassword',     false); }
    if (passwordConfirm !== password){ setError('grpRegPasswordConfirm', true); valid = false; } else { setError('grpRegPasswordConfirm', false); }
    if (homeMunicipality === '')     { setError('grpMunicipality',    true);  valid = false; } else { setError('grpMunicipality',    false); }

    if (!valid) return;

    setBusy(registerForm, true);

    fetch('/api/auth/citizen/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fullName: fullName, username: username, email: email, password: password, homeMunicipality: homeMunicipality })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.success) {
        if (data.message && data.message.includes('ήδη')) {
          showToast(data.message, 'error');
          setTimeout(showLogin, 1500);
        } else {
          showToast(data.message || 'Αποτυχία εγγραφής.', 'error');
        }
        setBusy(registerForm, false);
        return;
      }

      // Αποθήκευση session
      saveSession(data.user);

      showToast('Καλωσόρισες, ' + fullName + '! Στάλθηκε email επιβεβαίωσης.', 'success');
      setTimeout(function () { window.location.href = 'report.html'; }, 1500);
    })
    .catch(function () {
      showToast('Δεν ήταν δυνατή η επικοινωνία με τον διακομιστή.', 'error');
      setBusy(registerForm, false);
    });
  });

})();
