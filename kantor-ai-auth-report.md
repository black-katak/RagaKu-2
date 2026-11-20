# Report: Fix copy auth screens sesuai spec Figma

Scope: `src/app/login.tsx`, `src/app/registrasi.tsx`, `src/app/lupa-password.tsx`.
Tidak menyentuh `auth-header.tsx`, `pill-button.tsx`, `text-field.tsx`, backend, atau logic validasi (hanya teks + hapus elemen UI yang tidak ada di spec).

## login.tsx
Before → After:
- Badge "AI WORKOUT ENGINE 2.4" (dihiasi, tidak ada di spec) → **dihapus**.
- Heading "SELAMAT DATANG KEMBALI" → "SELAMAT DATANG" (sesuai spec).
- Subheading "Lanjutkan progres transformasi dan program latihan AI harianmu." → "Masuk untuk membuka program latihanmu." (sesuai spec).
- Label field "Email atau No. Handphone" / placeholder "contoh: dimas.atlet@gmail.com" → label "Email" / placeholder "nama@email.com" (sesuai spec; field spec hanya email, bukan dual email/HP).
- "Ingat Saya" / "LUPA KATA SANDI?" (ALL CAPS) → "Ingat saya" / "Lupa kata sandi?" (sesuai capitalization spec).
- Tombol "MASUK KE RAGAKU" → "Masuk" (sesuai spec).
- Card "Target Hari Ini Menunggumu" + streak "14 HARI STREAK" (klaim data latihan yang tidak nyata untuk user yang belum login) → **dihapus**.
- Footer "Belum punya akun RagaKu? / DAFTAR SEKARANG" → "Belum punya akun? / Daftar".
- Trust row "Terenkripsi SSL 256-bit • Standar Privasi Biometrik" (klaim keamanan tidak diimplementasikan — auth cuma hash lokal non-kriptografis di AsyncStorage, lihat `src/lib/auth.ts`) → **dihapus**.

## registrasi.tsx
Before → After:
- Badge "Uji Coba Gratis 7 Hari Termasuk" (fabricated, tidak ada trial system di backend) → **dihapus**.
- Heading "BUAT AKUN RAGAKU" → "BUAT AKUN" (sesuai spec).
- Subheading "Mulai personalisasi program latihan dan nutrisi berbasis AI telemetry presisi." → "Isi data dasar. Program latihan disesuaikan di langkah berikutnya." (sesuai spec).
- Label "Alamat Email Aktif" → "Email" (sesuai spec).
- Label field WhatsApp "Nomor WhatsApp" + badge dekoratif "Reminder AI" → label "Nomor WhatsApp (opsional)" tanpa badge (sesuai spec; field memang opsional — validasi submit sekarang mengizinkan kosong, hanya validasi format jika diisi).
- Placeholder WhatsApp "812-3456-7890" → "0812 xxxx xxxx" (sesuai spec).
- Hint WhatsApp "Digunakan untuk jadwal latihan cerdas & motivasi personal WhatsApp." → "Dipakai untuk pengingat jadwal latihan." (sesuai spec).
- Placeholder kata sandi "Buat kata sandi aman" → "Buat kata sandi" (sesuai spec).
- Box kekuatan sandi dengan 3 pill selalu terlihat ("Kekuatan Sandi: Lemah/Sedang/Kuat" + daftar syarat selalu tampil) → diganti sesuai spec: heading "Syarat kata sandi", hanya menampilkan baris "Belum terpenuhi: ..." untuk syarat yang belum terpenuhi (match persis teks spec "Belum terpenuhi: Minimal 8 karakter" / "Huruf besar dan kecil" / "Ada angka").
- Teks persetujuan "...Kebijakan Privasi Data Kesehatan RagaKu." → "...Kebijakan Privasi Data Kesehatan." (sesuai spec, tanpa brand suffix).
- Tombol "BUAT AKUN & MULAI EVALUASI" (ALL CAPS) → "Buat akun & mulai evaluasi" (sesuai spec casing).
- Trust card "Enkripsi Medis End-to-End... standar HIPAA" (klaim sertifikasi palsu — RagaKu bukan entitas HIPAA-compliant, backend tidak punya kontrol kepatuhan HIPAA apa pun) → **dihapus**.
- Footer "Sudah memiliki akun? / MASUK DI SINI" → "Sudah punya akun? / Masuk di sini" (sesuai spec).

## lupa-password.tsx
Before → After:
- Hero icon dekoratif (lock-open + shield badge) → **dihapus** (tidak ada di spec).
- Badge "KEAMANAN AKUN RAGAKU" → **dihapus** (tidak ada di spec).
- Heading "ATUR ULANG KATA SANDI" → tetap (sudah sesuai spec).
- Subheading "Masukkan alamat email atau nomor WhatsApp yang terdaftar. Kami akan mengirimkan tautan verifikasi..." → "Masukkan email yang terdaftar. Kami kirim tautan untuk membuat kata sandi baru." (sesuai spec, exact).
- Segmented control Email/WhatsApp + label section "PILIH JALUR PENGIRIMAN" → **disederhanakan ke email-only**. Dicek `backend/` folder: tidak ada endpoint pengiriman WhatsApp/reset password apa pun (hanya `backend/tests`, `requirements.txt`, Dockerfile — tidak ada API reset). `src/lib/auth.ts` juga tidak punya method reset/kirim WA — layar lama memakai `setTimeout` palsu untuk SEMUA channel (tidak ada pengiriman nyata baik email maupun WhatsApp). Karena spec Figma plain cuma pakai email dan fitur WhatsApp di kode lama murni UI tanpa backend nyata, disederhanakan sesuai spec: field tunggal "Email" placeholder "nama@email.com".
- Hint "Pastikan email aktif dan periksa folder spam..." → "Tautan hanya dikirim ke email yang sudah terdaftar." (sesuai spec, exact).
- Tombol "KIRIM TAUTAN PEMULIHAN" / "TAUTAN TERKIRIM" (ALL CAPS) → "Kirim tautan" / "Tautan terkirim" (sesuai spec casing).
- Card "Butuh Bantuan Langsung? Tim Support RagaKu siap mendampingi 24/7..." + link WhatsApp Care (klaim support 24/7 fabricated, tidak ada tim support/nomor WA resmi terverifikasi di proyek) → **dihapus** (termasuk import `Linking` yang jadi tidak terpakai, dihapus).
- Footer "Kembali ke Halaman Masuk" (dengan chevron icon) → "Kembali ke halaman masuk" (sesuai spec casing; chevron dekoratif dihapus karena tidak ada di spec teks, link tetap fungsional).
- Trust row footer "Enkripsi 256-Bit • Telemetri & Akun Dilindungi" (klaim keamanan tidak diimplementasikan) → **dihapus**.

Import yang jadi tidak terpakai (`Ionicons`, `Segmented`, `Linking`, `theme` dekoratif) dihapus bersamaan dengan elemen UI terkait supaya tsc bersih.

## Hasil tsc
```
npx tsc --noEmit
exit code: 0
```
Bersih, tidak ada error.

## File yang disentuh
- `src/app/login.tsx`
- `src/app/registrasi.tsx`
- `src/app/lupa-password.tsx`

Tidak ada file lain yang diubah (auth-header.tsx, backend/, dependency — semua tetap).
