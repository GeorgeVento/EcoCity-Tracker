'use strict';

(function () {

  // --- Redirect if already logged in ---
  try {
    if (localStorage.getItem('ecocity_user')) {
      window.location.href = 'report.html';
    }
  } catch (e) {}

  // --- DOM references ---
  var tabLogin      = document.getElementById('tabLogin');
  var tabRegister   = document.getElementById('tabRegister');
  var loginPanel    = document.getElementById('loginPanel');
  var registerPanel = document.getElementById('registerPanel');
  var loginForm     = document.getElementById('loginForm');
  var registerForm  = document.getElementById('registerForm');
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
    e.preventDefault();
    showRegister();
  });

  document.getElementById('switchToLogin').addEventListener('click', function (e) {
    e.preventDefault();
    showLogin();
  });

  // Check URL param ?mode=register
  if (new URLSearchParams(window.location.search).get('mode') === 'register') {
    showRegister();
  }

  // --- Toast helper ---
  function showToast(message, type) {
    type = type || 'success';
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3500);
  }

  // --- Validation helpers ---
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setError(groupId, show) {
    var el = document.getElementById(groupId);
    if (!el) return;
    if (show) {
      el.classList.add('has-error');
    } else {
      el.classList.remove('has-error');
    }
  }

  function validateEmail(val) {
    return emailRegex.test(val.trim());
  }

  // --- Blur validation ---
  document.getElementById('loginEmail').addEventListener('blur', function () {
    setError('grpLoginEmail', !validateEmail(this.value));
  });
  document.getElementById('regFullName').addEventListener('blur', function () {
    setError('grpFullName', this.value.trim() === '');
  });
  document.getElementById('regEmail').addEventListener('blur', function () {
    setError('grpRegEmail', !validateEmail(this.value));
  });
  document.getElementById('regMunicipality').addEventListener('blur', function () {
    setError('grpMunicipality', this.value === '');
  });

  // --- Storage helpers ---
  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem('ecocity_users') || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    try {
      localStorage.setItem('ecocity_users', JSON.stringify(users));
    } catch (e) {}
  }

  function saveSession(user) {
    try {
      localStorage.setItem('ecocity_user', JSON.stringify(user));
    } catch (e) {}
  }

  // --- Login ---
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = document.getElementById('loginEmail').value.trim().toLowerCase();
    var valid = true;

    if (!validateEmail(email)) {
      setError('grpLoginEmail', true);
      valid = false;
    } else {
      setError('grpLoginEmail', false);
    }

    if (!valid) return;

    var users = getUsers();
    var found = null;
    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === email) {
        found = users[i];
        break;
      }
    }

    if (!found) {
      showToast('Δεν βρέθηκε λογαριασμός με αυτό το email. Κάνε πρώτα εγγραφή.', 'error');
      setTimeout(showRegister, 1500);
      return;
    }

    saveSession(found);
    showToast('Καλωσόρισες πίσω, ' + found.fullName + '! Ανακατεύθυνση...', 'success');
    setTimeout(function () {
      window.location.href = 'report.html';
    }, 1200);
  });

  // --- Register ---
  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var fullName         = document.getElementById('regFullName').value.trim();
    var email            = document.getElementById('regEmail').value.trim().toLowerCase();
    var homeMunicipality = document.getElementById('regMunicipality').value;
    var valid            = true;

    if (fullName === '') {
      setError('grpFullName', true);
      valid = false;
    } else {
      setError('grpFullName', false);
    }

    if (!validateEmail(email)) {
      setError('grpRegEmail', true);
      valid = false;
    } else {
      setError('grpRegEmail', false);
    }

    if (homeMunicipality === '') {
      setError('grpMunicipality', true);
      valid = false;
    } else {
      setError('grpMunicipality', false);
    }

    if (!valid) return;

    var users = getUsers();

    // Duplicate email check
    for (var i = 0; i < users.length; i++) {
      if (users[i].email.toLowerCase() === email) {
        showToast('Αυτό το email χρησιμοποιείται ήδη. Δοκίμασε να συνδεθείς.', 'error');
        setTimeout(showLogin, 1500);
        return;
      }
    }

    var user = {
      fullName: fullName,
      email: email,
      homeMunicipality: homeMunicipality,
      registeredAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);
    saveSession(user);

    showToast('Καλωσόρισες, ' + fullName + '! Ανακατεύθυνση...', 'success');
    setTimeout(function () {
      window.location.href = 'report.html';
    }, 1200);
  });

})();
