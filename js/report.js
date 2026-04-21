/* js/report.js — Φόρμα αναφοράς: GPS, φωτογραφία, αποθήκευση */
(function () {
  'use strict';

  // ── Auth guard ────────────────────────────────────────────────
  var currentUser = null;
  try { currentUser = JSON.parse(localStorage.getItem('ecocity_user') || 'null'); } catch (e) {}
  if (!currentUser) {
    window.location.href = 'auth.html';
    return;
  }

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

  // ── Toast ─────────────────────────────────────────────────────
  function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'success');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 3500);
  }

  // ── Error helpers ─────────────────────────────────────────────
  function setError(el, show) {
    var g = el.closest ? el.closest('.form-group') : null;
    if (g) { if (show) g.classList.add('has-error'); else g.classList.remove('has-error'); }
  }

  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
  }

  // ── GPS ───────────────────────────────────────────────────────
  var btnGPS    = document.getElementById('btnGPS');
  var gpsStatus = document.getElementById('gpsStatus');

  btnGPS.addEventListener('click', function () {
    btnGPS.textContent = '⏳ Εντοπισμός...';
    btnGPS.disabled = true;

    if (!navigator.geolocation) {
      showToast('Ο browser δεν υποστηρίζει GPS.', 'error');
      resetGpsBtn(); return;
    }

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        document.getElementById('gpsLat').value = pos.coords.latitude.toFixed(6);
        document.getElementById('gpsLng').value = pos.coords.longitude.toFixed(6);
        btnGPS.textContent = '✅ Εντοπίστηκε';
        if (gpsStatus) gpsStatus.textContent = 'Τοποθεσία εντοπίστηκε επιτυχώς.';
        showToast('Τοποθεσία εντοπίστηκε!', 'success');
      },
      function (err) {
        var msg = err.code === 1 ? 'Η πρόσβαση στην τοποθεσία απαγορεύτηκε.' : 'Αδυναμία εντοπισμού τοποθεσίας.';
        showToast(msg, 'error'); resetGpsBtn();
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  });

  function resetGpsBtn() { btnGPS.textContent = '📍 Εντοπισμός'; btnGPS.disabled = false; }

  // ── Photo Upload ──────────────────────────────────────────────
  var photoInput   = document.getElementById('photo');
  var photoPreview = document.getElementById('photoPreview');
  var uploadArea   = document.getElementById('photoUploadArea');
  var photoBase64  = null;

  photoInput.addEventListener('change', function () { readFile(this.files[0]); });

  uploadArea.addEventListener('dragover',  function (e) { e.preventDefault(); uploadArea.classList.add('drag-over'); });
  uploadArea.addEventListener('dragleave', function ()  { uploadArea.classList.remove('drag-over'); });
  uploadArea.addEventListener('drop',      function (e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    var f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) readFile(f);
  });

  function readFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('Η εικόνα υπερβαίνει τα 5MB.', 'error'); return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      photoBase64 = ev.target.result;
      photoPreview.src = photoBase64;
      photoPreview.style.display = 'block';
      var p = uploadArea.querySelector('p');
      if (p) p.style.display = 'none';
    };
    reader.readAsDataURL(file);
  }

  // ── Form Submit ───────────────────────────────────────────────
  document.getElementById('reportForm').addEventListener('submit', function (e) {
    e.preventDefault();

    var titleEl  = document.getElementById('title');
    var muniEl   = document.getElementById('municipality');
    var catEl    = document.getElementById('category');
    var descEl   = document.getElementById('description');
    var sevEl    = document.querySelector('input[name="severity"]:checked');
    var sevErrEl = document.getElementById('severityError');
    var valid    = true;

    if (!titleEl.value.trim()) { setError(titleEl, true);  valid = false; } else { setError(titleEl, false); }
    if (!muniEl.value)         { setError(muniEl,  true);  valid = false; } else { setError(muniEl,  false); }
    if (!catEl.value)          { setError(catEl,   true);  valid = false; } else { setError(catEl,   false); }
    if (!descEl.value.trim())  { setError(descEl,  true);  valid = false; } else { setError(descEl,  false); }
    if (!sevEl) {
      if (sevErrEl) sevErrEl.style.display = 'block'; valid = false;
    } else {
      if (sevErrEl) sevErrEl.style.display = 'none';
    }

    if (!valid) { showToast('Συμπλήρωσε όλα τα υποχρεωτικά πεδία.', 'error'); return; }

    var btn  = document.getElementById('submitBtn');
    var txt  = document.getElementById('submitText');
    var spin = document.getElementById('submitSpinner');
    btn.disabled = true;
    if (txt)  txt.style.display  = 'none';
    if (spin) spin.style.display = 'inline';

    var report = {
      id:            genId(),
      title:         titleEl.value.trim(),
      municipality:  muniEl.value,
      category:      catEl.value,
      severity:      sevEl.value,
      description:   descEl.value.trim(),
      gpsLat:        document.getElementById('gpsLat').value || null,
      gpsLng:        document.getElementById('gpsLng').value || null,
      photo:         photoBase64 || null,
      reporterName:  document.getElementById('reporterName').value.trim(),
      reporterEmail: document.getElementById('reporterEmail').value.trim(),
      userId:        currentUser ? currentUser.id : null,
      status:        'pending',
      createdAt:     new Date().toISOString()
    };

    fetch('/api/reports', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(report)
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (data.success) {
        showToast('Η αναφορά υποβλήθηκε επιτυχώς!', 'success');
      } else {
        showToast('Αποθηκεύτηκε τοπικά. Πρόβλημα με διακομιστή.', 'error');
      }
      setTimeout(function () { window.location.href = '../index.html'; }, 2000);
    })
    .catch(function () {
      showToast('Αδυναμία σύνδεσης. Δοκίμασε ξανά.', 'error');
      btn.disabled = false;
      if (txt)  txt.style.display  = 'inline';
      if (spin) spin.style.display = 'none';
    });
  });

})();
