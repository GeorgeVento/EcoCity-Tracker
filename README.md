# 🌿 EcoCity Tracker — WordPress Edition

## Κοινοτική Εφαρμογή Καταγραφής Περιβαλλοντικών Προβλημάτων

**Διαθεματική Εργασία ΣΑΕΚ ΑΙΓΑΛΕΩ · 4ο Εξάμηνο · 2025-2026**

---

## 📋 Περίληψη

Το **EcoCity Tracker** είναι κοινοτική εφαρμογή *civic technology* βασισμένη σε WordPress.com, που επιτρέπει στους πολίτες να καταγράφουν περιβαλλοντικά προβλήματα της πόλης τους:

- Σκουπίδια  
- Υποδομές  
- Ηχορύπανση  
- Ποιότητα αέρα  
- Υγεία  
- Έκτακτες ανάγκες  

Τα δεδομένα οργανώνονται ανά **Δήμο της Αττικής** με αναλυτικά στατιστικά.

### Admin Panel (ανά Δήμο)

Ο διαχειριστής μπορεί να:
- βλέπει τις αναφορές του δήμου του  
- αλλάζει status (pending → reviewed → resolved)  
- κάνει export σε Excel  
- λαμβάνει email για critical αναφορές  

**Περίοδος ανάπτυξης:**  
📅 25 Μαρτίου – 22 Απριλίου 2026   

---

## 👥 Ομάδα

| Μέλος | Τομέας | Ποσοστό |
|------|--------|--------|
| 🟢 Γιώργος-Λεωνίδας Βεντουράτος | WordPress Theme/Design, CPT, Taxonomy, Security, Docs | ~40% |
| 🔵 Δήμος Χριστοδούλου | PHP Plugin, REST API, Export, Admin Panel | ~30% |
| 🟣 Γιώργος Παπαδάκης | JavaScript, Charts, Ranking, Notifications | ~30% |

📧 g.l.ventouratos@gmail.com  
🏫 ΣΑΕΚ ΑΙΓΑΛΕΩ  
📅 Παράδοση: -----------

---

## 🛠️ Τεχνολογίες

| Layer | Τεχνολογία | Χρήση |
|------|-----------|------|
| 🖥️ CMS | WordPress.com Business Plan | Hosting, users, routing |
| 🎨 Theme | Astra / SolarOne | Design |
| ⚙️ Plugin | Custom EcoCity Plugin (PHP) | Core logic |
| 🗄️ Database | MySQL | Data storage |
| 📱 Frontend | JavaScript ES6+ / AJAX | UI, charts |
| 🔀 Version Control | Git + GitHub | Backup & commits |

---

## 📁 Δομή Φακέλων
ecocity-plugin/
├── ecocity-plugin.php
├── cpt.php
├── taxonomy.php
├── api.php
├── export.php
├── notifications.php
├── assets/
│ ├── js/
│ │ ├── report.js
│ │ ├── stats.js
│ │ ├── ranking.js
│ │ └── admin.js
│ └── css/
│ └── ecocity.css
└── README.md

---

## 🚀 Εγκατάσταση & Εκτέλεση

### Προαπαιτούμενα

- WordPress.com Business Plan  
- VS Code  
- Git  

### Βήματα

1. Δημιουργία site στο WordPress  
2. Εγκατάσταση Theme (Astra ή SolarOne)  
3. Upload plugin (`ecocity-plugin.zip`)  
4. Activate plugin  
5. Seed data  

🌐 URL:
https://ecocity-tracker.wordpress.com

---

## 👤 Δοκιμαστικοί Λογαριασμοί

| Username | Email | Role | Δήμος |
|----------|------|------|------|
| admin_aigaleo | admin@aigaleo.gr | administrator | Αιγάλεω |
| admin_athens | admin@athens.gr | administrator | Αθήνα |
| george | george@test.com | subscriber | — |

---

## 🗄️ Σχήμα Δεδομένων

### wp_posts
- post_type: ecocity_report  
- title  
- author  
- date  

### wp_postmeta
- severity  
- status  
- gps_lat / gps_lng  
- photo_id  

### wp_terms
- δήμος / κατηγορία  

---

## ✅ Λειτουργικές Απαιτήσεις

| ID | Λειτουργία | Κατάσταση |
|----|----------|----------|
| F1 | Setup WordPress | ☐ |
| F2 | Custom Post Type | ☐ |
| F3 | Taxonomy | ☐ |
| F4 | Security | ☐ |
| F5 | Φόρμα αναφοράς | ☐ |
| F6 | REST API | ☐ |
| F7 | Admin panel | ☐ |
| F8 | Export Excel | ☐ |
| F9 | AJAX + GPS | ☐ |
| F10 | Στατιστικά | ☐ |
| F11 | Ranking | ☐ |
| F12 | Notifications | ☐ |

---

## 📅 Progress Log

| # | Ημερομηνία | Φάση | Κατάσταση |
|--|-----------|------|----------|
| 1 | 25/03 | Setup | ☐ |
| 2 | 26/03 | Git + CPT | ☐ |
| 3 | 27/03 | Taxonomy | ☐ |
| ... | ... | ... | ☐ |

---

## 🔒 Ασφάλεια

| Απειλή | Προστασία |
|------|----------|
| SQL Injection | `$wpdb->prepare()` |
| XSS | `esc_html()` |
| Unauthorized API | `wp_verify_nonce()` |
| File Uploads | validation |

---

## 🌐 Διαθεματική Σύνδεση

- 💻 Πληροφορική → WordPress, API, JS  
- 🌱 Βιολογία → Ρύπανση  
- 🗺️ Γεωγραφία → Δήμοι + GPS  
- 📊 Μαθηματικά → Στατιστικά  
- 🏛️ Κοινωνική Αγωγή → Civic tech  
- ✏️ Γλώσσα → Τεκμηρίωση  

---

## 🏙️ Δήμοι Αττικής

- Αθήνα  
- Πειραιάς  
- Αιγάλεω  
- Νίκαια  
- Περιστέρι  
- Χαλάνδρι  
- Γλυφάδα  
- Καλλιθέα  
- Ηλιούπολη  
- Μαρούσι  
- Κηφισιά  
- Παλαιό Φάληρο  

---

## 🔮 Μελλοντικές Βελτιώσεις

- Leaflet.js (χάρτης)  
- Heatmap  
- PWA app  
- React.js  
- Push Notifications  
- Smart City APIs  

---

## 📚 Πηγές

- WordPress Docs  
- MDN Web Docs  
- Git Docs  
- Chart.js  
- PhpSpreadsheet  

---

## 📌 License

EcoCity Tracker — WordPress Edition  
© Βεντουράτος Γιώργος-Λεωνίδας, Χριστοδούλου Δήμος, Παπαδάκης Γιώργος  
ΣΑΕΚ ΑΙΓΑΛΕΩ · 2025-2026
