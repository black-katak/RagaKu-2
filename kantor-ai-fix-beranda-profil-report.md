# Restructure Beranda/Profil/Tab Bar — Progress Report

Base: `kantor-ai-maintabs-review.md` temuan 1.1-1.7, 4.1-4.7 (cross-checked vs spec, bukan ditelan mentah).

## 1. `src/app/(tabs)/beranda.tsx` — REWRITE

- Hapus section editor identitas penuh (Jenis Kelamin/Usia/Tinggi/Berat stepper, `Card style={styles.section}` "PROFIL") — field ini pindah ke Profil (temuan 1.3).
- Heading: `title` besar "KONDISI TUBUHMU" (Barlow Condensed ExtraBold 36pt, `FontFamily.headingExtraBold`) + subheading "Dihitung dari data profilmu." — ganti eyebrow "RAGAKU"/title "Kondisi Tubuhmu" (temuan 1.1).
- Kartu BMI: label diringkas jadi "INDEKS MASSA TUBUH" (hilangkan "(BMI)" supaya exact match spec baris 9), rentang berat ideal format "X sampai Y kg" (bukan "X–Y kg").
- Tambah teks "Memakai tinggi {height} cm dan berat {weight} kg dari profilmu. Berat berubah? Perbarui di Profil, atau hitung dengan angka lain di bawah." dengan 2 link inline (`ThemedText onPress`):
  - "Perbarui di Profil" → `router.push('/profil')`.
  - "Hitung angka lain" → `showAlternativeCalculatorNotice()` — alert/placeholder jelas ("Kalkulator dengan angka lain belum tersedia. Untuk sekarang, ubah tinggi/berat lewat Profil."). Kalkulator simpel sungguhan di luar scope task ini (anti-slop: tidak membuat fitur yang tidak ada, link tetap fungsional dan jelas).
- Pertahankan kalkulator kalori (BMR/TDEE/Target) — formula TIDAK diubah (health.ts tetap).
- Disclaimer tepat di bawah calorie card: teks exact spec "Estimasi edukatif untuk populasi umum, bukan saran medis individual." (bukan component `Disclaimer` generik — itu tetap ada di akhir halaman seperti sebelumnya).
- TINGKAT AKTIVITAS / TUJUAN dipertahankan (sudah match spec).
- Label field "Catatan pola makan (opsional)" sentence-case (bukan ALL CAPS eyebrow) + placeholder exact "Contoh: vegetarian, alergi kacang, puasa" (temuan 1.5).
- Tombol "Buat rencana hari ini" — hapus panah "→" (temuan 1.6).
- `Gender` type import dihapus (tidak lagi dipakai di beranda).

## 2. `src/app/(tabs)/profil.tsx` — REWRITE

- Heading: title "PROFIL" (all-caps, headingExtraBold 36pt) + subheading "Ubah data dirimu. Perhitungan kalori ikut menyesuaikan." (temuan 4.3).
- HAPUS section "RINGKASAN PROFIL" read-only (temuan 4.5) — digantikan form edit:
  - Section **DATA DIRI**: gender Segmented (Pria/Wanita), NumberStepper Usia/Tinggi badan/Berat saat ini — state lokal, baru commit ke `updateProfile()` saat tombol **"Simpan perubahan"** ditekan (match spec: field diedit, disimpan via tombol eksplisit, bukan auto-save per-keystroke seperti beranda lama).
  - Banner sukses teal "Perubahan profil tersimpan. Target kalori sudah dihitung ulang." muncul setelah simpan, auto-hide 4 detik ATAU hilang begitu field diedit lagi (`dismissBanner()` dipanggil di setiap `onChange`).
  - Section **UKURAN TUBUH**: NumberStepper "Lingkar leher" (field `neckCm` sudah ada di `MeasurementRecord`/`storage` — TIDAK membuat field baru di profile context, sesuai instruksi; ditulis via `storage.upsertMeasurement` record hari ini) + teks "Dipakai untuk estimasi lemak tubuh." + tombol outline "Ukur dari foto" → `router.push('/measurement')` + teks privasi "Foto dikirim lewat koneksi aman, diproses, lalu dihapus dari server. Hanya angka ukuran yang disimpan." (temuan 4.2).
  - Link kecil "Lihat ukuran manual & indikator lanjutan (WHtR, WHR, lemak tubuh) →" → `router.push('/ukuran')` (akses ke fitur ukuran.tsx yang dipindah dari tab ke sub-page).
  - Section AKUN dipertahankan (Keluar dari akun / Hapus semua data saya).
- Dialog hapus data: title "HAPUS SEMUA DATA?" (all-caps), body exact spec ("Profil, catatan berat, ukuran tubuh, dan hasil pengukuran foto akan dihapus permanen dari perangkat ini. Data yang sudah dihapus tidak bisa dikembalikan."), tombol confirm "Hapus semua data" (bukan "Hapus") (temuan 4.6).
- Dialog sign-out dipertahankan apa adanya (tidak ada spec pembanding — temuan 4.7, tidak disentuh).

## 3. `src/components/app-tabs.tsx` + `app-tabs.web.tsx`

- Hapus `NativeTabs.Trigger name="ukuran"` dan `TabTrigger name="ukuran"` — tab bar sekarang 4 entry: Beranda, Rencana, Progres, Profil, sesuai semua spec Figma (beranda.md, profil.md, dan web_*.md hanya sebut 4 tab).

## 4. `src/app/(tabs)/ukuran.tsx` — MINIMAL EDIT

- Tambah baris "← Kembali ke Profil" (`Pressable` + `router.push('/profil')`) di atas heading, supaya ada navigasi balik yang jelas sekarang route ini bukan tab lagi.
- Logic form manual + kalkulasi indikator (WHtR/WHR/body fat) TIDAK disentuh.

## Field check: `neckCm`

- Sudah ada di `MeasurementRecord` (`src/lib/model.ts:36`) dan dipakai `ukuran.tsx` + `health.ts` (US Navy body fat). Profil.tsx re-use field yang sama lewat `storage.getMeasurements()`/`storage.upsertMeasurement()` — TIDAK menduplikasi field baru di `Profile`/profile-context.

## Verifikasi

- `npx tsc --noEmit` dari root: **exit 0**.
- Tab bar: 4 entry (Beranda/Rencana/Progres/Profil); `/ukuran` tetap route valid, diakses via link di Profil.
- File yang TIDAK disentuh (sesuai batasan scope): `backend/`, `onboarding/`, auth files, `measurement.tsx`, `progress.tsx`, `rencana.tsx`, serta logic form manual/indikator di `ukuran.tsx`.

## Catatan anti-slop

- Tidak ada statistik/klaim baru ditambahkan. Teks baru di beranda ("Memakai tinggi X cm...") dan profil (banner sukses, teks privasi) copy exact dari spec.
- Link "Hitung angka lain" di Beranda: fitur kalkulator terpisah eksplisit di luar scope (disebutkan di task) — diberi placeholder fungsional yang jujur menjelaskan status, bukan UI kosong tanpa penjelasan atau klaim fitur yang belum ada.
