# Dokumentasi Teknis RagaKu

Dokumen ini menjelaskan arsitektur, cara menjalankan, kontrak API, rumus kesehatan,
model keamanan, serta pemetaan ke PRD untuk aplikasi **RagaKu**.

- Versi dokumen: 0.1
- Terkait: `PRD_RagaKu.md`
- Komponen: frontend Expo (React Native, TypeScript) + backend FastAPI (Python) + layanan pengukuran computer vision (Docker)

---

## 1. Gambaran Umum

RagaKu membantu pengguna memahami kondisi tubuh dan merencanakan aktivitas serta
makan sehari-hari. Tiga kemampuan inti:

1. **Kalkulator berat ideal (BMI)** — dihitung di perangkat, bekerja tanpa internet.
2. **Pengukuran tubuh dari foto** — foto dikirim ke backend, diproses oleh model CV, lalu dihapus.
3. **Rencana harian AI** — target kalori dihitung backend; model AI hanya menyusun rencana dalam JSON tervalidasi.

Angka yang berkaitan dengan keselamatan (target kalori, batas minimum) selalu dihitung
di backend secara deterministik. Model AI **tidak pernah** menghitung kalori sendiri.

---

## 2. Arsitektur

```
┌───────────────────────────┐        HTTPS/JSON        ┌──────────────────────────────┐
│  Aplikasi Expo (RN/TS)     │ ───────────────────────▶ │  Backend FastAPI (Python)      │
│                            │                          │                                │
│  src/lib/health.ts  (BMI)  │                          │  app/services/health.py        │
│  src/lib/storage.ts (lokal)│                          │  app/services/ai_plan.py       │
│  src/lib/api.ts     (klien)│                          │  app/services/measurement.py   │
│  src/app/(tabs)/*          │                          │  app/main.py (router)          │
└───────────────────────────┘                          └───────────────┬────────────────┘
                                                                        │
                                           OpenRouter (chat/completions)│  subprocess/Docker
                                                                        ▼
                                              ┌──────────────────────────────────────┐
                                              │ nvidia/nemotron-3-super-120b-a12b      │
                                              │ Model pengukuran (TensorFlow 1.13.1)   │
                                              └──────────────────────────────────────┘
```

Prinsip desain:

- **Offline-first untuk BMI.** `src/lib/health.ts` menduplikasi rumus backend sehingga
  BMI dan rentang berat ideal tetap tampil tanpa koneksi (PRD §8).
- **Backend sebagai sumber kebenaran untuk keselamatan.** Target kalori, batas minimum,
  dan validasi skema AI ada di backend.
- **Kunci API hanya di server.** Aplikasi tidak pernah menyimpan kunci OpenRouter (PRD §7).
- **Data di perangkat.** Profil, ukuran, dan progres disimpan via AsyncStorage; dapat dihapus total.

---

## 3. Struktur Direktori

### Frontend (`RagaKu-2-main/`)

```
src/
  app/
    _layout.tsx            # Root stack + ProfileProvider + rute measurement
    index.tsx              # Redirect ke /login
    login.tsx, registrasi.tsx, lupa-password.tsx
    onboarding/            # Alur onboarding (opsional, UI lama)
    (tabs)/
      _layout.tsx          # Mengekspor komponen tab
      beranda.tsx          # F1 Profil + F2 Kalkulator BMI
      rencana.tsx          # F5 Rencana AI + §7 penyaringan kesehatan
      ukuran.tsx           # F3 Pengukuran + F4 Indikator lanjutan
      progress.tsx         # F6 Pelacakan progres + §7 hapus data
    measurement.tsx        # Layar kamera (persetujuan + panduan + unggah foto)
  components/
    profile-context.tsx    # ProfileProvider (persistensi profil & penyaringan)
    disclaimer.tsx         # Banner disclaimer (dipakai di setiap layar hasil)
    ui/                    # Card, Chip, PillButton, NumberStepper, Segmented, LineChart, dll.
  lib/
    health.ts              # BMI, berat ideal, Mifflin-St Jeor, WHtR, WHR, US Navy
    model.ts               # Tipe Profile, HealthScreening, MeasurementRecord, ProgressEntry
    storage.ts             # Lapisan AsyncStorage
    api.ts                 # Klien backend (healthSummary/plan/measure/deleteServerData)
    auth.ts                # Auth lokal AsyncStorage (lihat Bagian 11)
    firebase.ts            # Inisialisasi Firebase app + auth + Firestore (db)
    mappers.ts             # Konversi snake_case API <-> camelCase Firestore (Bagian 14)
  services/
    userService.ts         # CRUD Firestore: profil & rencana latihan (Bagian 14)
  types/
    database.ts            # Tipe dokumen Firestore (Bagian 14)
  constants/
    theme.ts               # Warna, font, spacing
    mockUser.ts            # MOCK_USER_ID sementara (belum ada Firebase Auth)
```

