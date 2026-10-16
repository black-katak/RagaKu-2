# Changelog — Figma Restyle (branch FrontEnd/takka)

Restyle seluruh UI RagaKu agar sesuai desain Figma (`RagaKu` file,
node 0:1) sambil mempertahankan logic/data/navigasi yang sudah ada.
Sumber desain: 12 frame Figma di-export via REST API ke
`figma_frames/*.png` (screenshot) dan `figma_specs/*.md` (teks, font,
warna per node) — tidak di-commit, disimpan lokal untuk referensi.

## Fondasi (tema, font, mode warna)

- **Font**: tambah `@expo-google-fonts/barlow-condensed` dan
  `@expo-google-fonts/plus-jakarta-sans`, dimuat di `src/app/_layout.tsx`.
  `FontFamily` constants baru di `src/constants/theme.ts`.
  `ThemedText` (`src/components/themed-text.tsx`) pakai Barlow Condensed
  untuk heading/title, Plus Jakarta Sans untuk body.
- **Warna**: `Colors.light.background` diubah ke `#F8F9FF` (dari
  `#F8FAFC`) sesuai spec Figma; tambah `textMuted` token.
- **Mode warna dipaksa light**: PRD eksplisit "Visual Vibe: Clean Light
  Mode" — `src/hooks/use-color-scheme.ts` dan `.web.ts` sekarang selalu
  return `'light'` (sebelumnya ikut preferensi sistem/browser).
  `use-theme.ts` disederhanakan mengikuti ini. `app.json`
  `userInterfaceStyle` diubah ke `"light"` (native build).

## Auth (Login, Registrasi, Lupa Password) — 3 layar

