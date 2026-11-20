# Fix measurement.tsx — report

Scope: `src/app/measurement.tsx` only. No backend/, beranda.tsx, profil.tsx, app-tabs,
progress.tsx, rencana.tsx, onboarding/, auth files touched.

## 1. Consent screen (phase 'consent') — copy fixes (temuan 5.1–5.5)
- Title: `Pengukuran dari Foto` → `UKUR DARI FOTO` (all-caps, matches `styles.title`
  which already uses `FontFamily.headingBold` 28pt — spec requires Barlow Condensed
  28pt, style unchanged, only text fixed).
- Added subheading `"Tiga hal agar hasil akurat."` (was missing entirely).
- 3 guide bullets replaced with exact spec text (`ukur_dari_foto_modal.md:9-11`):
  1. "Seluruh tubuh terlihat dari kepala sampai kaki, berdiri tegak menghadap depan."
  2. "Cahaya merata dan latar belakang polos."
  3. "Pakaian pas badan, bukan longgar."
- Privacy text replaced with exact spec text, dropped fabricated opening sentence
  "Foto tubuh bersifat sensitif." and "koneksi aman (HTTPS)" → "lewat HTTPS":
  "Foto dikirim lewat HTTPS, diproses untuk menghitung ukuran, lalu dihapus dari
  server. Hanya angka cm yang disimpan."
- Primary button: `"Lanjut ke kamera"` → `"Buka kamera"`.

## 2. Capture/kamera screen (phase 'capture') — copy fixes (temuan 5.6)
- Capture button: `"Ambil foto"` → `"Ambil foto seluruh badan"`.
- Silhouette hint overlay: `"Posisikan seluruh tubuh di dalam panduan"` →
  `"Berdiri tegak, seluruh badan masuk bingkai"`.
- Close/cancel label: `"Batal"` → `"Tutup"` (matches `kamera.md:7`).

## 3. New phase 'result' (temuan 5.7 — CRITICAL fix)
- `processImage()` no longer calls `storage.upsertMeasurement()` + `router.back()`
  right after `api.measure()` succeeds. It now stores the API response in
  `pendingResult` state and sets `phase` to `'result'`.
- New `result` screen renders:
  - Heading "HASIL PENGUKURAN" (reuses existing `styles.title`, Barlow Condensed).
  - Subheading "Dihitung dari satu foto. Angka bersifat estimasi." (matches spec).
  - 4 `StatTile` metric cards using REAL fields from `MeasurementResponse`
    (`src/lib/api.ts`): `waist_cm` → "Lingkar pinggang", `hip_cm` → "Lingkar
    pinggul", `shoulder_width_cm` → "Lebar bahu", and WHtR ("Rasio pinggang-tinggi")
    computed via the shared `buildIndicators()` from `@/lib/health` — the SAME
    function `ukuran.tsx` uses, no duplicated calc logic.
  - Privacy note: "Fotonya sudah dihapus dari server. Hanya angka di atas yang
    disimpan di perangkatmu."
  - Primary button "Simpan hasil" → calls new `saveResult()`, which is the ONLY
    place `storage.upsertMeasurement()` is invoked for the photo flow, then
    `router.back()`.
  - Secondary button "Ukur ulang" → `retake()` resets `pendingResult`/`error` and
    goes back to `'consent'` phase without saving anything.

### Metric card deviation from spec (documented, not a bug)
Spec `hasil_pengukuran.md` shows 4 cards: Lingkar leher, Lingkar pinggang, WHtR,
Estimasi lemak tubuh (body fat %). The backend's actual `MeasurementResponse`
(`src/lib/api.ts:94-103`) does NOT return `neck_cm` or body-fat — it returns
`waist_cm, hip_cm, arm_length_cm, shoulder_width_cm, chest_cm`. Body-fat
(`usNavyBodyFat` in `health.ts`) REQUIRES `neckCm`, which this screen has no input
for (anti-slop rule forbids faking it with a placeholder number). Swapped the two
unavailable metrics ("Lingkar leher", "Estimasi lemak tubuh") for two metrics the
API actually returns and that are meaningful: "Lingkar pinggul" (hip_cm) and
"Lebar bahu" (shoulder_width_cm). Kept "Lingkar pinggang" and "Rasio
pinggang-tinggi (WHtR)" as in spec — both come from real data (`waist_cm`,
`buildIndicators`). Marked with a `ponytail:` comment in code pointing to the
upgrade path (add a neck-circumference input to this screen, then show the
spec's exact 4 cards with body-fat via `usNavyBodyFat`).

## Verification
- `npx tsc --noEmit` from repo root: **exit 0**.
- `storage.upsertMeasurement` call sites in `measurement.tsx`: only inside
  `saveResult()`, triggered only by the "Simpan hasil" button press.
