# 🌿 EcoCity Tracker

## Κοινοτική Εφαρμογή Καταγραφής Περιβαλλοντικών Προβλημάτων

**Διαθεματική Εργασία ΣΑΕΚ ΑΙΓΑΛΕΩ · 4ο Εξάμηνο · 2025-2026**

---

## 📋 Περίληψη

Το **EcoCity Tracker** είναι μια ολοκληρωμένη πλατφόρμα *civic technology* που επιτρέπει στους πολίτες να καταγράφουν περιβαλλοντικά προβλήματα της πόλης τους και στους δήμους να τα διαχειρίζονται οργανωμένα.

**Κατηγορίες αναφορών που υποστηρίζονται:**

- 🗑️ Σκουπίδια & Ανακύκλωση
- 🚧 Υποδομές
- 🔊 Ηχορύπανση
- 🌫️ Ποιότητα Αέρα
- 🏥 Δημόσια Υγεία
- 🚨 Έκτακτες Ανάγκες
- 💡 Δημόσιος Φωτισμός
- 💧 Νερό & Αποχέτευση

Τα δεδομένα οργανώνονται ανά **Δήμο της Αττικής**. Κάθε δήμος έχει **ξεχωριστή σελίδα σύνδεσης** για τον αρμόδιο, ο οποίος βλέπει **μόνο** τα δεδομένα της περιοχής ευθύνης του.

### Σύστημα Login

- **Πολίτης:** Εγγράφεται με δήμο κατοικίας. Επιβεβαίωση μέσω email. Μπορεί να αναφέρει πρόβλημα και σε γειτονικό δήμο για συνοριακές περιοχές.
- **Αρμόδιος Δήμου:** Ξεχωριστή σελίδα σύνδεσης. Βλέπει, αλλάζει status, και κάνει export **μόνο** για τον δήμο του.
- **Superadmin:** Διαχείριση χρηστών, αρμοδίων και αιτημάτων νέων δήμων.

**Εκτιμώμενη Παράδοση:** Μέσα Μαίου(15-20) 2026

---

## 👥 Ομάδα

| Μέλος | Ρόλος | Αρμοδιότητες |
|-------|-------|--------------|
| 🟢 **Γιώργος-Λεωνίδας Βεντουράτος** | Project Lead | Συνολική αρχιτεκτονική, Backend (Express server, REST API, middleware), MySQL schema & migrations, Authentication system (JWT, email verification, forgot/reset password), Ασφάλεια (security headers, source code protection, bcryptjs), HTML/CSS skeleton & design system, core JavaScript (auth, report, official, admin), Nodemailer integration, Deployment configuration, Τεκμηρίωση & Τεχνική Αναφορά, εβδομαδιαίος συντονισμός ομάδας |
| 🔵 **Δήμος Χριστοδούλου** | Backend Support & UI Polish | Mobile responsive breakpoints σε όλο το main.css, Excel export endpoint (SheetJS integration), βελτιώσεις στο admin panel (dashboard cards, status filters, table styling), CSS optimization στις σελίδες ranking & stats, municipalities login with safety features, code reviews |
| 🟣 **Γιώργος Παπαδάκης** | Frontend & Data Visualization | Chart.js dashboards (bar / doughnut / line) στη σελίδα στατιστικών, Help Center with FAQ and Live Chat, Ranking page logic & δυναμικές κάρτες, Notifications polling & badge counter, Geolocation API integration στη φόρμα αναφοράς, end-to-end testing |

📧 g.l.ventouratos@gmail.com
🏫 ΣΑΕΚ ΑΙΓΑΛΕΩ 4o Εξάμηνο
---

## 🛠️ Τεχνολογίες

| Layer | Τεχνολογία | Χρήση |
|-------|-----------|-------|
| 🖥️ Frontend | HTML5 + CSS3 + JavaScript ES6+ | Σελίδες, φόρμες, AJAX, GPS, Charts |
| ⚙️ Backend | Node.js 18+ / Express 4 | REST API, routing, middleware |
| 🗄️ Database | MySQL 8 (mysql2/promise) | Persistent storage σε όλους τους πίνακες |
| 🔑 Auth | JWT + bcryptjs | Login πολιτών & αρμοδίων, role-based access |
| 📧 Email | Nodemailer (SMTP) | Verification & reset password |
| 📊 Charts | Chart.js 4 | Στατιστικά bar + doughnut + line |
| 📤 Export | SheetJS (xlsx) | Excel export αναφορών |
| 📁 Uploads | multer | Ανέβασμα φωτογραφιών (max 5MB) |
| 🔀 VCS | Git + GitHub | Version control & συνεργασία ομάδας |

