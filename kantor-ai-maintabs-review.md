# Audit Main-Tab vs Figma v2 Spec — RagaKu-2

Audit-only, no files edited. Scope: 5 main-tab screens + 2 referensi (app-tabs).
Severity: critical / major / minor.

---

## 1. `src/app/(tabs)/beranda.tsx` vs `beranda.md` / `web_beranda.md`

1.1 **[CRITICAL]** Heading tidak cocok sama sekali dengan spec.
- Kode (`beranda.tsx:75-78`): eyebrow `"RAGAKU"`, title `"Kondisi Tubuhmu"`.
- Spec (`beranda.md:1,7`): heading seharusnya `"KONDISI TUBUHMU"` (Barlow Condensed 800, 36pt) sebagai judul utama, dan subheading `"Dihitung dari data profilmu."` (spec line 8) tidak ada di kode sama sekali.
- Rekomendasi: ganti eyebrow jadi teks statis sesuai hierarki figma (title besar "KONDISI TUBUHMU" + subtitle "Dihitung dari data profilmu."), bukan "RAGAKU"/"Kondisi Tubuhmu" title-case.

1.2 **[CRITICAL — missing feature]** Seluruh section kalkulator kalori interaktif di spec (BMR/TDEE/Target card dengan label "PERKIRAAN KEBUTUHAN HARIAN", tile "BMR"/"TDEE"/"Target" dengan nilai contoh 1.704/2.343/1.843 kkal) ADA di kode (`beranda.tsx:120-134`, label match `PERKIRAAN KEBUTUHAN HARIAN`). Ini OK — bukan gap. (Dicatat sebagai verifikasi positif, bukan temuan.)

1.3 **[MAJOR — fabricated/extra UI]** Section "PROFIL" (Jenis kelamin, Usia, Tinggi badan, Berat badan editor — `beranda.tsx:137-185`) dan section "TINGKAT AKTIVITAS"/"TUJUAN"/"CATATAN POLA MAKAN" (`beranda.tsx:187-233`) ditaruh di tab Beranda. Spec `beranda.md` memang berisi field-field ini (lines 29-39: TINGKAT AKTIVITAS, TUJUAN, Catatan pola makan) jadi secara copy cocok — namun field "Jenis kelamin", "Usia", "Tinggi badan", "Berat saat ini" di spec `beranda.md` TIDAK ADA; field-field identitas itu justru muncul di spec `profil.md` (DATA DIRI: Pria/Wanita, Usia, Tinggi badan, Berat saat ini). Kode menduplikasi editor profil penuh (gender/usia/tinggi/berat) di Beranda, padahal spec Beranda hanya punya BMI card (Asia-Pasifik/WHO toggle + angka BMI + kategori + rentang ideal + teks "Memakai tinggi 175 cm dan berat 74 kg dari profilmu...") — bukan form edit identitas.
- Spec Beranda (`beranda.md:9-17`) seharusnya render: label "INDEKS MASSA TUBUH", toggle "Asia-Pasifik"/"WHO", angka BMI besar "24,2", badge kategori "Berisiko (pra-obesitas)", box "Rentang berat ideal: 56,7 sampai 70,1 kg", teks penjelas "Memakai tinggi 175 cm dan berat 74 kg dari profilmu. Berat berubah? Perbarui di Profil, atau hitung dengan angka lain di bawah.", link "Perbarui di Profil" dan "Hitung angka lain".
- Kode TIDAK punya teks itu sama sekali — tidak ada "Memakai tinggi X cm dan berat Y kg dari profilmu...", tidak ada link "Perbarui di Profil" / "Hitung angka lain". Sebagai gantinya kode menaruh full editor form (gender toggle Pria/Wanita, age stepper, height stepper, weight stepper) langsung di kartu BMI (`beranda.tsx:137-184`) — field ini sesuai spec seharusnya tinggal di tab Profil, bukan duplikasi inline di Beranda.
- Rekomendasi: Beranda seharusnya tampilkan ringkasan read-only + 2 CTA link ("Perbarui di Profil" → navigasi ke tab Profil; "Hitung angka lain" → kalkulator terpisah), bukan form edit penuh. Ini bentrok arsitektur info: dua tempat edit identitas (Beranda & Profil) bisa bikin state tidak sinkron (meski sebenarnya share `useProfile()` context jadi secara data konsisten — tapi secara UX duplikat dan menyalahi spec).

1.4 **[MAJOR — missing copy]** Teks disclaimer kalori spec: `"Estimasi edukatif untuk populasi umum, bukan saran medis individual."` (`beranda.md:28`) tidak ditemukan verbatim di kode. Kode hanya render `Disclaimer` generic component (`disclaimer.tsx:19`: "Informasi ini bersifat edukatif dan merupakan estimasi untuk populasi, bukan diagnosis atau saran medis individual. Konsultasikan dengan tenaga kesehatan.") — teksnya beda kalimat dari spec meskipun temanya sama, dan tidak ada varian khusus kalori diselipkan setelah calorie card seperti spec minta.
- Rekomendasi: kalau mau match spec exact, sisipkan teks spec persis di bawah calorie card (bukan hanya di component Disclaimer generik di akhir halaman).