### Backend (`RagaKu-2-main/backend/`)

```
app/
  main.py                  # Aplikasi FastAPI + semua rute
  config.py                # Settings dari environment (kunci API, dll.)
  schemas.py               # Skema Pydantic (kontrak + validasi output AI)
  services/
    health.py              # Perhitungan BMI/kalori/indikator deterministik
    ai_plan.py             # OpenRouter + validasi JSON + retry + cache harian
    measurement.py         # Pembungkus model CV (subprocess) + hapus foto
tests/test_smoke.py        # 10 uji tanpa jaringan/TensorFlow
requirements.txt           # fastapi, uvicorn, pydantic, httpx, python-multipart
.env.example               # Contoh variabel environment (server-only)
Dockerfile                 # Container API FastAPI
measurement.Dockerfile     # Container model pengukuran (TensorFlow 1.13.1)
docker-compose.yml         # Orkestrasi layanan API
```

---

## 4. Menjalankan Aplikasi

### 4.1 Backend (API)

Prasyarat: Python 3.11+.

```bash
cd RagaKu-2-main/backend
python3 -m venv .venv && source .venv/bin/activate   # opsional
pip install -r requirements.txt

cp .env.example .env        # lalu isi OPENROUTER_API_KEY
export $(grep -v '^#' .env | xargs)   # atau gunakan uvicorn --env-file

uvicorn app.main:app --reload --port 8000
```

Cek kesehatan: `curl http://localhost:8000/health`

Jalankan uji cepat (tanpa jaringan):

```bash
cd RagaKu-2-main/backend
python tests/test_smoke.py          # atau: pytest -q
```

### 4.2 Backend via Docker

```bash
cd RagaKu-2-main/backend
docker compose up --build          # membaca .env, mengekspos :8000
```

### 4.3 Layanan pengukuran (model CV, TensorFlow 1.13.1)

Model berada di `Human-Body-Measurements-using-Computer-Vision-master/` dan butuh
TensorFlow 1.13.1, sehingga dibungkus Docker (PRD §8).

```bash
# Build dari ROOT repositori model (bukan folder backend):
cd Human-Body-Measurements-using-Computer-Vision-master
docker build -f ../RagaKu-2-main/backend/measurement.Dockerfile -t ragaku-measure .
```

Pastikan model pra-latih tersedia (lihat README model):

```bash
wget https://people.eecs.berkeley.edu/~kanazawa/cachedir/hmr/models.tar.gz
tar -xf models.tar.gz   # ke folder models/
# + unduh customBodyPoints.txt ke folder data/
```

Hubungkan ke backend lewat environment `MEASUREMENT_COMMAND` (template dengan
placeholder `{image}` dan `{height}`):

```bash
export MEASUREMENT_COMMAND="docker run --rm -v /tmp:/tmp ragaku-measure python3 inference.py -i {image} -ht {height}"
```

> Catatan: integrasi pengukuran adalah Fase 2 (PRD §11). Jika `MEASUREMENT_COMMAND`
> kosong, endpoint `/api/v1/measure` mengembalikan `503 measurement_failed` secara
> ramah, dan aplikasi tetap berjalan untuk fitur BMI dan rencana AI.

### 4.4 Frontend (Expo)

Prasyarat: Node.js (disarankan versi LTS yang didukung Expo SDK 57).

