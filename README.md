# RagaKu

Aplikasi mobile (Expo / React Native + TypeScript) yang membantu pengguna memahami
kondisi tubuh dan merencanakan aktivitas serta makan harian. Terdiri dari:

- **Frontend** Expo (folder ini)
- **Backend** FastAPI di `backend/` (kalkulasi kesehatan, rencana AI via OpenRouter, pengukuran foto)

Dokumentasi teknis lengkap: lihat [`Docs.md`](./Docs.md).

> ⚠️ **Keamanan**: Kunci API OpenRouter hanya disimpan di server (`backend/.env`),
> tidak pernah di dalam aplikasi. File `backend/.env` sudah masuk `.gitignore` dan
> tidak akan ter-commit. Jangan pernah menaruh kunci asli di `.env.example` atau kode.

---

## Prasyarat

- **Node.js** LTS (disarankan ≥ 20) dan npm
- **Python** 3.11+ (untuk backend)
- Opsional: emulator Android / simulator iOS, atau HP dengan Expo Go

---

## 1. Instalasi

### Frontend
```bash
npm install
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cd ..
```

---

## 2. Membuat file API key (backend)

Rencana AI memakai OpenRouter. Kuncinya disimpan di `backend/.env` (server-only).

1. Buat kunci di https://openrouter.ai/settings/keys
2. Salin contoh env dan isi kuncimu:

```bash
cd backend
cp .env.example .env
```

3. Buka `backend/.env`, lalu isi `OPENROUTER_API_KEY`:

```env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b
```

`backend/.env` **tidak** di-commit (sudah di `.gitignore`). Yang di-commit hanya
`backend/.env.example` berisi placeholder.

