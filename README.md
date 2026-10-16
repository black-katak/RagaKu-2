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