```bash
cd RagaKu-2-main
npm install
npx expo install @react-native-async-storage/async-storage expo-camera expo-image-picker  # sudah terpasang

# Firebase (Firestore + Auth persistence) — lihat Bagian 14:
npx expo install firebase @react-native-async-storage/async-storage   # sudah terpasang

# Arahkan aplikasi ke backend:
export EXPO_PUBLIC_API_URL="http://<IP-komputer-anda>:8000"   # bukan localhost untuk perangkat fisik

npx expo start
```

> Firestore butuh variabel `EXPO_PUBLIC_FIREBASE_*` di `.env` pada root frontend.
> Lihat **Bagian 14** untuk daftar lengkap dan catatan keterbatasan.

Fitur kamera (`expo-camera`) butuh **development build** di perangkat fisik
(bukan Expo Go), karena berisi modul native. Lihat `AGENTS.md`.

Verifikasi kualitas:

```bash
npx tsc --noEmit     # typecheck
npx expo lint        # lint
```

---

## 5. Kontrak API

Base URL default: `http://localhost:8000`. Semua body JSON kecuali `/measure` (multipart).

### `GET /health`
Liveness + status konfigurasi.
```json
{ "status": "ok", "version": "0.1.0", "ai_configured": "true", "measurement_configured": "false" }
```

### `POST /api/v1/health-summary?standard=asia_pacific|who`
BMI, kategori, rentang berat ideal, dan target kalori. (F2 + perhitungan F5)

Request:
```json
{
  "profile": {
    "age": 27, "gender": "male", "height_cm": 175, "weight_kg": 74,
    "activity_level": "light", "goal": "lose", "diet_notes": null
  },
  "screening": {}
}
```
Response (200):
```json
{
  "bmi": {
    "bmi": 24.2, "standard": "asia_pacific", "category": "Berisiko (pra-obesitas)",
    "ideal_weight_range": { "min_kg": 56.7, "max_kg": 70.1 }
  },
  "calories": {
    "bmr": 1704, "tdee": 2343, "target_calories": 1843,
    "protein_g": 104, "floor_applied": false, "safe_floor": 1500
  }
}
```

### `POST /api/v1/indicators`
WHtR, WHR (jika pinggul ada), estimasi lemak US Navy. (F4)
```json
{ "height_cm": 175, "gender": "male", "waist_cm": 85, "neck_cm": 38, "hip_cm": null }
```
```json
{ "whtr": 0.486, "whtr_risk": "Sehat", "whr": null, "body_fat_percent": 23.5, "note": "Estimasi; bukan diagnosis medis." }
```

### `POST /api/v1/plan`
Rencana harian AI dengan gerbang penyaringan kesehatan. (F5 + §7)

- Jika `screening` memicu blokir → **409** `{ "error": "screening_blocked", "detail": "..." }`
- Jika kunci AI belum diset → **503** `{ "error": "ai_plan_failed", ... }`
- Jika rate limit OpenRouter → **429**
- Sukses → **200**:
```json
{
  "date": "2026-10-16",
  "target_calories": 1843,
  "protein_g": 104,
  "cached": false,
  "plan": {
    "summary": "Rencana defisit ringan ...",
    "exercises": [ { "name": "Jalan cepat", "type": "kardio", "duration_min": 30, "intensity": "ringan" } ],
    "meals": [ { "slot": "Sarapan", "items": [ { "name": "Oatmeal + telur", "calories": 400, "protein_g": 25 } ] } ],
    "tips": [ "Minum air cukup." ]
  }
}
```

### `POST /api/v1/measure` (multipart/form-data)
Pengukuran dari foto. (F3)
- Field: `height_cm` (form), `gender` (form), `photo` (file).
- Foto dihapus dari server setelah diproses.
- Belum terkonfigurasi → **503** `measurement_failed`. Timeout → **504**.
```json
{
  "waist_cm": 82.3, "hip_cm": 95.0, "arm_length_cm": 58.0,
  "shoulder_width_cm": 44.0, "chest_cm": 90.0,
  "confidence": "medium", "warnings": [],
  "note": "Hasil adalah estimasi dari foto. Foto asli dihapus setelah diproses."
}
```

### `DELETE /api/v1/data`
Membersihkan cache sisi-server (cache rencana harian). Data utama ada di perangkat. (§7)
```json
{ "status": "cleared" }
```

