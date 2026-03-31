# 🌿 EcoCity Tracker

## Κοινοτική Εφαρμογή Καταγραφής Περιβαλλοντικών Προβλημάτων

**Διαθεματική Εργασία ΣΑΕΚ ΑΙΓΑΛΕΩ · 4ο Εξάμηνο · 2025-2026**

---

## 📋 Περίληψη

Το **EcoCity Tracker** είναι κοινοτική εφαρμογή *civic technology* υλοποιημένη με καθαρό κώδικα (HTML, CSS, JavaScript, Node.js/Express), που επιτρέπει στους πολίτες να καταγράφουν περιβαλλοντικά προβλήματα της πόλης τους:

- Σκουπίδια
- Υποδομές
- Ηχορύπανση
- Ποιότητα αέρα
- Υγεία
- Έκτακτες ανάγκες

Τα δεδομένα οργανώνονται ανά **Δήμο της Αττικής**. Κάθε δήμος έχει **ξεχωριστή σελίδα σύνδεσης** για τον αρμόδιο διαχειριστή, ο οποίος βλέπει **μόνο** τα δεδομένα της περιοχής ευθύνης του.

### Σύστημα Login

- **Πολίτης:** Συνδέεται βάσει δήμου κατοικίας. Μπορεί να αναφέρει πρόβλημα και σε γειτονικό δήμο (για συνοριακές περιοχές).
- **Admin Δήμου:** Ξεχωριστή σελίδα σύνδεσης. Βλέπει, αλλάζει status, και κάνει export **μόνο** για τον δήμο του.

**Εκτιμώμενη Παράδοση:** 22 Απριλίου 2026

---

## 👥 Ομάδα

| Μέλος | Ρόλος |
|-------|-------|
| 🟢 Γιώργος-Λεωνίδας Βεντουράτος | Επικεφαλής — Αρχιτεκτονική, HTML/CSS, Login system, Ασφάλεια, Τεκμηρίωση, Εβδομαδιαία ανάθεση εργασιών |
| 🔵 Δήμος Χριστοδούλου | Backend Node.js/Express, REST API, JWT Auth, Export Excel, Admin Panel |
| 🟣 Γιώργος Παπαδάκης | JavaScript Frontend, Chart.js, Ranking, Notifications, Testing |

📧 g.l.ventouratos@gmail.com
🏫 ΣΑΕΚ ΑΙΓΑΛΕΩ

> **Σημείωση οργάνωσης:** Ο επικεφαλής (Βεντουράτος) αναθέτει εβδομαδιαία τις συγκεκριμένες εργασίες σε κάθε μέλος, ανάλογα με την πρόοδο του project.

---

## 🛠️ Τεχνολογίες

| Layer | Τεχνολογία | Χρήση |
|-------|-----------|-------|
| 🖥️ Frontend | HTML5 + CSS3 + JavaScript ES6+ | Σελίδες, φόρμες, AJAX, GPS, Charts |
| ⚙️ Backend | Node.js + Express | REST API, routing, middleware |
| 🔑 Auth | JWT (jsonwebtoken) | Login ανά δήμο, role-based access |
| 🗄️ Data | JSON files | Αποθήκευση αναφορών, χρηστών, δήμων |
| 📊 Charts | Chart.js | Στατιστικά bar + doughnut |
| 📤 Export | SheetJS (xlsx) | Excel export αναφορών |
| 📁 Uploads | multer | Ανέβασμα φωτογραφιών |
| 🔀 VCS | Git + GitHub | Version control |

---

## 📁 Δομή Φακέλων

```
ecocity-tracker/
├── index.html                   ← Αρχική σελίδα
├── html/
│   ├── report.html              ← Φόρμα αναφοράς (GPS + photo)
│   ├── stats.html               ← Στατιστικά Chart.js
│   ├── ranking.html             ← Ranking δήμων
│   ├── admin.html               ← Admin panel
│   ├── login.html               ← Login πολίτη ανά δήμο
│   └── admin-login.html         ← Login admin ανά δήμο
├── css/
│   └── main.css                 ← Design system, severity badges
├── js/
│   ├── main.js                  ← Navigation, counters
│   ├── report.js                ← fetch POST, GPS, photo, validation
│   ├── stats.js                 ← Chart.js
│   ├── ranking.js               ← Dynamic ranking cards
│   ├── admin.js                 ← Status change, export
│   ├── login.js                 ← JWT login logic
│   └── notifications.js         ← Polling, badge counter
├── api/
│   ├── server.js                ← Express server
│   ├── auth.js                  ← JWT login/verify
│   ├── reports.js               ← CRUD endpoints
│   ├── stats.js                 ← Stats aggregation
│   ├── ranking.js               ← Ranking calculation
│   ├── export.js                ← Excel export
│   └── notifications.js         ← Notification logic
├── middleware/
│   ├── auth.middleware.js        ← JWT verification
│   └── municipality.guard.js    ← Admin isolation
├── data/
│   ├── reports.json
│   ├── users.json
│   └── municipalities.json
├── uploads/
├── .env                         ← JWT_SECRET (στο .gitignore!)
├── package.json
├── .gitignore
└── README.md
```

