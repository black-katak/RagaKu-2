# Report: Fix Copy Onboarding RagaKu-2 sesuai Spec Figma Plain

Scope: pure copy + UI cleanup. Logic/state/navigasi/onboarding-context.tsx data model TIDAK diubah.

## 1. src/app/onboarding/index.tsx — REWRITE TOTAL
Before (hype lama, semua dihapus):
- Header row brand lockup RAGAKU AI + "ONBOARDING GOAL" + badge "STEP ACTIVE"
- Badge "POWERED BY AI ADAPTIVE BIOMETRICS"
- Heading "EVOLUSI PERFORMA TANPA BATAS"
- Subheading "AI Workout Plan Personal untuk Gaya Hidup Urban Aktif."
- 3 stat tiles fabricated: "99.4% AKURASI AI", "120K+ ATLET URBAN", "REALTIME BIOMETRIK"
- Tombol "MULAI PERJALANAN KEBUGARAN →"
- Trust row "ENKRIPSI DATA BIOMETRIK · ISO 27001 AI" (klaim sertifikasi palsu)

After (sesuai spec Figma "Onboarding - Sambutan"):
- Heading "LATIHAN YANG MENYESUAIKAN TUBUHMU"
- Subheading "Jawab empat langkah singkat. Program latihan disusun dari data tubuh, alat, dan waktu yang kamu punya."
- Tombol "Mulai atur profil"
- Dipertahankan: tombol "Salah akun? Keluar" (functional sign-out), disederhanakan posisi/styling

## 2. src/app/onboarding/biometric.tsx
- Eyebrow "KALIBRASI BIOMETRIK" → "DATA DIRI"; title "TENTUKAN TARGET & PROFIL FISIKMU" → "DATA DIRIMU"; desc "RagaKu AI mengkalkulasi baseline metabolisme..." → "Dipakai untuk menghitung kebutuhan kalori dan target latihan."
- HAPUS subtitle gender card fabricated: "Rasio Massa Otot +12%", "Zona Fat-Oxidation +18%"
- HAPUS "PEAK PERFORMANCE" label + "TARGET REGENERASI 20–35 Thn (Zone A)" (fabricated); slider usia disesuaikan spec jadi 18-80 th (sebelumnya 15-70)
- OTHER_GENDERS label "Pilih tidak memberitahu" → "Tidak ingin menyebut" (sesuai spec)
- GOAL_OPTIONS subtitle: "Fat Loss & Defisit Kalori"/"Hypertrophy & Rekomposisi"/"Bulking Bersih & Surplus" → "Defisit kalori terukur"/"Latihan beban dan rekomposisi"/"Surplus kalori bersih"; title tidak lagi di-uppercase paksa
- HAPUS badge inline "Defisit X kg" (angka derived tak ada di spec) dan box tip "RagaKu menetapkan target mingguan moderat 0.5 kg/pekan..." (tidak ada di spec)
- Teks BMI diganti sesuai kalimat spec: "BMI di target ini: X (kategori, standar Asia-Pasifik). Dihitung dari tinggi dan target berat di atas."
- HAPUS footer "Data biometrik terenkripsi aman & privat di RagaKu" (klaim keamanan tak berdasar)
- Tombol "LANJUT: CEK RIWAYAT FISIK →" → "Lanjut"
- Sectionlabel "JENIS KELAMIN BIOLOGIS"→"Jenis kelamin", "USIA ATLETIK"→"Usia", "TARGET UTAMA KEBUGARAN"→"Target utama" (+ hapus "Pilih Fokus")
- Style mati terkait (targetRegenBlock/Label/Value, badgeInline, tipRow, tipText, footerNote) dihapus

## 3. src/app/onboarding/health.tsx
- Eyebrow "ONBOARDING ASSESSMENT" → "RIWAYAT KESEHATAN"; title "RIWAYAT CEDERA & KESEHATAN" → "AREA BERMASALAH"; desc sesuai spec: "Ketuk bagian tubuh yang cedera atau perlu dihindari. Gerakan latihan disesuaikan."
- HAPUS badge "BIOMETRIC SCAN ACTIVE" (fabricated tech claim)
- HAPUS box "RAGAKU AI PROTECTION PROTOCOL AKTIF" + badge "PEMBERITAHUAN AMAN" → diganti info box plain "Catatan latihan" (fungsional tetap: menampilkan PROTECTION_NOTES per cedera, tapi tanpa branding AI Protocol/warning color)
- Scan hint teks statis "Ketuk titik persendian atau pilih tag kondisi di bawah" → hint dinamis sesuai spec per sisi tubuh (depan: "Bahu kiri dipilih. Sisi mengikuti tubuhmu, bukan layar. Ketuk lagi untuk membatalkan."; belakang: "Tampak belakang. Sisi mengikuti tubuhmu, bukan layar. Pilih area punggung atau bahu.")
- QUICK_CONDITIONS label title-case → sentence-case sesuai spec ("Pemulihan meniskus lutut", dst), "Tidak Ada Cedera / Kondisi Fit" → "Tidak ada cedera"
- Segmented "DEPAN"/"BELAKANG" → "Depan"/"Belakang"
- Section label "KONDISI CEPAT" (+ hapus "X TERPILIH"), "KONDISI / RIWAYAT LAINNYA (KUSTOM)" → "Riwayat lain (opsional)", link "+ TAMBAH CATATAN KHUSUS" → "+ Tambah catatan", placeholder note sesuai spec "Tulis kondisi lain di sini", tombol "SIMPAN"→"Simpan"
- Tombol "SIMPAN & LANJUT PILIH ALAT →" → "Simpan & lanjut"; "LEWATI LANGKAH INI" → "Lewati langkah ini"
- Style mati (scanBadge, safeBadge) dihapus