---

## 6. Rumus Kesehatan

Diimplementasikan identik di `backend/app/services/health.py` dan `src/lib/health.ts`
(sumber: PRD Lampiran §13).

| Besaran | Rumus |
|---|---|
| BMI | `berat(kg) / (tinggi(m))²` |
| Kategori WHO | normal 18,5–24,9; <18,5 kurang; 25–29,9 berlebih; ≥30 obesitas |
| Kategori Asia-Pasifik | normal 18,5–22,9; 23–24,9 berisiko; 25–29,9 obesitas I; ≥30 obesitas II |
| Rentang berat ideal | `BMI_normal × tinggi(m)²` (batas bawah & atas band normal) |
| BMR (Mifflin-St Jeor) | pria `10·W + 6,25·H − 5·A + 5`; wanita `… − 161` |
| TDEE | `BMR × faktor aktivitas` (1,2 / 1,375 / 1,55 / 1,725) |
| Target kalori | `TDEE + delta tujuan` (turun −500, jaga 0, naik +300), lalu di-clamp ke batas aman |
| Protein | 1,6 g/kg (naik otot) atau 1,4 g/kg (lainnya) |
| WHtR | `pinggang / tinggi` (batas sehat ~0,5) |
| WHR | `pinggang / pinggul` |
| Lemak US Navy (pria) | `86,010·log₁₀(pinggang − leher) − 70,041·log₁₀(tinggi) + 36,76` |
| Lemak US Navy (wanita) | `163,205·log₁₀(pinggang + pinggul − leher) − 97,684·log₁₀(tinggi) − 78,387` |

**Batas aman kalori (tidak bisa dilewati model):** pria 1.500 kkal, wanita 1.200 kkal.

---

## 7. Model Keamanan, Privasi, dan Kesehatan (PRD §7)

| Kontrol | Implementasi |
|---|---|
| Pertanyaan saring | `rencana.tsx` menampilkan 3 pertanyaan; `HealthScreening.blocked` di backend memblokir rencana (→ 409). |
| Disclaimer | Komponen `Disclaimer` tampil di beranda, rencana, ukuran, dan progres. |
| Batas kalori aman | `SAFE_CALORIE_FLOOR` di `health.py`; `floor_applied` ditandai. Model AI diberi target yang sudah aman. |
| Privasi foto | `measurement.py` selalu menghapus file foto di blok `finally`, baik sukses maupun gagal. Hanya angka yang dikembalikan. |
| Persetujuan eksplisit | `measurement.tsx` punya gerbang persetujuan + penjelasan privasi sebelum kamera aktif. |
| Hak hapus data | Tombol "Hapus semua data saya" di `progress.tsx` memanggil `storage.clearAll()` + `DELETE /api/v1/data`. |
| Kunci API server-only | Dibaca dari environment `OPENROUTER_API_KEY` di `config.py`; tidak pernah ada di aplikasi. |
| Prompt injection | Teks bebas pengguna disisipkan dalam blok "DATA PENGGUNA" dan sistem prompt mengabaikan instruksi di dalamnya (`ai_plan.py`). |
| Lisensi pihak ketiga | Komponen HMR/DeepLab/model pose perlu audit lisensi sebelum rilis (PRD §7, §10). |

Alur validasi rencana AI (F5): backend menghitung target → membangun prompt → memanggil
OpenRouter dengan `response_format: json_object` → mem-parse JSON (toleran code-fence) →
memvalidasi terhadap skema `DailyPlan` → bila gagal, coba sekali lagi (`AI_MAX_RETRIES`) →
bila tetap gagal, kembalikan error ramah. Hasil valid di-cache per profil per hari.

---

## 8. Variabel Environment (server)

Lihat `backend/.env.example`.