- `src/app/login.tsx`: restyle sesuai spec Figma (badge "AI WORKOUT
  ENGINE 2.4", heading "SELAMAT DATANG KEMBALI", copy field, checkbox
  "Ingat Saya", link "LUPA KATA SANDI?" → `/lupa-password`). Form
  dibungkus `Card` putih. Tambah streak card ("Target Hari Ini
  Menunggumu" / 14 HARI STREAK) yang sebelumnya hilang.
- `src/app/registrasi.tsx` (baru): nama, email, WhatsApp (+62), kata
  sandi dengan live strength-checklist, checkbox persetujuan, kartu
  trust "Enkripsi Medis End-to-End".
- `src/app/lupa-password.tsx` (baru): toggle Email/WhatsApp, kartu
  bantuan WhatsApp Care.
- `src/components/ui/auth-header.tsx` (baru): header bersama (back
  chevron + logo lockup "RAGAKU" + superscript "AI") dipakai di
  ketiga layar — sebelumnya tidak ada header sama sekali.

## Onboarding — 5 layar

- `src/components/ui/onboarding-header.tsx`: tambah brand lockup
  RAGAKU/AI (reuse pola `auth-header.tsx`) di samping tombol back dan
  indikator progres step yang sudah ada.
- `src/app/onboarding/index.tsx`: tambah header row (logo + "ONBOARDING
  GOAL" + pill "STEP ACTIVE"); hero card mint solid dipecah jadi
  badge/heading di background biasa + 3 stat tile sebagai card putih
  terpisah (sesuai Figma, bukan satu card besar).
- `src/app/onboarding/biometric.tsx`: tambah blok "Target Utama
  Kebugaran" (3 pilihan goal) yang sebelumnya hilang total dari PRD
  Modul 1; fix CTA pudar (gender default null → auto-select "pria");
  tambah blok "TARGET REGENERASI / 20–35 Thn (Zone A)".
- `src/app/onboarding/health.tsx`: tambah section catatan kustom
  ("+ TAMBAH CATATAN KHUSUS" → textarea → tag aktif); tambah toggle
  DEPAN/BELAKANG di atas diagram tubuh.
- `src/app/onboarding/equipment.tsx`: **rombak struktural** — dari
  list flat (Switch + 6 checkbox datar) jadi 4 kartu kategori
  single-select (Full Gym Commercial / Alat Rumahan / Bodyweight /
  Kardio Gear) sesuai Figma; kategori Home Gym membuka grid chip
  multi-select 5 item. Model data `Equipment[]` di
  `onboarding-context.tsx` tidak diubah — UI baru memetakan ke array
  yang sama. Status row sekarang sebut nama kategori aktif, bukan
  angka generik.
- `src/app/onboarding/activities.tsx`: fix tombol CTA yang kehilangan
  kata "RAGAKU" ("BUAT PROGRAM AI PERSONAL SAYA" →
  "BUAT PROGRAM RAGAKU AI PERSONAL SAYA"); fix judul callout box yang
  tertukar ("ALGORITMA PERSONALISASI" vs "INTEGRASI KALENDER RAGAKU AI").

## Main tabs — Workout, Exercise, Progress, VIP, Active Session

- **Bug tab bar (root cause, berdampak ke 4 layar sekaligus)**:
  `src/components/app-tabs.web.tsx` — `tabListContainer` punya
  `position: 'absolute'` tanpa `bottom: 0`, jadi nav nempel di ATAS
  layar menutupi konten, bukan di bawah. Ditambahkan `bottom: 0`.
  `src/constants/theme.ts` — `BottomTabInset` sebelumnya `0` di web,
  ditambah `web: 96` supaya scroll content punya padding bawah cukup
  untuk nav floating.
- `src/app/(tabs)/workout.tsx`: restyle penuh sesuai `home_dashboard.md`
  (header "HALO, DIMAS!", skor kesiapan AI, RHR card, rekomendasi AI,
  featured session card, daftar 4 exercise, streak footer). Data/logic
  (`TODAY_EXERCISES`, rekomendasi berdasar cedera lutut) tidak diubah.
- `src/app/(tabs)/exercise.tsx`: list exercise dibungkus `Card` +
  nomor urut (01, 02, ...) konsisten dengan pola `workout.tsx`; filter
  chip horizontal sekarang di dalam `ScrollView` (sebelumnya overflow
  terpotong di tepi layar).
- `src/app/(tabs)/progress.tsx`: **fix bug data** — perhitungan berat
  badan (`current`, `totalLoss`, `weightSeries`) sebelumnya bisa
  inkonsisten antar nilai yang ditampilkan; sekarang semua diturunkan
  dari satu `DAY28_PROGRESS` constant yang sama. Fix typo tanda koma
  pada copy reminder. Tambah tag hari (Upper/Lower/Core/Rest/Push/Pull)
  di kalender streak mingguan.
- `src/app/(tabs)/vip.tsx`: comparison matrix diubah dari 3 baris teks
  bertumpuk jadi 2 kolom (Akun Gratis | RagaKu Pro) sesuai spec. Kartu
  chat "VIP AI COACH ASSISTANT" direstyle sesuai Figma (2 chat bubble +
  footer latency). **Fix konten salah**: item "Live Form Tracking"
  (fitur kamera realtime yang TIDAK ada di Figma) diganti
  "Audit & Kalibrasi Program Harian" sesuai `upgrade_vip.md` baris 20.
- `src/app/active-session.tsx`: header direstyle total — badge
  "RAGAKU" outline teal + ikon petir, judul "ACTIVE SESSION" dua baris
  caps, pill "STEP ACTIVE", avatar bulat kanan (sebelumnya cuma teks
  judul polos). Kartu "Smart Camera Tracker" dipisah dari player video
  gelap sesuai struktur 2-kartu di Figma. Logic timer/set/STEPS tidak
  diubah.

## Verifikasi

- `npx tsc --noEmit` bersih di setiap tahap (0 error).
- Setiap layar discreenshot di viewport mobile (390×844) dan
  dibandingkan manual terhadap `figma_frames/*.png` + spec teks di
  `figma_specs/*.md`.
- `onboarding-context.tsx` (data model) tidak disentuh sama sekali —
  dikonfirmasi via `git diff --stat`.
- Tidak ada `npm install` paket baru di luar 2 font package di atas.

## Belum dikerjakan (kosmetik minor, dicatat untuk nanti)

- Pill "STEP ACTIVE" di `active-session.tsx` masih teks polos, belum
  bentuk pill berbingkai.
- Foto before/after di `progress.tsx` masih placeholder ikon Ionicons
  (tidak ada aset foto di project).
- Label "SUDUT SIKU OPTIMAL" di `active-session.tsx` wrap 2 baris,
  sedikit tidak sejajar dengan kolom "DEVIASI TERKINI" di sebelahnya.
