# GrowBang 🍼👶

**GrowBang** is a modern, comprehensive baby and toddler health and growth monitoring web application. Designed with a warm, human-centric UI/UX, GrowBang helps parents effortlessly manage immunization schedules, track medical milestones, and simulate healthcare costs dynamically based on their preferred insurance or national health coverage plans.

---

## ✨ Key Features

*   📅 **Smart Immunization Tracker:** 
    *   Chronological **Timeline** and detailed **Table** views for children aged 0–5 years, aligned with official IDAI & Indonesian Ministry of Health guidelines.
    *   Categorization into mandatory program vaccines (*Imunisasi program*) and optional vaccines (*Vaksin pilihan*).
    *   Real-time status tracking (*Selesai*, *Terjadwal*, *Terlambat*).
*   💰 **Dynamic Cost Simulation:**
    *   Switch instantly between three realistic financial scenarios:
        1. **Full Private / Insurance** (*Full Dana Pribadi/Asuransi*)
        2. **Full BPJS** (*Puskesmas / National Health Coverage*)
        3. **Hybrid Mode** (Combining BPJS for mandatory shots and private options for elective vaccines)
    *   Watch financial estimates across the dashboard update in real-time.
*   👥 **Multi-Child Profile Management:**
    *   Seamless profile switching and child management integrated directly into the header navigation.
*   🎨 **Modern & Warm UI/UX:**
    *   Built to look cozy yet professional, avoiding cold, generic AI-generated aesthetics. Features soft card elevations, pure white container surfaces against warm off-white backgrounds, and crystal-clear typographic hierarchies.
*   📱 **Fully Responsive:**
    *   Optimized for all viewports, ensuring a fluid mobile experience (320px–430px) with touch-friendly controls, horizontal-scrolling filter chips, and stacked adaptive table/card layouts.

---

## 🔒 Akses Privat (Private Access Mode)

Aplikasi ini dikonfigurasi untuk penggunaan privat keluarga dengan akun bersama. 

### Konfigurasi & Feature Flags (`src/config/app.ts`)
- `AUTH_ENABLE_SIGNUP`: Mengontrol visibilitas tab pendaftaran dan pembuatan akun (default: `false`).
- `AUTH_ENABLE_GOOGLE`: Mengontrol visibilitas tombol masuk dengan Google (default: `false`).
- `AUTH_ENABLE_GUEST`: Mengontrol visibilitas mode tamu / demo offline (default: `false`).
- `LOGIN_EMAIL_DOMAIN`: Domain internal untuk pemetaan username (default: `growbang.app`).

### Checklist Mode Privat
1. Pengguna masuk menggunakan username (yang dipetakan secara internal ke `username@growbang.app`) dan kata sandi.
2. Pendaftaran publik, tombol Google, dan mode tamu disembunyikan di antarmuka.
3. Aturan keamanan Firestore (`firestore.rules`) membatasi akses baca/tulis hanya untuk akun yang terdaftar dalam allow-list privat.

### Membuka ke Publik
Untuk membuka kembali aplikasi ini ke publik di masa mendatang:
1. Ubah flag `AUTH_ENABLE_SIGNUP`, `AUTH_ENABLE_GOOGLE`, dan/atau `AUTH_ENABLE_GUEST` di `src/config/app.ts` menjadi `true`.
2. Di `firestore.rules`, set `isPrivateMode()` mengembalikan `false` (atau perbarui allow-list `isAllowedAccount()`) lalu publish aturan keamanan ke Firestore.
3. Di Firebase Console > Authentication: aktifkan kembali penyedia Google dan aktifkan kembali "Enable create (sign-up)".
4. Jalankan ulang test suite untuk memverifikasi.

---

## 🛠️ Tech Stack

*   **Frontend:** React, TypeScript / JavaScript
*   **Styling:** Tailwind CSS (with custom warm color pallets and soft box-shadows)
*   **Icons:** Lucide Icons
*   **Build Tool:** Vite