1.5 **[MINOR]** Label section "PROFIL" (`beranda.tsx:139`) dan "TINGKAT AKTIVITAS"/"TUJUAN"/"CATATAN POLA MAKAN (OPSIONAL)" — teks "CATATAN POLA MAKAN (OPSIONAL)" di kode (`beranda.tsx:217`) full caps semua, sedang spec (`beranda.md:38`) adalah "Catatan pola makan (opsional)" sentence-case sebagai field label — bukan section eyebrow 12pt. Placeholder teks juga beda: kode `"Mis. vegetarian, alergi kacang, jadwal puasa..."` (`beranda.tsx:222`) vs spec `"Contoh: vegetarian, alergi kacang, puasa"` (`beranda.md:39`). Beda kata "Mis." vs "Contoh", beda frasa akhir "jadwal puasa..." vs "puasa".

1.6 **[MINOR]** Tombol CTA: kode `"Buat rencana hari ini →"` (`beranda.tsx:235`, ada tanda panah unicode tambahan) vs spec persis `"Buat rencana hari ini"` (`beranda.md:40`, tanpa panah). Tanda panah "→" adalah styling tambahan tak ada di spec Figma teks field.

1.7 **[MINOR]** Formula kalori — cek data vs spec: kode pakai `calculateCalories()` di `health.ts:97-115`, Mifflin-St Jeor benar (`health.ts:83-86`: `10*weight + 6.25*height - 5*age + (male?5:-161)`), activity factor tabel standar (1.2/1.375/1.55/1.725, `health.ts:17-22`) — formula prinsip gizi BENAR, cocok dgn PRD appendix 13.
- Cek angka: Profile default di `model.ts:48-57` → age=27, male, height=175cm, weight=74kg, activityLevel='light', goal='lose'.
  - BMR = 10×74 + 6.25×175 − 5×27 + 5 = 740+1093.75−135+5 = 1703.75 → round = **1704** ✅ cocok spec (`beranda.md:20`: "1.704").
  - TDEE = 1703.75 × 1.375 (light) = 2343.08 → round = **2343** ✅ cocok spec (`beranda.md:23`: "2.343").
  - Target (goal=lose, delta −500) = 2343.08−500 = 1843.08 → round = **1843** ✅ cocok spec (`beranda.md:26`: "1.843").
  - BMI = 74/(1.75²) = 24.163... → toFixed(1) = **24.2** ✅ cocok spec (`beranda.md:12`: "24,2").
  - Kategori Asia-Pasifik, BMI 24.2 → `bmiCategory` (`health.ts:51`): 23.0≤24.2<25.0 → "Berisiko (pra-obesitas)" ✅ cocok spec (`beranda.md:13`).
  - Ideal weight range Asia-Pacific (18.5–22.9) × 1.75² = 56.656→**56.7** dan 70.11→**70.1** ✅ cocok spec (`beranda.md:14`: "56,7 sampai 70,1 kg").
- Verifikasi positif: SEMUA angka contoh default profile menghasilkan hasil identik dengan spec Figma. Formula dan implementasi BENAR. (Bukan temuan — dicatat sebagai bukti korektnes.)
- Catatan kecil format: spec pakai koma desimal Indonesia ("24,2", "1.843" pakai titik-ribuan), kode render `bmi.toFixed(1)` pakai titik desimal JS default (akan render "24.2" bukan "24,2") dan angka kalori tanpa pemisah ribuan (`${calories.bmr}` → "1704" bukan "1.704"). → **[MINOR — i18n number formatting]** tidak ada `toLocaleString('id-ID')`; berisiko tampil salah format lokal (titik vs koma) dibanding spec. File: `beranda.tsx:97,125-127`.

1.8 **[Tidak ada antislop/klaim palsu ditemukan]** — tidak ada statistik fabrication, sertifikasi palsu, atau klaim medis berlebihan di beranda.tsx.

---

## 2. `src/app/(tabs)/rencana.tsx` vs `rencana_chat.md` / `web_rencana.md` + 4 state tambahan