| Variabel | Default | Keterangan |
|---|---|---|
| `OPENROUTER_API_KEY` | (kosong) | Kunci OpenRouter. Wajib untuk fitur rencana AI. |
| `OPENROUTER_MODEL` | `nvidia/nemotron-3-super-120b-a12b` | Model yang dipakai. |
| `OPENROUTER_TIMEOUT_SECONDS` | `90` | Timeout panggilan (PRD §8). |
| `AI_MAX_RETRIES` | `1` | Jumlah percobaan ulang validasi JSON. |
| `MEASUREMENT_COMMAND` | (kosong) | Template perintah pengukuran dengan `{image}`/`{height}`. |
| `MEASUREMENT_TIMEOUT_SECONDS` | `120` | Timeout proses pengukuran. |
| `CORS_ALLOW_ORIGINS` | `*` | Daftar origin yang diizinkan. |

Frontend: `EXPO_PUBLIC_API_URL` menentukan base URL backend.

---

## 9. Pemetaan ke PRD

| Fitur PRD | Status | Lokasi |
|---|---|---|
| F1 Profil pengguna | ✅ | `beranda.tsx`, `profile-context.tsx`, `storage.ts` |
| F2 Kalkulator BMI (WHO + Asia-Pasifik + rentang ideal) | ✅ | `beranda.tsx`, `health.ts`, `/health-summary` |
| F3 Pengukuran dari foto | ✅ (butuh container model aktif) | `measurement.tsx`, `/measure`, `measurement.py` |
| F4 Indikator lanjutan (WHtR/WHR/US Navy) | ✅ | `ukuran.tsx`, `health.ts`, `/indicators` |
| F5 Rencana harian AI | ✅ (teruji live) | `rencana.tsx`, `ai_plan.py`, `/plan` |
| F6 Pelacakan progres | ✅ | `progress.tsx`, `storage.ts` |
| F7 Pengingat | ⬜ Belum (roadmap Fase 3) | — |
| §7 Keamanan/privasi/kesehatan | ✅ | lihat Bagian 7 di atas |
| §8 Persyaratan teknis | ✅ | FastAPI, Pydantic, Docker, timeout 90s, offline BMI |

Fase MVP (PRD §11): F1, F2, F5 — lengkap. Fase 2: F3, F4 — lengkap di sisi aplikasi &
API; integrasi model pengukuran siap dihubungkan via `MEASUREMENT_COMMAND`.

---

## 10. Pengujian & Verifikasi

Backend (`backend/`):
```bash
python tests/test_smoke.py     # 10 uji: BMI standar, batas kalori, indikator,
                               # validasi skema DailyPlan, parsing code-fence,
                               # gerbang penyaringan, parsing output model, prompt-injection
```

Integrasi API (TestClient) telah diverifikasi untuk seluruh endpoint, termasuk:
kode 200 untuk health-summary/indicators, 409 untuk penyaringan, 503 bila layanan belum
dikonfigurasi, 422 untuk input tidak valid, serta panggilan live OpenRouter yang
menghasilkan `DailyPlan` tervalidasi (model menghormati target kalori dari backend).

Frontend:
```bash
npx tsc --noEmit    # bersih (kecuali 2 error modul CSS yang sudah ada sebelumnya)
npx expo lint       # bersih untuk kode baru
```

---

## 11. Autentikasi Lokal (tahap awal)

Untuk MVP, autentikasi disimpan **di perangkat sebagai JSON** (AsyncStorage), belum ada
server auth. Ini menyelesaikan masalah "loop login" sebelumnya (ketika login hanya timeout
palsu tanpa sesi yang dipersistensi).

- `src/lib/auth.ts` — akun (`ragaku.auth.accounts`) & sesi (`ragaku.auth.session`), fungsi `register`/`login`/`logout`/`clearAll`.
- `src/components/auth-context.tsx` — `AuthProvider`/`useAuth` memuat sesi saat start.
- `src/app/index.tsx` — menunggu sesi dimuat, lalu mengarahkan ke `/beranda` (sudah masuk) atau `/login`.
- `login.tsx` membuat sesi via `signIn`; `registrasi.tsx` membuat akun via `signUp`; keduanya menampilkan error nyata.
- Keluar akun & "Hapus semua data" ada di tab **Progres**.

> Keamanan: kata sandi disimpan dengan hash sederhana non-kriptografis — **hanya untuk
> prototipe lokal**. Untuk produksi, pindahkan auth ke server dengan hashing yang benar
> (bcrypt/argon2) dan transport aman.