Fitur kamera (estimasi tinggi/berat dari foto) memakai **Gemini** dan butuh satu
kunci tambahan, `GEMINI_API_KEY`, di `backend/.env` yang sama — lihat
[Bagian 7](#7-fitur-kamera--estimasi-tinggiberat-gemini).

> BMI, rentang berat ideal, dan indikator (WHtR/WHR/lemak) tetap bisa dipakai
> **tanpa** backend/kunci API — dihitung di perangkat. Backend hanya diperlukan untuk
> "Buat rencana AI" dan pengukuran foto.

---

## 3. Menjalankan

### Cara cepat — satu perintah (backend + Expo sekaligus)
```bash
npm run dev           # menjalankan backend FastAPI + Expo
npm run dev:web       # + buka web
npm run dev:android   # + buka Android
```
Log ditandai `[api]` (backend) dan `[expo]` (aplikasi). Tekan `Ctrl+C` untuk berhenti.

Opsi:
- `SKIP_BACKEND=1 npm run dev` — jika backend sudah jalan sendiri.
- `PYTHON=python npm run dev` — jika biner Python kamu bernama `python`.

### Cara manual — dua terminal

Terminal 1 (backend):
```bash
npm run backend
# atau: cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --env-file .env
```
Cek: `curl http://localhost:8000/health` → `{"status":"ok", ..., "ai_configured":"true"}`

Terminal 2 (aplikasi):
```bash
npx expo start        # lalu tekan w (web), a (android), i (ios)
```

---

## 4. Menghubungkan aplikasi ke backend

Aplikasi memilih alamat backend otomatis:

| Target | Alamat default | Perlu set env? |
|---|---|---|
| Web / simulator iOS (mesin sama) | `http://localhost:8000` | Tidak |
| Emulator Android | `http://10.0.2.2:8000` | Tidak |
| **HP fisik** (Expo Go / dev build) | — | **Ya** |

Untuk HP fisik, pastikan HP & komputer satu Wi-Fi, cari IP LAN komputer
(`ip addr` / `ipconfig`), lalu:

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000 npx expo start
```

`localhost` dari HP fisik menunjuk ke HP itu sendiri, bukan komputermu.

> Fitur kamera (pengukuran foto) butuh **development build** di perangkat fisik,
> bukan Expo Go. Lihat `AGENTS.md`.

---

## 5. Skrip yang tersedia

| Perintah | Keterangan |
|---|---|
| `npm run dev` | Backend + Expo sekaligus |
| `npm run dev:web` / `npm run dev:android` | Idem, langsung buka web/android |
| `npm run backend` | Hanya backend FastAPI |
| `npm start` / `npx expo start` | Hanya Expo |
| `npm run web` / `npm run android` / `npm run ios` | Expo per platform |
| `npm run lint` | ESLint (expo lint) |
| `npx tsc --noEmit` | Pemeriksaan tipe TypeScript |

Uji backend:
```bash
cd backend && python3 tests/test_smoke.py
```

---

## 6. Pemecahan masalah singkat

- **`uv_cwd ENOENT` saat `npx expo ...`** → terminal berada di folder yang sudah
  terhapus. Jalankan `cd` ke folder proyek yang benar lalu ulangi.
- **"Tidak dapat terhubung ke server (URL)"** → backend mati, alamat salah, atau
  beda jaringan. Lihat Bagian 4.
- **503 `ai_plan_failed`** → `OPENROUTER_API_KEY` belum diisi di `backend/.env`.
- **429** → model kena rate limit; tunggu, coba lagi (hasil juga di-cache harian).
- **409 `screening_blocked`** → ada centang pada penyaringan kesehatan di tab Rencana.

Detail lengkap: [`Docs.md`](./Docs.md).

---

## 7. Fitur kamera & estimasi tinggi/berat (Gemini)

Alur: aplikasi mengambil foto (kamera atau galeri) → dikirim ke backend →
backend memanggil Gemini untuk menaksir tinggi (cm) dan berat (kg) → hasilnya
disimpan ke profil pengguna.

> Kunci Gemini **hanya** hidup di server (`backend/.env`). Tidak pernah dikirim
> ke aplikasi, tidak pernah masuk bundle JS, dan tidak boleh ditulis di README,
> `.env.example`, atau kode.

### Library yang perlu dipasang

**Frontend (kamera & galeri)** — sudah terdaftar di `package.json`, tapi kalau
kamu setup dari nol atau versinya bentrok, pasang ulang lewat Expo supaya versinya
cocok dengan SDK:

```bash
npx expo install expo-camera expo-image-picker
```

**Backend (SDK Gemini)** — `google-genai` sudah ada di `backend/requirements.txt`,
jadi cukup:

```bash
cd backend
pip install -r requirements.txt
cd ..
```

`google-genai` adalah SDK resmi Gemini untuk Python. Selain itu `python-dotenv`
dipakai untuk membaca `backend/.env`, dan `python-multipart` untuk menerima
upload file (`multipart/form-data`) di endpoint estimasi.

> Modul kamera (`expo-camera`) mengandung kode native, jadi **Expo Go tidak
> cukup**. Pakai development build: `npx expo run:android`, `npx expo run:ios`,
> atau `eas build --profile development`.

### Kunci API (backend/.env)

1. Buat kunci Gemini di https://aistudio.google.com/apikey
2. Tambahkan ke `backend/.env` (file yang sama dengan kunci OpenRouter):

```env
GEMINI_API_KEY=isi_kunci_gemini_kamu_di_sini
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_FALLBACK_MODEL=gemini-3.5-flash-lite
```

- `GEMINI_MODEL` — model utama untuk estimasi.
- `GEMINI_FALLBACK_MODEL` — dicoba sekali kalau model utama sedang sibuk
  (HTTP 429/503). Kosongkan untuk mematikan fallback.

Kunci asli **jangan** di-commit. Yang di-commit hanya `backend/.env.example`
berisi placeholder.

### Menjalankan backend

```bash
npm run backend
# atau manual:
cd backend && python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --env-file .env
```

Kalau `python3` tidak ada (umum di Windows), pakai Python dari virtualenv:

```bash
cd backend && .venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --env-file .env
```

Cek backend hidup:

```bash
curl http://localhost:8000/health
```

### Tes endpoint upload foto (tanpa aplikasi)

Ganti `your/custom/foto/path.jpeg` dengan path fotomu sendiri. Gunakan foto
seluruh badan (berdiri, terlihat dari kepala sampai kaki):

```bash
curl.exe -X POST "http://localhost:8000/api/v1/estimate-body" -F "photo=@your/custom/foto/path.jpeg"
```

Catatan penting:

- **Windows/PowerShell**: tulis `curl.exe`, bukan `curl`. Di PowerShell `curl`
  adalah alias `Invoke-WebRequest` yang tidak mengenal `-X`/`-F` dan akan gagal
  dengan `A parameter cannot be found that matches parameter name 'X'`.
- **`photo=@` wajib**. `-F "path/foto.jpeg"` tanpa nama field akan ditolak
  (422) karena endpoint mengharapkan field bernama `photo`.
- Di Git Bash / macOS / Linux, `curl` biasa sudah cukup.

Contoh respons sukses (`200`):

```json
{
  "height_cm": 170.2,
  "weight_kg": 65.4,
  "confidence": "medium",
  "warnings": []
}
```

Arti status lain:

| Status | Arti |
|---|---|
| `415 unsupported_media_type` | Format bukan JPEG/PNG/WebP. |
| `413 payload_too_large` | Foto lebih dari 10 MB. |
| `503` | `GEMINI_API_KEY` kosong, atau semua model sedang sibuk. |
| `502` | Gemini menolak permintaan (mis. nama model salah). Alasan aslinya hanya muncul di log server (terminal uvicorn), bukan di respons. |

Foto diproses di memori dan **tidak** disimpan ke disk, jadi tidak ada file
temporer yang perlu dibersihkan.

---

## Struktur singkat

```
RagaKu-2-main/
├─ src/                 # Aplikasi Expo (app/, components/, lib/, constants/)
├─ backend/             # FastAPI (app/, services/, tests/, Dockerfile, .env.example)
├─ scripts/dev.js       # Launcher backend + Expo (npm run dev)
├─ Docs.md              # Dokumentasi teknis lengkap
└─ README.md            # Dokumen ini
```

## Lisensi

Lihat [`LICENSE`](./LICENSE).
