# rencana.tsx chat-UI rebuild — report

Scope: rebuild `src/app/(tabs)/rencana.tsx` only. Linear form (checklist → generate button → result card) replaced with a chat/bubble conversation state machine, backed by the same `/api/v1/plan` endpoint. No new files, no new dependencies, no other files touched.

## Before

- Single scroll screen: heading → health-screening `Card` (3 checkboxes, auto-applied via `updateScreening`, no confirm step) → inline conditional render of blocked-box / loading-box / error-box / generate button → `connError` box → `PlanView` result card → disclaimer.
- No chat framing. No free-text input. No quick-action chips.

## After

- Same screen is now a message thread: `ChatMessage[]` local state (`useState`, not persisted — chat resets each time the tab mounts, per the task's explicit scope decision since the backend has no chat-history endpoint).
- Message kinds: `text`, `screening_card`, `loading`, `plan_card`, `screening_blocked`, `offer_generate`, `error_retry`. Each renders inline in the thread via `MessageBubble`.
- **Mount**: assistant pushes 2 messages — intro text (`INTRO_TEXT`, verbatim from `rencana_chat.md`) + `screening_card`. On wide web this card is filtered out of the visible thread and rendered once as a standalone right-column panel instead (`visibleMessages = messages.filter(...)` when `isWideWeb`).
- **Screening card**: reuses `useProfile().screening` / `updateScreening` (no duplicate state) and the existing `Checkbox` component, now wrapped in a new **"Lanjut"** `PillButton` that must be pressed to confirm — checking boxes no longer auto-advances the conversation.
- **On confirm**: pushes a user bubble summarizing exactly what was checked (`buildScreeningUserText`, generated from the screening object — "Tidak ada yang berlaku." when nothing is checked, natural "Saya sedang hamil dan memiliki penyakit kronis." style joins otherwise, never a hardcoded single string).
  - If `screeningBlocked(screening)` → assistant `screening_blocked` bubble with the exact `rencana_disetop_penyaringan.md` copy + "Ubah jawaban penyaringan" button (scrolls back to the inline screening card on mobile; no-op on wide web since the panel is already visible/editable). `generate()` is never called in this branch.
  - Else → calls `generate()`, which reuses `api.plan(profile, screening)` verbatim.
- **Generate flow**: pushes a `loading` bubble (ActivityIndicator + exact `rencana_memuat.md` copy) immediately, then replaces that one message (by id, via `flatMap`) with either:
  - success → a `text` bubble with `buildPlanSummaryText(plan)` ("Siap. Hari ini {target_calories} kkal, {first exercise name + duration}. Mau aku susun apa dulu?", falling back to `plan.summary` when there are no exercises) **followed by** a `plan_card` message rendering the untouched `PlanView` component, both using live `PlanResponse` data — no hardcoded numbers;
  - 429 → `error_retry` bubble, rate-limit copy from `rencana_batas_permintaan.md`, button "Coba lagi nanti";
  - `screening_blocked` code → `screening_blocked` bubble (same as above, reachable if the server independently decides to block);
  - `status === 0` (no connection) → `error_retry` bubble using `ApiError.message` (falls back to the existing "Tidak dapat terhubung ke server..." text), button "Coba lagi";
  - any other error → `error_retry` bubble, generic AI-failure copy from `rencana_gagal_ai.md`, button "Coba lagi".
  - All three retry/offer buttons call `generate` or `onOfferGenerate` directly from inside the bubble — no full-page spinner, no separate error section.
- **Quick-action chips** ("Susun latihan" / "Susun menu makan" / "Catat berat hari ini"): always visible above the composer, in a `flexWrap` row (wraps to 2 lines on mobile per screenshot, fits one line on the wider web chat column).
  - Before screening is confirmed → scrolls to the screening card (mobile) / no-op (web, panel already visible).
  - Screening blocked → no-op (the blocked bubble already explains it).
  - No plan yet → pushes a dedupe-guarded `offer_generate` bubble ("Belum ada rencana untuk hari ini. Mau aku buatkan?" + a "Buat rencana" button that calls `generate`).
  - Plan exists → scrolls to the `plan_card` bubble (see deviation note below on exercises-vs-meals targeting).
  - "Catat berat hari ini" always does `router.push('/progress')` — never triggers generation.
- **Free-text composer**: `TextInput` + paper-plane send `Pressable`. Typed text is pushed as a user bubble, then answered by `routeFreeText()` — a keyword router (olahraga/latihan/exercise → point at "Susun latihan"; makan/menu/diet/gizi → point at "Susun menu makan"; berat/progress/progres → point at tab Progres; else → the honest fallback "Aku masih fokus bantu urusan latihan, menu makan, dan progres berat badan..."). This is **not** a real AI chat — there is no freeform chat endpoint on the backend, only the structured `/api/v1/plan`. Marked with an explicit comment above `routeFreeText` referencing `Docs.md`'s backend API list so nobody mistakes it for an LLM integration later.
- **Layout split**: `useWindowDimensions()` width + `Platform.OS === 'web'` (same pattern as `beranda.tsx`'s `showAlternativeCalculatorNotice`) gate `isWideWeb` at `width >= 880`. Wide web renders a `webRow` with `chatColumn` (scroll + bottom block, `maxWidth: CHAT_MAX_WIDTH`) and a separate `screeningColumn` (sticky-top `ScreeningCard`, not part of the scrolling thread). Narrow web and all mobile render the single-column chat with the screening card inline as message #2.
- **Auto-scroll**: `scrollRef.current?.scrollToEnd({ animated: true })` inside a `useEffect` keyed on `messages.length`, wrapped in `requestAnimationFrame` so it runs after layout — same `ScrollView`-ref pattern the old file already used for `scrollToScreening`, just extended to fire on every new message instead of only on-demand.
- **Disclaimer**: kept as `<Disclaimer text="Rencana dibuat AI dari target kalori yang dihitung aplikasi. Bukan saran medis atau gizi profesional." />`, placed in `bottomBlock` below the composer (sibling of the scroll area, not fixed/absolute) per the mobile screenshot's bottom-to-top order: chips → composer → disclaimer → bottom nav.
- **Reused as-is** (logic untouched, only moved inside the new file structure): `PlanView`, `Checkbox`, `api.plan`, `ApiError`, `screeningBlocked`, `useProfile`, `Card`, `PillButton`, `Chip`, `ThemedText`/`ThemedView`, theme constants.

## Deviations from spec (and why)

1. **Quick-action chip targeting is coarse.** "Susun latihan" and "Susun menu makan" both scroll to the top of the same `plan_card` bubble (there's one `PlanView` card containing Target/Olahraga/Menu/Tips as sub-`Card`s, not separate chat messages). True sub-section scrolling would need per-section `onLayout` offsets inside `PlanView`, which the spec screenshots don't show distinct destinations for either — marked with a `ponytail:` comment on `scrollToPlan` naming the upgrade path (per-Card `onLayout` offsets) if finer scroll-to-section is ever required.
2. **"Lanjut" button is new UI not in the old form-based file.** The task explicitly calls for this (screening must be a confirm step, not auto-advance-on-checkbox) — flagged here since it's new interaction, not purely a restyle.
3. **Loading-bubble replacement uses `flatMap` by message id** rather than a separate "pending" boolean — keeps the array as the single source of truth and avoids a second state variable duplicating what's inferable from the messages list; `isGenerating` only gates the "Lanjut"/retry/offer buttons from double-firing.
4. **Thousands separator** (`1.843` in the spec's example copy) is produced by a tiny regex-based `formatThousands` helper rather than `Intl.NumberFormat('id-ID')`, since Hermes/React Native's JS engine may ship without full ICU data on device — same defensive pattern already implicit in how the rest of the app avoids `Intl` (no existing usage found in the codebase to follow, so this was the conservative stdlib-only choice). The number itself always comes from `plan.target_calories`, never hardcoded.
5. **Web screening panel width/offset** (`SCREENING_PANEL_WIDTH = 320`, `paddingTop: Spacing.three + 36`) are a judgment call to visually align the panel's card top with the chat thread's first bubble, since the spec text dump has no exact pixel/column-width numbers for the web variant (only text content + "Frame size 1440x900").

## Verification

- `npx tsc --noEmit` from repo root → **exit 0**.
- Manual trace of all state-machine paths against the 7 Figma spec files (`rencana_chat.md`, `web_rencana.md`, `rencana_memuat.md`, `rencana_gagal_ai.md`, `rencana_batas_permintaan.md`, `rencana_disetop_penyaringan.md`): intro copy, screening copy, blocked copy, loading copy, rate-limit copy, ai-failed copy, disclaimer copy all verbatim-matched against the spec text dumps.
- No new npm dependency added (`@expo/vector-icons` Ionicons only, already in use).
- Not touched: `backend/`, `beranda.tsx`, `profil.tsx`, `progress.tsx`, `measurement.tsx`, `app-tabs*`, `onboarding/`, auth files, `profile-context.tsx`, `lib/api.ts`, `lib/model.ts`.

## Not done / left as-is

- No automated test file added — the module is UI/state-wiring with no pure business logic beyond `buildScreeningUserText`/`buildPlanSummaryText`/`routeFreeText`, which are simple string builders; a human visual/manual check against the screenshots is the practical verification here (no RTL/jest harness exists elsewhere in this repo to extend).