---

## 📁 Δομή Φακέλων

```
ecocity-tracker/
├── index.html                    ← Αρχική σελίδα
├── Procfile                      ← Cloud hosting config
├── package.json                  ← Node.js dependencies
├── .env.example                  ← Template μεταβλητών περιβάλλοντος
│
├── html/                         ← Όλες οι σελίδες της εφαρμογής
│   ├── about.html                ← Σχετικά + φόρμα νέων δήμων
│   ├── auth.html                 ← Login / Register πολίτη
│   ├── forgot-password.html      ← Αίτημα reset
│   ├── reset-password.html       ← Νέος κωδικός με token
│   ├── report.html               ← Φόρμα νέας αναφοράς (GPS + photo)
│   ├── my-reports.html           ← Οι αναφορές μου
│   ├── profile.html              ← Προφίλ χρήστη
│   ├── stats.html                ← Στατιστικά (Chart.js)
│   ├── ranking.html              ← Ranking δήμων
│   ├── help.html                 ← FAQ
│   ├── privacy.html              ← Πολιτική απορρήτου
│   ├── admin-login.html          ← Login superadmin
│   ├── admin.html                ← Admin panel
│   ├── official-login.html       ← Login αρμοδίου δήμου
│   └── official-dashboard.html   ← Dashboard αρμοδίου
│
├── css/main.css                  ← Ενιαίο design system
│
├── js/                           ← Client-side JavaScript
│   ├── main.js, auth.js, report.js, stats.js,
│   ├── ranking.js, admin.js, official.js,
│   └── notifications.js, help.js
│
├── api/                          ← Express routes
│   ├── server.js                 ← Express + security middleware
│   ├── auth.js                   ← Login/register/verify/reset
│   ├── reports.js                ← CRUD αναφορών + photo upload
│   ├── stats.js, ranking.js, export.js,
│   ├── notifications.js, interests.js,
│   ├── municipality-request.js, admin.js
│   └── mailer.js                 ← Nodemailer wrapper
│
├── middleware/
│   ├── auth.middleware.js        ← JWT verification
│   └── municipality.guard.js     ← Απομόνωση δεδομένων ανά δήμο
│
├── database/
│   ├── db.js                     ← MySQL pool + initDB()
│   └── seed.js                   ← Δοκιμαστικά δεδομένα
│
├── data/                         ← Initial JSON seeds
├── uploads/                      ← User-uploaded αρχεία
└── node_modules/                 ← (gitignored)
```

---

## 🚀 Εγκατάσταση & Εκτέλεση

### Προαπαιτούμενα

- Node.js v18 ή νεότερο
- MySQL 8 (τοπικά ή managed)
- Git

### Βήματα

```bash
# 1. Κλωνοποίηση
git clone https://github.com/<organization>/ecocity-tracker.git
cd ecocity-tracker

# 2. Εγκατάσταση dependencies
npm install

# 3. Δημιουργία αρχείου .env με βάση το template
cp .env.example .env
# Συμπληρώνουμε τα credentials της MySQL & του SMTP

# 4. Δημιουργία MySQL βάσης
mysql -u root -p -e "CREATE DATABASE ecocity CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 5. Φόρτωση δοκιμαστικών δεδομένων
npm run seed

# 6. Εκκίνηση server
npm start
# → http://localhost:3000
```

🌐 Άνοιξε: `http://localhost:3000`

---

## 👤 Δοκιμαστικοί Λογαριασμοί

| Username / Email | Password | Ρόλος | Δήμος |
|------------------|----------|-------|-------|
| `superadmin` | `admin123` | Superadmin | — |
| `admin_aigaleo` | `admin123` | Αρμόδιος | Αιγάλεω |
| `admin_athens` | `admin123` | Αρμόδιος | Αθήνα |
| `admin_piraeus` | `admin123` | Αρμόδιος | Πειραιάς |
| `user_george@test.gr` | `user123` | Πολίτης | Αιγάλεω |
| `user_maria@test.gr` | `user123` | Πολίτης | Αθήνα |

> **Gate password για είσοδο αρμοδίων:** `@Ec0City_D1m0s!26`

---

## 🔌 REST API Endpoints