Alur: `index` → `/login` → (daftar/masuk) → `/onboarding` → `/beranda`. Setelah akun ada,
membuka aplikasi langsung ke `/beranda` tanpa loop.

---

## 12. Pemecahan Masalah

**Login terus kembali ke layar masuk (loop).**
Sudah diperbaiki: sesi kini dipersistensi. Jika masih terjadi, hapus data aplikasi/clear
AsyncStorage, lalu daftar akun baru. Pastikan `AuthProvider` membungkus aplikasi di
`_layout.tsx`.

**Tidak bisa membuat rencana RagaKu (AI plan gagal).**
Rencana AI membutuhkan backend yang berjalan dan terjangkau dari perangkat:
1. Jalankan backend: `cd backend && uvicorn app.main:app --port 8000` dengan `OPENROUTER_API_KEY` terisi.
2. Set `EXPO_PUBLIC_API_URL` ke alamat yang bisa dijangkau perangkat:
   - Emulator Android: default kini otomatis `http://10.0.2.2:8000` (tidak perlu set).
   - Web / simulator iOS di mesin yang sama: default `http://localhost:8000`.
   - Perangkat fisik: **wajib** set `EXPO_PUBLIC_API_URL=http://<IP-LAN-komputer>:8000` (satu Wi-Fi).
   `localhost` dari perangkat fisik menunjuk ke perangkat itu sendiri, bukan komputer Anda.
3. Cek backend hidup: `curl $EXPO_PUBLIC_API_URL/health`.
4. Pesan error yang mungkin muncul di aplikasi:
   - "Tidak dapat terhubung ke server" → URL/jaringan salah atau backend mati.
   - 429 → rate limit model; tunggu lalu coba lagi (hasil juga di-cache harian).
   - 503 `ai_plan_failed` → `OPENROUTER_API_KEY` belum diset di server.
   - 409 `screening_blocked` → ada jawaban penyaringan kesehatan yang dicentang.

BMI, rentang berat ideal, dan indikator **tidak** memerlukan backend (dihitung di perangkat).

---

## 13. Catatan & Pertanyaan Terbuka

- Standar BMI default: **Asia-Pasifik** (dapat diubah pengguna di Beranda) — sesuai PRD §12 #1.
- Penyimpanan: **di perangkat** (AsyncStorage) sebagai sumber kebenaran aplikasi.
  Firestore kini dipakai sebagai lapisan **tulis-saja** untuk profil & rencana
  latihan (lihat Bagian 14); belum ada sinkronisasi dua arah.
- Model pengukuran memakai TensorFlow 1.13.1 (Python 3.6) — perlu Docker, pertimbangkan
  migrasi ke model pose modern (PRD §10) di iterasi berikutnya.
- Audit lisensi komponen pihak ketiga wajib sebelum rilis publik (PRD §7).
- Anggaran pemanggilan model & reviewer kesehatan masih terbuka (PRD §12).

---

## 14. Integrasi Firebase / Firestore

Lapisan penyimpanan cloud untuk profil pengguna dan rencana latihan hasil AI.
Statusnya **tulis-saja (write-only)**: aplikasi menulis ke Firestore, tetapi
`ProfileProvider` masih membaca dari AsyncStorage. Tidak ada sinkronisasi balik.

### 14.1 Instalasi

```bash
cd RagaKu-2-main
npx expo install firebase @react-native-async-storage/async-storage
```

Versi yang terpasang saat dokumen ini ditulis: `firebase@13.0.0`,
`@react-native-async-storage/async-storage@2.2.0`.

`async-storage` dipakai dua kali: sebagai penyimpanan lokal aplikasi
(`src/lib/storage.ts`, `src/lib/auth.ts`) **dan** sebagai backend persistensi
sesi Firebase Auth di `src/lib/firebase.ts`.

### 14.2 Variabel environment (frontend)

Buat `.env` di root frontend. Semua kunci berprefiks `EXPO_PUBLIC_` karena
dibaca di sisi klien (lihat `.env.examples`):