---

## 🚀 Εγκατάσταση & Εκτέλεση

### Προαπαιτούμενα

- Node.js v18+
- VS Code
- Git

### Βήματα

```bash
# Clone
git clone https://github.com/georgevento/ecocity-tracker.git
cd ecocity-tracker

# Install
npm install

# Start
node api/server.js
# ή με auto-reload:
npx nodemon api/server.js
```

🌐 Άνοιξε: `http://localhost:3000`

---

## 👤 Δοκιμαστικοί Λογαριασμοί

| Username | Password | Role | Δήμος | Login URL |
|----------|---------|------|-------|----------|
| admin_aigaleo | admin123 | admin | Αιγάλεω | /admin-login |
| admin_athens | admin123 | admin | Αθήνα | /admin-login |
| user_george | user123 | user | Αιγάλεω | /login |
| user_maria | user123 | user | Αθήνα | /login |

---

## 🔌 REST API Endpoints

| Method | Endpoint | Περιγραφή | Auth |
|--------|---------|-----------|------|
| POST | `/api/auth/login` | Login, επιστρέφει JWT | Public |
| POST | `/api/reports` | Νέα αναφορά (photo + GPS) | JWT user |
| GET | `/api/reports?municipality=X` | Λίστα αναφορών | JWT admin (φίλτρο δήμου) |
| PUT | `/api/reports/:id/status` | Αλλαγή status | JWT admin |
| GET | `/api/stats?municipality=X` | Στατιστικά | Public |
| GET | `/api/ranking` | Ranking δήμων | Public |
| GET | `/api/export?municipality=X` | Excel export | JWT admin |

---

## ✅ Λειτουργικές Απαιτήσεις

| ID | Λειτουργία | Κατάσταση |
|----|-----------|----------|
| F1 | Δομή project & HTML σκελετός | ☐ |
| F2 | Login πολίτη ανά δήμο | ☐ |
| F3 | Login admin ανά δήμο | ☐ |
| F4 | Φόρμα αναφοράς (photo + GPS) | ☐ |
| F5 | REST API endpoints (CRUD) | ☐ |
| F6 | Admin panel ανά δήμο | ☐ |
| F7 | Export Excel | ☐ |
| F8 | AJAX + GPS + photo preview | ☐ |
| F9 | Στατιστικά Chart.js | ☐ |
| F10 | Ranking δήμων | ☐ |
| F11 | Notifications | ☐ |
| F12 | Αναφορά σε γειτονικό δήμο | ☐ |

---

## 🔒 Ασφάλεια

| Απειλή | Προστασία |
|--------|----------|
| XSS | `textContent` / `DOMPurify.sanitize()` |
| Unauthorized API | `JWT verify` middleware σε κάθε protected route |
| Cross-municipality leak | `municipality.guard.js`: JWT payload === requested municipality |
| File upload abuse | `multer`: whitelist MIME types, max 5MB |
| Brute force | `express-rate-limit`: 100 req/15min per IP |
| Secrets | `.env` για JWT_SECRET, στο `.gitignore` |

---

## 🌐 Διαθεματική Σύνδεση

- 💻 **Πληροφορική** → HTML/CSS/JS, Node.js, REST API, JWT, Git
- 🌱 **Βιολογία** → Κατηγορίες ρύπανσης, υγεία
- 🗺️ **Γεωγραφία** → Δήμοι Αττικής, GPS coordinates, ranking
- 📊 **Μαθηματικά** → Στατιστικά, Chart.js, resolution rate
- 🏛️ **Κοινωνική Αγωγή** → Civic tech, τοπική αυτοδιοίκηση
- ✏️ **Γλώσσα** → Τεκμηρίωση, README, Τεχνική Αναφορά

---

## 🏙️ Δήμοι Αττικής

Αθήνα · Πειραιάς · Αιγάλεω · Νίκαια · Περιστέρι · Χαλάνδρι · Γλυφάδα · Καλλιθέα · Ηλιούπολη · Μαρούσι · Κηφισιά · Παλαιό Φάληρο

---

## 🔮 Μελλοντικές Βελτιώσεις

- Leaflet.js (διαδραστικός χάρτης με markers)
- Heatmap
- PWA (Progressive Web App)
- React.js frontend
- PostgreSQL αντί JSON files
- Smart City APIs (ποιότητα αέρα, κυκλοφορία)

---

## 📚 Πηγές

- MDN Web Docs (HTML/CSS/JS/Geolocation/Fetch API)
- Node.js & Express Documentation
- JWT (jsonwebtoken) — npmjs.com
- Chart.js — chartjs.org
- SheetJS — docs.sheetjs.com
- Git Documentation — git-scm.com

---

## 📌 License

EcoCity Tracker
© Βεντουράτος, Χριστοδούλου, Παπαδάκης
ΣΑΕΚ ΑΙΓΑΛΕΩ · 2025-2026