| Method | Endpoint | Auth |
|--------|---------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/verify/:token` | Public |
| POST | `/api/auth/forgot-password` | Public |
| POST | `/api/auth/reset-password` | Public |
| POST | `/api/auth/official-login` | Public |
| POST | `/api/reports` | JWT user |
| GET | `/api/reports?municipality=X` | JWT official |
| GET | `/api/reports/mine` | JWT user |
| PUT | `/api/reports/:id/status` | JWT official |
| GET | `/api/stats?municipality=X` | Public |
| GET | `/api/ranking` | Public |
| GET | `/api/notifications/count` | JWT official |
| POST | `/api/interests` | Public |
| POST | `/api/municipality-request` | Public |
| GET | `/api/export?municipality=X` | JWT official |
| GET | `/api/health` | Public |

---

## ✅ Λειτουργικές Απαιτήσεις

| ID | Λειτουργία | Status |
|----|-----------|--------|
| F1–F17 | Core (auth, reports, stats, ranking, dashboards, export, notifications, help, privacy) | ✅ Ολοκληρωμένο |
| F18 | Φόρμα ενδιαφέροντος για νέους δήμους (εμπλουτισμένη έκδοση) | 🟡 Σε εξέλιξη |
| F19 | Production deployment σε hosting platform | 🟡 Σε εξέλιξη |
| F20 | Δοκιμές Live chat με πραγματικούς χρήστες και αλλαγές | 🟡 Σε εξέλιξη |
| F21 | End-to-end testing της MySQL σε production | 🟡 Σε εξέλιξη |


---

## 🔒 Ασφάλεια

| Απειλή | Προστασία |
|--------|----------|
| SQL Injection | Prepared statements σε όλα τα MySQL queries |
| Password leakage | bcryptjs hashing (10 salt rounds), ποτέ plain text |
| XSS | `textContent` / `DOMPurify.sanitize()` — ποτέ innerHTML με user data |
| Unauthorized API | JWT verify middleware σε κάθε protected route |
| Cross-municipality leak | `municipality.guard.js`: JWT payload === requested municipality |
| File upload abuse | `multer`: whitelist MIME types, max 5MB |
| Source code exposure | Custom middleware blocks `/api/*`, `/database/*`, dotfiles |
| Brute force | `express-rate-limit` plan για production |
| Secrets | `.env` (gitignored), template στο `.env.example` |
| Clickjacking & MIME sniffing | `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff` |

---

## 🌐 Διαθεματική Σύνδεση

- 💻 **Πληροφορική** → Full-stack web app, REST API, JWT, Git/GitHub
- 🗄️ **Βάσεις Δεδομένων** → MySQL schema, indexes, FK, prepared statements
- 🌱 **Βιολογία** → Κατηγορίες ρύπανσης, επιπτώσεις στην υγεία
- 🗺️ **Γεωγραφία** → Δήμοι Αττικής, GPS coordinates, ranking
- 📊 **Μαθηματικά** → Στατιστικά, resolution rate, οπτικοποίηση Chart.js
- 🏛️ **Κοινωνική Αγωγή** → Civic tech, τοπική αυτοδιοίκηση, ενεργός πολίτης
- ✏️ **Γλώσσα** → Τεκμηρίωση, README, Τεχνική Αναφορά

---

## 🏙️ Δήμοι Αττικής (Φάση 1)

Αθήνα · Πειραιάς · Αιγάλεω · Νίκαια · Περιστέρι · Χαλάνδρι · Γλυφάδα · Καλλιθέα · Ηλιούπολη · Μαρούσι · Κηφισιά · Παλαιό Φάληρο

> Νέοι δήμοι μπορούν να δηλώσουν ενδιαφέρον μέσω της φόρμας στο `/html/about.html`.

---

## 🔮 Μελλοντικές Βελτιώσεις

- 🗺️ Leaflet.js — Διαδραστικός χάρτης με markers ανά αναφορά
- 🔥 Heatmap — Οπτικοποίηση πυκνότητας προβλημάτων
- 📱 PWA (Progressive Web App) — Offline & push notifications
- ⚛️ React.js frontend — Component-based αρχιτεκτονική
- 🌍 Smart City APIs — Ποιότητα αέρα, κυκλοφορία σε real-time
- 🌐 Multi-language support — Αγγλικά για τουρίστες
- 📲 Native mobile apps για iOS & Android

---

## 📚 Πηγές

- MDN Web Docs — HTML, CSS, JavaScript, Geolocation, Fetch API
- Node.js & Express Documentation
- MySQL Reference & mysql2 (npm)
- JWT (jsonwebtoken), bcryptjs — npmjs.com
- Chart.js — chartjs.org
- SheetJS — docs.sheetjs.com
- Nodemailer — nodemailer.com
- multer, DOMPurify — npmjs.com
- Git Documentation — git-scm.com
- OWASP Top 10 — owasp.org

---

## 📌 License

EcoCity Tracker
© Βεντουράτος, Χριστοδούλου, Παπαδάκης
ΣΑΕΚ ΑΙΓΑΛΕΩ · 2025-2026