| Variabel | Keterangan |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | API key Web app Firebase |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | mis. `<project>.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ID project Firebase |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | mis. `<project>.appspot.com` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID FCM |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | App ID Web |

`.env` sudah masuk `.gitignore` (baris `.env` dan `.env.*`). Jangan commit.

> Catatan keamanan: config Firebase Web memang bukan rahasia, tetapi itu berarti
> **Firestore Security Rules adalah satu-satunya pelindung data**. Lihat §14.7.

### 14.3 Inisialisasi

`src/lib/firebase.ts` mengekspor dua hal:

- `auth` — `initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })`
- `db` — `getFirestore(app)`

Pemakaian `getApps().length === 0 ? initializeApp(...) : getApp()` mencegah
inisialisasi ganda saat Fast Refresh.

### 14.4 Struktur dokumen Firestore

```
users/{uid}                                # profil pengguna
users/{uid}/workoutPlans/{planId}          # rencana latihan harian
users/{uid}/nutritionPlans/{planId}        # tipe sudah ada, service belum
users/{uid}/measurements/{id}              # tipe sudah ada, service belum
users/{uid}/progress/{id}                  # tipe sudah ada, service belum
```

Tipe ada di `src/types/database.ts`, dengan pemisahan:

- `*Input` — payload yang dikirim pemanggil (tanpa field milik server).
- `*Document` — bentuk tersimpan (termasuk `id`, `uid`, `createdAt`, `updatedAt`).

Semua timestamp memakai `Timestamp` dari `firebase/firestore` (alias
`StoredTimestamp`), diisi server lewat `serverTimestamp()`.

`planId` default-nya `planDate` (`YYYY-MM-DD`), sehingga membuat ulang rencana
di hari yang sama **menimpa** dokumen hari itu, bukan menambah dokumen baru.

### 14.5 Layanan (`src/services/userService.ts`)

| Fungsi | Perilaku |
|---|---|
| `saveUserProfile(uid, profile)` | `setDoc` merge ke `users/{uid}`; `createdAt` hanya saat dokumen baru |
| `getUserProfile(uid)` | Mengembalikan dokumen, atau **`null`** bila tidak ada |
| `saveWorkoutPlan(uid, plan, planId?)` | Tulis ke subkoleksi; mengembalikan `planId` |
| `getUserWorkoutPlans(uid, { limit? })` | Urut `planDate` desc; `[]` bila kosong |

Kegagalan Firestore dibungkus `UserServiceError` dengan `operation` dan error
asli pada `cause`. Nilai `undefined` dibuang sebelum menulis (Firestore
menolaknya); `null` dipertahankan sebagai "sengaja dikosongkan".

### 14.6 Pemetaan data (`src/lib/mappers.ts`)

Backend memakai snake_case, Firestore camelCase. Semua konversi ada di satu file.

**Rencana AI → dokumen:**

- `toWorkoutPlanInput(response, { calories? })`
- `toNutritionPlanInput(response, { calories? })`
- `toPlanInputs(response, opts)` — keduanya sekaligus
- `date → planDate`, `duration_min → durationMin`, `protein_g → proteinG`

`PlanResponse` hanya membawa `target_calories` dan `protein_g`, tidak cukup
untuk `CalorieTargetSnapshot` (butuh `bmr`/`tdee`/`floor_applied`/`safe_floor`).
Karena itu `targets` hanya terisi bila blok kalori dari
`POST /api/v1/health-summary` dikirim lewat `options.calories`.

**Onboarding → profil** (`toUserProfileInput`). Onboarding dan kontrak backend
memakai kosakata yang **tidak sama**, jadi aturan berikut adalah keputusan baru:

| Aturan | Keputusan | Alasan |
|---|---|---|
| `toBiologicalSex` | `'wanita' → 'female'`, lainnya → `'male'` | Rumus butuh biner; `'male'` punya batas kalori aman lebih tinggi (1500 vs 1200) sehingga aman untuk nilai tak diketahui |
| `toCalorieGoal` | `'turun-berat' → 'lose'`; `'bentuk-otot'`/`'ketahanan' → 'gain'`; sisanya `'maintain'` | Goal onboarding multi-pilih, backend hanya satu. `'ketahanan'` di UI berlabel "Naikkan Berat Badan / Bulking" |
| `toActivityLevel` | Dari `daysPerWeek`: ≤1 sedentary, ≤3 light, ≤5 active, >5 very_active | Onboarding tidak menanyakan tingkat aktivitas |
| `screening` | Selalu `false` semua | Cedera onboarding (`'tekanan-tinggi'`, `'asma'`) adalah batasan latihan, bukan kontraindikasi. Memetakannya ke `hasChronicIllness` akan memicu gerbang PRD §7 dan membuat `/api/v1/plan` menjawab 409. `rencana.tsx` menanyakannya terpisah |
| `bmiStandard` | `'asia_pacific'` | Default produk (PRD §12 #1) |

### 14.7 Pengguna sementara (MOCK_USER_ID)

`src/constants/mockUser.ts` mengekspor `MOCK_USER_ID = 'demo-user-ragaku'`.
Semua tulisan Firestore memakai id ini karena **Firebase Auth belum terhubung**
ke alur masuk — `src/lib/auth.ts` masih auth lokal AsyncStorage (Bagian 11).

Konsekuensi: setiap instalasi aplikasi menulis ke dokumen yang sama, dan Rules
tidak bisa memakai `request.auth.uid`. Untuk pengembangan, Rules bisa
mengizinkan jalur demo itu saja:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // HANYA untuk demo lokal — ganti sebelum rilis.
    match /users/demo-user-ragaku/{document=**} {
      allow read, write: if true;
    }
  }
}
```