2.1 **[CRITICAL — arsitektur UI beda total dari spec]** Spec `rencana_chat.md` mendeskripsikan UI **chat-style**: heading "RENCANA" + subheading "Tanya apa saja soal latihan dan makanmu hari ini.", lalu quick-action chips "Susun latihan" / "Susun menu makan" / "Catat berat hari ini", input "Tulis pesan" (chat composer), dan AI response bubble contoh: `"Siap. Hari ini 1.843 kkal, latihan beban atas 40 menit. Mau aku susun apa dulu?"` (`rencana_chat.md:15`).
- Kode (`rencana.tsx`) TIDAK ada chat UI sama sekali — tidak ada subheading, tidak ada 3 quick-action chip ("Susun latihan"/"Susun menu makan"/"Catat berat hari ini"), tidak ada text input "Tulis pesan", tidak ada chat bubble AI. Kode malah render heading beda `"RENCANA HARIAN"` eyebrow + title `"Olahraga & Makan"` (`rencana.tsx:74-77`) — sama sekali tidak cocok dengan spec heading/subtitle manapun ("RENCANA" + "Tanya apa saja soal latihan dan makanmu hari ini.").
- Severity CRITICAL karena ini bukan gap copy kecil — seluruh paradigma interaksi (chat vs form generate-plan-card) berbeda dari spec 5 file (rencana_chat, rencana_memuat, rencana_gagal_ai, rencana_batas_permintaan, rencana_disetop_penyaringan) yang semuanya konsisten menunjukkan chat UI dengan 3 quick-action chip + text composer.
- Rekomendasi: PM/reviewer perlu klarifikasi apakah ini pivot produk yang disengaja (non-chat form-based flow) atau implementasi belum menyusul redesain Figma v2 chat. Kalau redesain v2 memang menuju chat UI, rencana.tsx perlu dibangun ulang total.

2.2 **[CRITICAL — missing feature]** Teks screening gate di spec: `"Sebelum aku susun rencana, cek dulu kondisimu. Centang yang berlaku. Jika ada, rencana tidak dibuat dan sebaiknya konsultasi ke tenaga kesehatan."` (`rencana_chat.md:9`) — persona "aku" (chat/AI voice).
- Kode (`rencana.tsx:85-88`): `"Demi keamanan, centang jika salah satu kondisi berikut berlaku. Jika ada yang dicentang, rencana otomatis tidak dibuat."` — beda kalimat total, hilang kalimat ajakan konsultasi tenaga kesehatan yang ada di spec. Juga nada berbeda (impersonal vs chat-persona "aku").