## 4. src/app/onboarding/equipment.tsx
- Eyebrow "PERSONALISASI FASILITAS" → "PERALATAN"; title "PERALATAN APA YANG KAMU MILIKI?" → "ALAT YANG KAMU PUNYA"; desc "RagaKu menyesuaikan program latihan harian dengan fasilitas yang kamu punya hari ini." → "Program dipilih dari alat yang benar-benar tersedia."
- HAPUS 4 badge kategori: "AKSES LENGKAP", "AKTIF", "BEBAS LOKASI", "STAMINA" (tidak ada di spec)
- HAPUS box "REKOMENDASI ADAPTIF" + copy "AI RagaKu otomatis mengeliminasi gerakan..." (fabricated, tidak ada di spec)
- Rename kategori: "FULL GYM COMMERCIAL"→"Gym lengkap", "ALAT RUMAHAN (HOME GYM)"→"Alat rumahan", "TANPA ALAT (BODYWEIGHT)"→"Tanpa alat", "KARDIO GEAR"→"Kardio"
- Deskripsi kategori disesuaikan spec singkat ("Barbell, dumbbell, mesin kabel, bench"; "Centang yang kamu punya, atau tulis sendiri."; "Hanya badan sendiri dan matras"; "Treadmill, sepeda statis, tali skipping")
- HAPUS link "Sesuaikan Alat Gym Tersedia" dan "+ Tambah Alat Lain" (tidak ada di spec)
- Status row "STATUS SELEKSI: ..." → "Terpilih: ..." sesuai pola spec "Terpilih: Alat rumahan (3 alat)"
- Tombol "LANJUT: OLAHRAGA FAVORIT →" → "Lanjut"
- Import Ionicons & style mati (categoryHeaderRow, categoryBadge*, linkText, recommendationBox/Text/Label) dihapus

## 5. src/app/onboarding/activities.tsx
- HAPUS box "ALGORITMA PERSONALISASI / ADAPTIF SESUAI PREFERENSI" (fabricated, tidak ada di spec)
- HAPUS box "INTEGRASI KALENDER RAGAKU AI" (tidak ada di spec)
- HAPUS badge per kartu olahraga ("KARDIO LOW-IMPACT", "VO2 MAX BOOSTER", dst — tidak ada di spec, spec hanya title+subtitle)
- SPORT_OPTIONS subtitle disesuaikan teks spec persis (contoh: "Bahu & mobilitas tulang belakang" → "Kardio low-impact, bahu dan tulang belakang")
- Title "Lari & Jogging"→"Lari dan jogging", "Bola Basket"→"Bola basket" sesuai spec
- Desc atas "Pilih minimal 2 aktivitas yang kamu nikmati untuk variasi jadwal kardio dan recovery mingguan." → "Pilih minimal 2 aktivitas untuk variasi kardio dan pemulihan mingguan."
- Section label "JADWAL LATIHAN" → "Hari per minggu"; "GAYA LATIHAN FAVORIT (OPSIONAL)" → "Gaya latihan (opsional)"; "Durasi per Sesi" → "Durasi per sesi"
- Slider usia label "1..7" → "1 hari"/"7 hari" sesuai spec; nilai hari ditampilkan "{n} hari"
- Status row "{n} OLAHRAGA DIPILIH" + list nama olahraga uppercase → "{n} olahraga dipilih" sesuai spec "2 olahraga dipilih"
- Tombol "BUAT PROGRAM RAGAKU AI PERSONAL SAYA →" (ALL CAPS + klaim fabricated) → "Buat program"
- HAPUS footer "ENKRIPSI BIOMETRIK & KEBUGARAN TERJAMIN" (klaim tak berdasar)
- Style mati (algoBox, algoLabel, algoIntroBox/Label/Title, footerNote) dihapus

## 6. src/components/ui/onboarding-header.tsx
- Progress text "LANGKAH {step} DARI {totalSteps}" → "{step} dari {totalSteps}" (sesuai pola spec "1 dari 4", "2 dari 4", dst)
- Struktur komponen (back button, logo RagaKu, STEP AKTIF badge, progress bar, title/description prop) TIDAK diubah — hanya teks.

## Anti-slop checklist
- Statistik/persentase fabricated (99.4%, +12%, +18%, 120K+) — DIHAPUS
- Badge teknologi tanpa dasar (AI ADAPTIVE BIOMETRICS, BIOMETRIC SCAN ACTIVE, PROTECTION PROTOCOL, ALGORITMA PERSONALISASI, INTEGRASI KALENDER) — DIHAPUS
- Klaim sertifikasi/enkripsi tak terverifikasi (ISO 27001, "terenkripsi aman", "ENKRIPSI BIOMETRIK & KEBUGARAN TERJAMIN") — DIHAPUS
- Semua CTA ALL-CAPS hype dengan tanda "→" fabricated diganti label plain sesuai spec

## Hasil tsc
`npx tsc --noEmit` dari root D:/Projects/RagaKu-2 → **exit code 0**, tidak ada error.

## File yang disentuh
- src/app/onboarding/index.tsx
- src/app/onboarding/biometric.tsx
- src/app/onboarding/health.tsx
- src/app/onboarding/equipment.tsx
- src/app/onboarding/activities.tsx
- src/components/ui/onboarding-header.tsx

onboarding-context.tsx TIDAK disentuh (tidak ada label teks fabricated di dalamnya — murni data model/types).

## Status: DONE