> **Jangan dipakai di produksi.** Aturan di atas membuka dokumen demo ke publik.
> Langkah berikutnya: sambungkan Firebase Auth, ganti `MOCK_USER_ID` dengan
> `auth.currentUser.uid`, lalu pakai
> `allow read, write: if request.auth != null && request.auth.uid == uid;`

### 14.8 Titik integrasi di UI

**`src/app/onboarding/activities.tsx`** (langkah 4/4, submit terakhir) —
menyimpan profil sebelum masuk ke tab utama:

```ts
await saveUserProfile(MOCK_USER_ID, toUserProfileInput(data, {
  displayName: session?.name,
  email: session?.email,
}));
router.replace('/beranda');
```

Kegagalan menulis **menahan navigasi** dan menampilkan error, agar jawaban
pengguna tidak hilang diam-diam.

**`src/app/(tabs)/rencana.tsx`** — menyimpan rencana setelah dibuat:

```ts
const result = await api.plan(profile, screening);
setPlan(result);                       // tampilkan dulu

const summary = await api.healthSummary(profile, profile.bmiStandard);
const { workout } = toPlanInputs(result, { calories: summary?.calories });
await saveWorkoutPlan(MOCK_USER_ID, workout);
```

Urutannya sengaja: `setPlan` dijalankan **sebelum** penyimpanan. Gagal menulis
ke Firestore hanya memunculkan catatan ("Rencana dibuat, tetapi gagal
disimpan…"), bukan menghapus rencana yang sudah berhasil dibuat. Gagal mengambil
`health-summary` diabaikan karena `targets` bersifat opsional.

Catatan: nama metode klien adalah `api.plan(...)`, bukan `api.generatePlan(...)`.
`api.healthSummary` bertipe `Promise<unknown>`, sehingga blok kalorinya perlu
di-cast ke `WireCalorieTargets` (diekspor dari `mappers.ts`).

### 14.9 Yang belum terverifikasi / belum ada

- **Belum ada uji tulis nyata ke Firestore.** Yang terverifikasi baru
  `npx tsc --noEmit` bersih. Perlu `.env` terisi dan Rules yang mengizinkan.
- **Tidak ada pembacaan balik.** `getUserProfile`/`getUserWorkoutPlans` sudah
  ada tetapi belum dipakai layar mana pun; `ProfileProvider` tetap AsyncStorage.
- **`nutritionPlans`, `measurements`, `progress`** baru punya tipe, belum
  punya fungsi service.
- **Firebase Auth belum tersambung** (lihat §14.7).
- Error TypeScript yang tersisa di repo (4 buah, rute `expo-router` di
  `exercise.tsx`, `workout.tsx`, `active-session.tsx`) sudah ada sebelumnya dan
  tidak berkaitan dengan integrasi ini.