2.3 **[MAJOR — missing state]** Cek 4 state tambahan:
- **Loading (`rencana_memuat.md`)**: spec minta label "SEDANG MENYUSUN" + heading "Menyusun rencana hari ini" + subtext "Menghitung target kalori dan menyusun latihan. Biasanya di bawah 10 detik." Kode (`rencana.tsx:111-115`) HANYA ubah label tombol jadi loading spinner via `PillButton loading={loading}` — tidak ada card/heading "SEDANG MENYUSUN" / "Menyusun rencana hari ini" / estimasi waktu "di bawah 10 detik" sama sekali. **Missing feature major.**
- **Error AI gagal (`rencana_gagal_ai.md`)**: spec minta label "RENCANA GAGAL DIBUAT" (merah #B91C1C) + heading "Layanan AI tidak merespons" + body "Rencana hari ini belum bisa dibuat. Coba lagi sebentar, atau susun latihan sendiri lewat tab Progres." + tombol "Coba lagi". Kode (`rencana.tsx:48-61`) hanya fallback generic: untuk error non-429/non-screening_blocked/non-status-0, pesan jadi `e.message` apa adanya dari API — tidak ada mapping ke copy spec di atas, tidak ada heading "Layanan AI tidak merespons", tidak ada tombol retry khusus "Coba lagi" (cuma textbox error + tombol utama yang berlabel sama seperti awal "Buat rencana hari ini"/"Buat ulang rencana"). **Missing/mismatched copy major.**
- **Rate limit 429 (`rencana_batas_permintaan.md`)**: spec minta label "TERLALU BANYAK PERMINTAAN" + heading "Tunggu beberapa menit" + body "Permintaan rencana hari ini sudah terlalu sering. Rencana yang sudah dibuat tetap tersimpan dan bisa dibuka lagi." + tombol "Coba lagi nanti". Kode (`rencana.tsx:50-51`): `"Model sedang sibuk (rate limit). Coba lagi sebentar lagi."` — beda kalimat total dari spec, tidak ada heading "Tunggu beberapa menit", tidak ada jaminan "rencana yang sudah dibuat tetap tersimpan", tombol generic bukan "Coba lagi nanti". **Mismatched copy major.**
- **Screening blocked 409 (`rencana_disetop_penyaringan.md`)**: spec minta label "RENCANA TIDAK DIBUAT" + heading "Ada kondisi yang perlu dibahas dulu" + body "Kamu mencentang kondisi kesehatan di penyaringan. Bahas dulu dengan tenaga kesehatan sebelum mengikuti rencana latihan." + tombol "Ubah jawaban penyaringan". Kode HANDLE screening blocked dengan 2 jalur berbeda: (a) `blocked` local state via `screeningBlocked(screening)` (`rencana.tsx:39,102-109`) menampilkan box warning teks `"Berdasarkan jawaban penyaringan, rencana otomatis tidak dibuat. Silakan konsultasi dengan tenaga kesehatan sebelum memulai program."` — beda kalimat dari spec, dan tidak ada tombol "Ubah jawaban penyaringan" (tidak ada CTA aksi apapun, hanya teks statis); (b) server-side `code === 'screening_blocked'` (`rencana.tsx:52-53`) hanya nampilkan `e.message` dari server mentah, tidak dipetakan ke heading "Ada kondisi yang perlu dibahas dulu" / label "RENCANA TIDAK DIBUAT". **Missing feature major** — tidak ada tombol aksi "Ubah jawaban penyaringan" di manapun.

2.4 **[MINOR]** Section label "PENYARINGAN KESEHATAN" (`rencana.tsx:83`) cocok exact dengan spec (`rencana_chat.md:10`). ✅ match.

2.5 **[MINOR]** Teks screening 3 pertanyaan ("Sedang hamil", "Memiliki penyakit kronis", "Pernah mengalami gangguan makan") di `rencana.tsx:26-29` cocok exact dengan spec (`rencana_chat.md:11-13`). ✅ match.

2.6 **[MINOR]** Disclaimer AI: kode (`rencana.tsx:129`) `"Rencana ini dihasilkan AI berdasarkan target kalori yang dihitung aplikasi. Bukan saran medis atau gizi profesional."` vs spec (`rencana_chat.md:24`) `"Rencana dibuat AI dari target kalori yang dihitung aplikasi. Bukan saran medis atau gizi profesional."` — beda kata kerja "dihasilkan AI berdasarkan" vs "dibuat AI dari". Minor paraphrase, makna sama.

2.7 **[MINOR — fabricated/extra]** Badge "dari cache" (`rencana.tsx:145-151`, `plan.cached`) dan section-section hasil plan (TARGET HARI INI, OLAHRAGA, MENU MAKAN, TIPS dengan field exercise/meal/tips detail) tidak ada representasinya di spec teks manapun yang dibaca (spec rencana_chat hanya tunjukkan 1 chat bubble ringkasan, bukan card breakdown). Ini extra UI dibanding spec — bisa jadi fitur yang sudah ada sebelum redesain v2 dan belum dipetakan ulang ke pola chat. Flag sebagai elemen di luar spec (bukan berarti harus dihapus, tapi perlu rekonsiliasi dengan redesain v2).

2.8 **[Tidak ada klaim antislop palsu]** — tidak ada statistik/sertifikasi fabrikasi di rencana.tsx.

---

## 3. `src/app/(tabs)/progress.tsx` vs `progres.md` / `progres_tersimpan.md` / `web_progres.md`

3.1 **[MAJOR]** Heading tidak match spec.
- Kode (`progress.tsx:62-65`): eyebrow `"PELACAKAN PROGRES"` + title `"Progres"` (title-case).
- Spec (`progres.md:1,7-8`): heading seharusnya `"PROGRES"` (all-caps, Barlow Condensed 36pt) sebagai judul utama + subheading `"Catat berat dan lingkar pinggang. Tren muncul setelah ada catatan."` — subheading ini TIDAK ADA di kode sama sekali, dan title di kode pakai title-case "Progres" bukan all-caps "PROGRES" sesuai hierarchy spec (title besar yang all-caps, bukan eyebrow kecil yang all-caps).
- Rekomendasi: swap — title besar jadi "PROGRES" (all-caps) + tambahkan subheading teks spec; "PELACAKAN PROGRES" sebagai eyebrow adalah fabrication, tidak ada di spec manapun (progres.md, progres_tersimpan.md, web_progres.md).

3.2 **[MAJOR — missing copy, state tersimpan]** Spec `progres_tersimpan.md:7` (state setelah save) menuntut toast/banner konfirmasi: `"Catatan berat hari ini tersimpan. Tren mingguan muncul setelah tiga catatan."` (hijau teal #134E4A, muncul di atas heading).
- Kode: `logEntry()` (`progress.tsx:39-43`) hanya `storage.addProgress(...)` lalu `setEntries(next)` — TIDAK ADA banner/toast konfirmasi tersimpan sama sekali. User tidak mendapat feedback visual sukses simpan sesuai spec. **Missing feature major.**

3.3 **[MINOR]** Empty state copy beda dari spec.
- Spec (`progres.md:17-18`): heading `"Belum ada catatan"` (16pt bold) + body `"Simpan berat badanmu hari ini untuk mulai melihat tren mingguan."`
- Kode (`progress.tsx:97-99`): hanya 1 baris gabungan `"Belum ada catatan. Simpan berat badanmu untuk mulai melihat tren."` — hilang kata "hari ini" dan "mingguan", dan tidak dipecah jadi heading+body 2 tingkat seperti spec (cuma 1 text block).

3.4 **[MINOR]** Disclaimer akhir: kode (`progress.tsx:147`) `"Grafik tren bersifat informatif. Perubahan berat yang drastis sebaiknya dibahas dengan tenaga kesehatan."` vs spec (`progres.md:19`) `"Grafik bersifat informatif. Perubahan berat drastis sebaiknya dibahas dengan tenaga kesehatan."` — kode menambah kata "tren" dan "yang" yang tidak ada di spec. Minor paraphrase.

3.5 **[MINOR — fabricated/extra]** Section "TREN WHtR" dengan garis target 0.5 dan 2 `StatTile` ("Berat terbaru"/"Catatan") di kode (`progress.tsx:103-142`) tidak direpresentasikan di teks spec manapun (progres.md hanya sebutkan grafik umum, tidak detail WHtR chart atau delta trend arrow). Bukan pelanggaran tapi fitur ekstra di luar spec teks — perlu cek apakah ini by design (fitur lanjutan PRD F4 WHtR) atau belum match ke Figma card Figma yang sebenarnya (reviewer tidak punya akses visual Figma, hanya teks).

3.6 **[Data/logic check]** WHtR dihitung `waistCm / heightCm` (`progress.tsx:47-49`) — formula benar (Waist-to-Height Ratio standar). `whtrRiskLabel` (`health.ts:120-125`) pakai ambang 0.4/0.5/0.6 — konsisten dengan literatur WHtR umum (<0.5 sehat). ✅ formula benar secara prinsip.

3.7 **[Tidak ada klaim antislop palsu]** — tidak ditemukan statistik/sertifikasi fabrikasi.

---

## 4. `src/app/(tabs)/profil.tsx` vs `profil.md` / `profil_tersimpan.md` / `web_profil.md` / `hapus_data_dialog.md` / `web_hapus_data.md`

4.1 **[CRITICAL — arsitektur/copy mismatch]** Spec `profil.md` mendeskripsikan Profil sebagai **form edit penuh**: heading "PROFIL" + subheading "Ubah data dirimu. Perhitungan kalori ikut menyesuaikan.", section "DATA DIRI" (Pria/Wanita toggle, Usia stepper, Tinggi badan stepper, Berat saat ini stepper + tombol "Simpan perubahan"), section "UKURAN TUBUH" (Lingkar leher stepper + tombol "Ukur dari foto"), section "AKUN" (Keluar dari akun, Hapus semua data saya).
- Kode (`profil.tsx`) adalah **read-only summary** — heading eyebrow "AKUN" + title "Profil" (bukan all-caps "PROFIL" sesuai spec hierarchy), lalu identity card (nama/email dari session), `RINGKASAN PROFIL` (StatTile read-only: Tinggi/Berat/Usia/Target + teks "Level aktivitas: X. Ubah data ini di tab Beranda."), lalu tombol Keluar & Hapus data. **TIDAK ADA** form edit DATA DIRI (gender/usia/tinggi/berat stepper) di tab Profil — field ini malah ditaruh di Beranda (lihat temuan 1.3). **TIDAK ADA** section "UKURAN TUBUH" (Lingkar leher stepper + tombol "Ukur dari foto") di Profil sama sekali — ini entry point ke fitur ukur-dari-foto yang menurut spec seharusnya dari tab Profil, tapi kode tidak expose jalan masuk apapun ke `measurement.tsx` dari profil.tsx.
- Rekomendasi: ini bukan cuma copy gap — field edit profil dan entry point "Ukur dari foto" tertukar tab dibanding spec Figma (edit ada di Beranda, seharusnya di Profil per spec). Severity CRITICAL karena pengguna tidak bisa akses fitur "Ukur dari foto" dari tab Profil sama sekali (lihat 4.2).

4.2 **[CRITICAL — missing feature]** Tombol "Ukur dari foto" (`profil.md:27`, warna teal #0F766E) dan teks privasi pendamping `"Foto dikirim lewat koneksi aman, diproses, lalu dihapus dari server. Hanya angka ukuran yang disimpan."` (`profil.md:28`) **TIDAK ADA** di manapun pada `profil.tsx`. Tidak ditemukan juga navigasi ke `measurement.tsx` dari file ini atau dari beranda.tsx/progress.tsx (perlu dicek apakah ada entry point lain di app yang tidak termasuk scope audit — tapi dalam 5 file + 2 referensi yang diaudit, tidak ditemukan).
- Dampak: fitur ukur-dari-foto (measurement.tsx, kamera.md, hasil_pengukuran.md, ukur_dari_foto_modal.md) berpotensi UNREACHABLE dari UI tab utama dalam kode saat ini — hanya bisa diakses lewat deep-link/route langsung `/measurement`, bukan tombol UI manapun di 5 tab yang diaudit.
- Rekomendasi: tambahkan tombol "Ukur dari foto" + card "Lingkar leher" di Profil sesuai spec, yang menavigasi ke `/measurement`.

4.3 **[MAJOR]** Heading/subheading Profil tidak match.
- Kode (`profil.tsx:74-77`): eyebrow "AKUN" + title "Profil" (title-case).
- Spec (`profil.md:1,7-8`): title besar harus "PROFIL" (all-caps) + subheading "Ubah data dirimu. Perhitungan kalori ikut menyesuaikan." — subheading ini tidak ada di kode sama sekali.

4.4 **[MAJOR — missing copy, state tersimpan]** Spec `profil_tersimpan.md:7`: banner sukses `"Perubahan profil tersimpan. Target kalori sudah dihitung ulang."` (teal #134E4A) seharusnya tampil setelah "Simpan perubahan" ditekan. Karena kode `profil.tsx` sama sekali tidak punya form edit / tombol "Simpan perubahan" (lihat 4.1), state ini juga otomatis **missing** — tidak ada mekanisme simpan + banner konfirmasi di tab Profil manapun.

4.5 **[MINOR]** Section "RINGKASAN PROFIL" (`profil.tsx:93`) adalah label fabricated — tidak ada di spec manapun (profil.md pakai "DATA DIRI", bukan "RINGKASAN PROFIL"). Ini section buatan kode untuk menggantikan form edit yang hilang, bukan section asli spec.

4.6 **[MINOR]** Dialog hapus data — bandingkan `confirm-dialog.tsx` + `profil.tsx:133-141` vs `hapus_data_dialog.md`:
- Spec judul: `"HAPUS SEMUA DATA?"` (all-caps, Barlow Condensed 28pt, `hapus_data_dialog.md:8`). Kode: `title="Hapus semua data?"` (`profil.tsx:135`, title-case, bukan all-caps, dan component `ConfirmDialog` render dengan `type="subtitle"` bukan heading besar Barlow Condensed — lihat `confirm-dialog.tsx:47`, font style beda dari spec).
- Spec body: `"Profil, catatan berat, ukuran tubuh, dan hasil pengukuran foto akan dihapus permanen dari perangkat ini. Data yang sudah dihapus tidak bisa dikembalikan."` (`hapus_data_dialog.md:9`). Kode body: `"Semua profil, ukuran, progres, dan akun akan dihapus dari perangkat ini. Tindakan ini tidak dapat dibatalkan."` (`profil.tsx:136`) — beda signifikan: kode sebut "akun" (bukan di spec), spec sebut "hasil pengukuran foto" (bukan di kode), frasa penutup beda ("tidak bisa dikembalikan" vs "tidak dapat dibatalkan").
- Spec tombol: `"Batal"` / `"Hapus semua data"` (`hapus_data_dialog.md:10-11`). Kode: `cancelLabel` default `"Batal"` ✅ match; tapi `confirmLabel={deleting ? 'Menghapus…' : 'Hapus'}` (`profil.tsx:137`) — label "Hapus" saja, bukan "Hapus semua data" sesuai spec.
- Severity MINOR-MAJOR borderline; digolongkan MINOR karena fungsi (destructive confirm) tetap benar, hanya copy tidak persis.

4.7 **[MINOR]** Dialog sign-out: spec tidak punya file spesifik untuk ini dalam scope (tidak diaudit terpisah), tapi dicatat: `profil.tsx:127-131` pakai teks custom "Keluar dari akun?" / "Data latihan dan profil tetap tersimpan di perangkat ini." — tidak ada pembanding spec, jadi tidak diberi severity, hanya catatan referensi.

4.8 **[Tidak ada klaim antislop palsu]** — tidak ditemukan statistik/sertifikasi fabrikasi di profil.tsx atau confirm-dialog.tsx.

---

## 5. `src/app/measurement.tsx` vs `kamera.md` / `hasil_pengukuran.md` / `ukur_dari_foto_modal.md` / `web_ukur_dari_foto.md`

5.1 **[MAJOR]** Modal consent — judul tidak match spec.
- Spec (`ukur_dari_foto_modal.md:17,7`): heading seharusnya `"UKUR DARI FOTO"` (all-caps, Barlow Condensed 28pt) + subheading `"Tiga hal agar hasil akurat."` keduanya di atas section PANDUAN FOTO.
- Kode (`measurement.tsx:85`): `<ThemedText style={styles.title}>Pengukuran dari Foto</ThemedText>` — title-case "Pengukuran dari Foto", BUKAN all-caps "UKUR DARI FOTO". Subheading `"Tiga hal agar hasil akurat."` TIDAK ADA di kode sama sekali.

5.2 **[MAJOR — missing copy, 3 guide bullets]** Spec panduan foto 3-poin exact text (`ukur_dari_foto_modal.md:9-11`):
1. "Seluruh tubuh terlihat dari kepala sampai kaki, berdiri tegak menghadap depan."
2. "Cahaya merata dan latar belakang polos."
3. "Pakaian pas badan, bukan longgar."
- Kode (`measurement.tsx:91-93`) pakai teks PARAPHRASE beda kata:
1. "Seluruh tubuh terlihat dari kepala sampai kaki, pose tegak menghadap depan." (beda: "berdiri tegak" → "pose tegak")
2. "Pencahayaan merata, latar belakang polos." (beda: "Cahaya merata dan" → "Pencahayaan merata,")
3. "Pakaian pas badan (bukan longgar) agar estimasi lebih akurat." (beda: tambahan klausa "agar estimasi lebih akurat" tidak ada di spec — minor elaborasi, bukan fabrication besar tapi tetap deviasi dari exact copy)

5.3 **[MINOR]** Teks privasi: spec (`ukur_dari_foto_modal.md:13`) `"Foto dikirim lewat HTTPS, diproses untuk menghitung ukuran, lalu dihapus dari server. Hanya angka cm yang disimpan."` vs kode (`measurement.tsx:100-104`) `"Foto tubuh bersifat sensitif. Foto dikirim melalui koneksi aman (HTTPS), diproses untuk menghitung ukuran, lalu dihapus dari server. Hanya angka ukuran (cm) yang disimpan di perangkatmu."` — kode menambah kalimat pembuka "Foto tubuh bersifat sensitif." yang tidak ada di spec (extra/fabricated sentence, meski masuk akal secara konteks privasi — tetap deviasi dari exact copy spec). Juga "koneksi aman (HTTPS)" vs spec "lewat HTTPS" — parafrase.

5.4 **[MINOR]** Consent checkbox teks: kode (`measurement.tsx:118-120`) `"Saya mengerti dan setuju fotoku diproses lalu dihapus dari server."` — ✅ EXACT match dengan spec (`ukur_dari_foto_modal.md:14`). Good.

5.5 **[MAJOR]** Label tombol CTA consent: spec (`ukur_dari_foto_modal.md:15-16`) `"Buka kamera"` dan `"Pilih dari galeri"`. Kode (`measurement.tsx:123-124,138`): tombol primary berlabel `"Lanjut ke kamera"` — BUKAN `"Buka kamera"` sesuai spec. Tombol kedua `"Pilih dari galeri"` ✅ match spec.

5.6 **[MAJOR — missing screen text]** Fase kamera (`kamera.md`): spec minta teks `"Tutup"`, `"Ambil foto seluruh badan"`, `"Berdiri tegak, seluruh badan masuk bingkai"`, `"Pilih dari galeri"`.
- Kode fase capture (`measurement.tsx:146-197`): tombol capture berlabel `"Ambil foto"` (`measurement.tsx:184`) — bukan `"Ambil foto seluruh badan"` sesuai spec (`kamera.md:8`). Hint overlay di kode: `"Posisikan seluruh tubuh di dalam panduan"` (`measurement.tsx:154-156`) — beda total dari spec `"Berdiri tegak, seluruh badan masuk bingkai"` (`kamera.md:9`). Tombol "Tutup" (spec `kamera.md:7`) tidak ada secara eksplisit di fase ini — kode cuma punya "Batal" (`measurement.tsx:187-191`), beda label dari spec "Tutup".

5.7 **[CRITICAL — missing feature]** Layar `hasil_pengukuran.md` (Hasil Pengukuran, heading "HASIL PENGUKURAN" + 4 metric card: Lingkar leher, Lingkar pinggang, Rasio pinggang-tinggi (WHtR), Estimasi lemak tubuh + teks "Fotonya sudah dihapus dari server. Hanya angka di atas yang disimpan di perangkatmu." + tombol "Simpan hasil") **TIDAK ADA di `measurement.tsx` sama sekali**.
- Kode (`measurement.tsx:31-57` `processImage`): setelah API `api.measure()` sukses, langsung `storage.upsertMeasurement(...)` lalu `router.back()` (`measurement.tsx:45`) — TIDAK menampilkan layar hasil/konfirmasi apapun ke user. User tidak pernah melihat angka hasil pengukuran (leher/pinggang/WHtR/body fat) sebelum data tersimpan, tidak ada tombol "Simpan hasil" terpisah (data auto-saved tanpa review), dan tidak ada notifikasi "Fotonya sudah dihapus dari server."
- Ini gap FITUR besar: seluruh layar review-hasil dari spec hilang total, diganti auto-save-and-navigate-back tanpa konfirmasi visual. User kehilangan kesempatan verifikasi angka sebelum simpan, dan tidak mendapat kepastian privasi ("foto sudah dihapus") yang menurut PRD section 7 seharusnya dikomunikasikan di titik ini.

5.8 **[MINOR — web variant note]** Spec `web_ukur_dari_foto.md` (desktop) punya copy tambahan khusus: `"Lanjutkan di aplikasi ponsel"` dan `"Pengukuran memakai kamera, jadi langkah ini hanya tersedia di ponsel. Hasilnya otomatis muncul di sini setelah tersimpan."` (karena kamera tidak tersedia di web desktop). `measurement.tsx` tidak punya file `.web.tsx` terpisah/pengecekan platform untuk menampilkan pesan ini — di web, flow kemungkinan jatuh ke `permission?.granted` false branch generic `"Kamera tidak tersedia. Gunakan galeri."` (`measurement.tsx:162-164`), bukan pesan spec web yang lebih spesifik mengarahkan ke app ponsel. Tidak dicek apakah ada file web terpisah di luar scope — dicatat sebagai temuan minor karena berpotensi UX kurang jelas di web.

5.9 **[Data/logic check]** `hasil_pengukuran.md` contoh: Lingkar leher 38cm, Lingkar pinggang 80cm → WHtR = 80/175(height default) = 0.457 → spec show "0,46" ✅ matematis benar (rounding ke 2 desimal). Estimasi lemak tubuh 18% — cek formula US Navy body fat di `health.ts:143-157` (`usNavyBodyFat`): untuk male, `86.01*log10(waist-neck) - 70.041*log10(height) + 36.76`. Dengan waist=80, neck=38, height=175: `86.01*log10(42) - 70.041*log10(175) + 36.76 = 86.01*1.6232 - 70.041*2.2430 + 36.76 ≈ 139.62 - 157.08 + 36.76 ≈ 19.3%`. Spec contoh nunjukkan "18%" — selisih ~1.3 poin dari kalkulasi formula aktual dengan input spec sendiri.
- **[MINOR — data inconsistency]** Selisih kecil (~1pt) ini mungkin karena spec pakai rounding/contoh ilustratif berbeda, bukan bug formula (formula US Navy sendiri sudah benar secara prinsip — persamaan standar). Tidak cukup signifikan untuk CRITICAL, tapi dicatat sebagai reminder untuk reviewer/PM: kalkulasi US Navy body fat method di `health.ts` sesuai formula standar, meski contoh angka di spec (18%) tidak persis match hasil formula aktual (≈19.3%) dengan input sama — kemungkinan mock data spec Figma dibuat manual tanpa run formula real.

5.10 **[Tidak ada klaim antislop palsu]** — tidak ditemukan statistik/sertifikasi medis fabrikasi di measurement.tsx.

---

## Referensi (tidak diaudit terpisah): `app-tabs.tsx` & `app-tabs.web.tsx`

- Route names: `beranda`, `rencana`, `ukuran`, `progress`, `profil` — **ADA 5 ROUTE** (termasuk `ukuran`), bukan 4 tab sesuai scope task (Beranda/Rencana/Progres/Profil).
- **[MAJOR — catatan referensi, bukan temuan terpisah per instruksi]** Label tab di kode: "Beranda", "Rencana", "**Ukuran**", "Progres", "Profil" (`app-tabs.tsx:16,21,26,31,36` dan `app-tabs.web.tsx:24,27,30,33,36`). Spec Figma (`beranda.md:41-44`, `rencana_chat.md:16-19`, `progres.md:20-23`, `profil.md:32-35`, dan semua web_*.md) HANYA mendefinisikan 4 tab: **Beranda, Rencana, Progres, Profil** — TIDAK ADA tab "Ukuran" di spec manapun yang diaudit.
- Tab bar punya 5 entries di kode vs 4 di spec. Tab "Ukuran" (route `/ukuran` → `ukuran.tsx`, di luar scope 5-file tapi terdeteksi saat listing folder `(tabs)/`) adalah ekstra dibanding spec. Kemungkinan ini access-point terpisah untuk fitur ukur tubuh (bukan `measurement.tsx` — ada file lain `ukuran.tsx` di folder tabs yang tidak termasuk dalam 5 file scope audit ini). Dicatat sebagai konteks penting: entry point ke fitur ukur-dari-foto yang "hilang" dari Profil (temuan 4.2) MUNGKIN sebenarnya ada via tab "Ukuran" terpisah — tapi tab ini sendiri tidak ada di spec Figma manapun, jadi tetap ada diskrepansi struktur tab (5 vs 4) yang perlu diklarifikasi oleh PM/desainer.
- Label lain (Beranda/Rencana/Progres/Profil) semua match copy exact dengan spec (font weight/warna tidak diverifikasi — fokus teks saja sesuai task).

---

## Ringkasan Jumlah Temuan per Severity

| Severity | Jumlah |
|---|---|
| CRITICAL | 7 |
| MAJOR | 13 |
| MINOR | 16 |
| **TOTAL** | **36** |

Rincian CRITICAL:
1.1 Beranda heading tidak match
1.3 Beranda duplikasi form profil (seharusnya di tab Profil)
2.1 Rencana: arsitektur chat UI hilang total
2.2 Rencana: copy screening gate beda total dari spec
4.1 Profil: form edit hilang, tertukar lokasi dengan Beranda
4.2 Profil: tombol "Ukur dari foto" & entry point hilang total
5.7 Measurement: layar "Hasil Pengukuran" (review before save) hilang total
