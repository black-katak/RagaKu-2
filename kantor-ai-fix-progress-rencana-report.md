# Fix progress.tsx & rencana.tsx — copy/state-mapping report

Scope: pure copy fix, no structural rebuild. Form-based rencana.tsx (checklist → generate button → result card) kept as-is.

## progress.tsx

1. Heading: eyebrow "PELACAKAN PROGRES" removed. Title now `"PROGRES"` (all-caps, `FontFamily.headingExtraBold`, 36px) + subheading `"Catat berat dan lingkar pinggang. Tren muncul setelah ada catatan."` — matches `progres.md` / `progres_tersimpan.md` / `web_progres.md`.
2. Added success banner: shown after `logEntry()` resolves, teal (`#134E4A`) background, white text `"Catatan berat hari ini tersimpan. Tren mingguan muncul setelah tiga catatan."`. Auto-hides after 4s via `setTimeout` + cleanup on unmount (`useRef` timer + `useEffect` cleanup). Matches `progres_tersimpan.md`.
3. Empty state split into two lines: bold heading `"Belum ada catatan"` (smallBold/16pt) + body `"Simpan berat badanmu hari ini untuk mulai melihat tren mingguan."` (small/textSecondary). Matches spec exactly.
4. Disclaimer fixed to exact spec text: `"Grafik bersifat informatif. Perubahan berat drastis sebaiknya dibahas dengan tenaga kesehatan."` (removed "tren" and "yang").
5. "TREN WHtR" section with StatTile/LineChart: left untouched per instructions (valid PRD F4 feature).

## rencana.tsx

1. Heading: eyebrow "RENCANA HARIAN" removed. Title now `"RENCANA"` (all-caps, headingExtraBold 36px) + subheading `"Tanya apa saja soal latihan dan makanmu hari ini."`. Matches `rencana_chat.md` / `web_rencana.md` family.
2. Screening gate copy replaced with exact spec text: `"Sebelum aku susun rencana, cek dulu kondisimu. Centang yang berlaku. Jika ada, rencana tidak dibuat dan sebaiknya konsultasi ke tenaga kesehatan."`
3. Screening-blocked (`blocked`) state remapped to `rencana_disetop_penyaringan.md`:
   - label `"RENCANA TIDAK DIBUAT"` (#B45309)
   - heading `"Ada kondisi yang perlu dibahas dulu"`
   - body `"Kamu mencentang kondisi kesehatan di penyaringan. Bahas dulu dengan tenaga kesehatan sebelum mengikuti rencana latihan."`
   - added button `"Ubah jawaban penyaringan"` (outline PillButton) that calls `scrollToScreening()`, which scrolls the ScrollView to the screening Card's measured `onLayout` y-offset (ref-based scroll, no navigation/rebuild needed).
4. Added loading state card (shown instead of the generate button while `loading` is true): label `"SEDANG MENYUSUN"`, heading `"Menyusun rencana hari ini"`, subtext `"Menghitung target kalori dan menyusun latihan. Biasanya di bawah 10 detik."`, plus a disabled spinner PillButton inside the card. Matches `rencana_memuat.md`.
5. `generate()` error handling reworked into a typed `ErrorState` map (`ERROR_STATES`) keyed by `rate_limit | screening_blocked | ai_failed`, each carrying label/heading/body/color from spec:
   - `e.status === 429` → rate_limit state: `"TERLALU BANYAK PERMINTAAN"` / `"Tunggu beberapa menit"` / `"Permintaan rencana hari ini sudah terlalu sering. Rencana yang sudah dibuat tetap tersimpan dan bisa dibuka lagi."` / button `"Coba lagi nanti"`. Matches `rencana_batas_permintaan.md`.
   - `e.code === 'screening_blocked'` → reuses the same screening_blocked copy as the blocked-state card (no longer trusts raw `e.message` from server).
   - generic AI failure (anything else, incl. non-`ApiError` exceptions) → ai_failed state: `"RENCANA GAGAL DIBUAT"` (#B91C1C) / `"Layanan AI tidak merespons"` / `"Rencana hari ini belum bisa dibuat. Coba lagi sebentar, atau susun latihan sendiri lewat tab Progres."` / button `"Coba lagi"`. Matches `rencana_gagal_ai.md`.
   - `e.status === 0` (no connection) → kept as separate `connError` state with the existing technical fallback text ("Tidak dapat terhubung ke server...") since this isn't a mapped Figma state; rendered in its own warning box so it doesn't collide with the new typed error card.
6. Disclaimer fixed to exact spec text: `"Rencana dibuat AI dari target kalori yang dihitung aplikasi. Bukan saran medis atau gizi profesional."` (was "dihasilkan AI berdasarkan").
7. Result sections (TARGET HARI INI / OLAHRAGA / MENU MAKAN / TIPS) in `PlanView`: untouched, structure preserved exactly as before.

## Verification

- `npx tsc --noEmit` from repo root → **exit 0**, no errors.
- All 4 extra rencana states (loading, ai_failed, rate_limit, screening_blocked) now render distinct label+heading+body+action matching their respective Figma spec files.
- progress.tsx has a success banner wired to the save action, auto-dismissing after 4s.
- Headings/subheadings/disclaimers in both files now match spec text verbatim (cross-checked against `progres.md`, `progres_tersimpan.md`, `web_progres.md`, `rencana_chat.md`, `web_rencana.md`, `rencana_memuat.md`, `rencana_gagal_ai.md`, `rencana_batas_permintaan.md`, `rencana_disetop_penyaringan.md`).

## Not touched

backend/, beranda.tsx, profil.tsx, app-tabs, measurement.tsx, onboarding/, auth files — out of scope, left untouched. rencana.tsx form structure (screening checklist → generate button → Target/Olahraga/Menu/Tips result card) intentionally preserved, not rebuilt into chat UI.
