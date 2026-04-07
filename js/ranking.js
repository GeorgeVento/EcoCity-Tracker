/* js/ranking.js — Κατάταξη δήμων βάσει ποσοστού επίλυσης */
(function () {
  'use strict';

  // ── Nav Toggle ───────────────────────────────────────────────
  var toggle   = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () { navLinks.classList.toggle('open'); });
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) navLinks.classList.remove('open');
    });
  }

  var MUNICIPALITIES = [
    'Αθήνα', 'Πειραιάς', 'Αιγάλεω', 'Νίκαια', 'Περιστέρι',
    'Χαλάνδρι', 'Γλυφάδα', 'Καλλιθέα', 'Ηλιούπολη',
    'Μαρούσι', 'Κηφισιά', 'Παλαιό Φάληρο'
  ];

  // Fallback ποσοστά όταν δεν υπάρχουν αναφορές στο localStorage
  // ── Υπολογισμός κατάταξης ────────────────────────────────────
  function calcRanking() {
    var reports = [];
    try { reports = JSON.parse(localStorage.getItem('ecocity_reports') || '[]'); } catch (e) {}

    var data = MUNICIPALITIES.map(function (muni) {
      var muniR = reports.filter(function (r) { return r.municipality === muni; });
      if (muniR.length === 0) {
        return { name: muni, total: 0, resolved: 0, rate: 0 };
      }
      var resolved = muniR.filter(function (r) { return r.status === 'resolved'; }).length;
      return { name: muni, total: muniR.length, resolved: resolved, rate: Math.round((resolved / muniR.length) * 100) };
    });

    data.sort(function (a, b) { return b.rate - a.rate; });
    return data;
  }

  // ── Render Podium (1η, 2η, 3η θέση) ─────────────────────────
  function renderPodium(top3) {
    var MEDALS = ['🥇', '🥈', '🥉'];
    var COLORS = ['#ffd700', '#c0c0c0', '#cd7f32'];
    var podium = document.getElementById('podium');

    podium.innerHTML = top3.map(function (item, i) {
      return '<div class="podium-card rank-' + (i + 1) + '">' +
        '<div class="podium-position" style="background:' + COLORS[i] + ';color:#fff;width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin:0 auto 12px;">' +
          MEDALS[i] +
        '</div>' +
        '<h3 class="podium-name" style="margin:0 0 4px;font-size:1.1rem;">' + item.name + '</h3>' +
        '<div class="podium-rate" style="font-size:2rem;font-weight:700;color:var(--primary-dark);font-family:var(--font-display);">' + item.rate + '%</div>' +
        '<div class="podium-label" style="font-size:.8rem;color:var(--text-mid);margin-top:4px;">Ποσοστό Επίλυσης</div>' +
        (item.total > 0 ? '<div class="podium-meta" style="font-size:.8rem;color:var(--text-mid);margin-top:6px;">' + item.resolved + '/' + item.total + ' αναφορές</div>' : '') +
        '</div>';
    }).join('');
  }

  // ── Render List (4η–12η θέση) ────────────────────────────────
  function renderList(rest) {
    var list = document.getElementById('rankingList');

    list.innerHTML = rest.map(function (item, i) {
      return '<div class="ranking-row">' +
        '<span class="rank-num">#' + (i + 4) + '</span>' +
        '<span class="rank-name">' + item.name + '</span>' +
        '<div class="rank-bar">' +
          '<div class="rank-bar-fill" data-width="' + item.rate + '" style="width:0%;background:var(--secondary);height:8px;border-radius:4px;transition:width .8s ease;"></div>' +
        '</div>' +
        '<span class="rank-pct">' + item.rate + '%</span>' +
        '</div>';
    }).join('');

    // Trigger bar animation after paint
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.querySelectorAll('.rank-bar-fill[data-width]').forEach(function (el) {
          el.style.width = el.getAttribute('data-width') + '%';
        });
      });
    });
  }

  function render(ranking) {
    renderPodium(ranking.slice(0, 3));
    renderList(ranking.slice(3));
  }

  // Try API, fallback to localStorage calculation
  fetch('/api/ranking')
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.ranking) render(d.ranking); else render(calcRanking()); })
    .catch(function () { render(calcRanking()); });

})();
