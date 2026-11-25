import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Disclaimer } from '@/components/disclaimer';
import { useProfile } from '@/components/profile-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { PillButton } from '@/components/ui/pill-button';
import { BottomTabInset, FontFamily, Spacing } from '@/constants/theme';
import { MOCK_USER_ID } from '@/constants/mockUser';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, api, type PlanResponse } from '@/lib/api';
import { toPlanInputs, type WireCalorieTargets } from '@/lib/mappers';
import { screeningBlocked, type HealthScreening } from '@/lib/model';
import { saveWorkoutPlan } from '@/services/userService';

// Breakpoint above which the web layout splits chat (left) from a standalone
// screening panel (right). Below it (incl. narrow web / all mobile) the
// screening card renders inline as the first chat message instead.
const WEB_WIDE_BREAKPOINT = 880;
const CHAT_MAX_WIDTH = 560;
const SCREENING_PANEL_WIDTH = 320;

const INTRO_TEXT =
  'Sebelum aku susun rencana, cek dulu kondisimu. Centang yang berlaku. Jika ada, rencana tidak dibuat dan sebaiknya konsultasi ke tenaga kesehatan.';
const LOADING_TEXT = 'Menyusun rencana hari ini... Menghitung target kalori dan menyusun latihan. Biasanya di bawah 10 detik.';
const SCREENING_BLOCKED_TEXT =
  'Kamu mencentang kondisi kesehatan di penyaringan. Bahas dulu dengan tenaga kesehatan sebelum mengikuti rencana latihan.';
const CONN_FALLBACK_TEXT = 'Tidak dapat terhubung ke server. Periksa koneksi atau alamat API.';
const RATE_LIMIT_TEXT =
  'Permintaan rencana hari ini sudah terlalu sering. Rencana yang sudah dibuat tetap tersimpan dan bisa dibuka lagi.';
const AI_FAILED_TEXT =
  'Rencana hari ini belum bisa dibuat. Coba lagi sebentar, atau susun latihan sendiri lewat tab Progres.';
const DISCLAIMER_TEXT =
  'Rencana dibuat AI dari target kalori yang dihitung aplikasi. Bukan saran medis atau gizi profesional.';

const INTENSITY_COLOR: Record<string, 'primary' | 'accent' | 'warning'> = {
  ringan: 'accent',
  sedang: 'primary',
  tinggi: 'warning',
};

type ScreeningKey = keyof HealthScreening;

const SCREENING_QUESTIONS: { key: ScreeningKey; label: string; phrase: string }[] = [
  { key: 'isPregnant', label: 'Sedang hamil', phrase: 'sedang hamil' },
  { key: 'hasChronicIllness', label: 'Memiliki penyakit kronis', phrase: 'memiliki penyakit kronis' },
  {
    key: 'hasEatingDisorderHistory',
    label: 'Pernah mengalami gangguan makan',
    phrase: 'pernah mengalami gangguan makan',
  },
];

type ErrorKind = 'rate_limit' | 'ai_failed' | 'conn';

/** What the user asked the bot to put together. Undefined = the full daily plan. */
type PlanTarget = 'exercises' | 'meals';

type ChatMessage =
  | { id: string; role: 'assistant' | 'user'; kind: 'text'; text: string }
  | { id: string; role: 'assistant'; kind: 'screening_card' }
  | { id: string; role: 'assistant'; kind: 'loading'; text: string }
  | { id: string; role: 'assistant'; kind: 'plan_card'; plan: PlanResponse; focus?: PlanTarget }
  | { id: string; role: 'assistant'; kind: 'error_retry'; errorKind: ErrorKind; body: string }
  | { id: string; role: 'assistant'; kind: 'screening_blocked'; text: string };

// Sent to the backend as `preferences` (treated as data, not instructions) so the answer
// leads with what the user asked for. The backend caches per preference text, so tapping
// the same button again the same day is answered from cache.
const TARGET_PREFERENCES: Record<PlanTarget, string> = {
  exercises: 'Fokus: susun program latihan hari ini.',
  meals: 'Fokus: susun menu makan hari ini.',
};
const TARGET_USER_TEXT: Record<PlanTarget, string> = {
  exercises: 'Susun latihan',
  meals: 'Susun menu makan',
};
const TARGET_LOADING_TEXT: Record<PlanTarget, string> = {
  exercises: 'Menyusun latihan hari ini... Biasanya di bawah 10 detik.',
  meals: 'Menyusun menu makan hari ini... Biasanya di bawah 10 detik.',
};
const NEED_SCREENING_TEXT =
  'Sebelum aku susun, jawab dulu penyaringan kesehatan lalu tekan "Lanjut".';

/** "1843" -> "1.843" (id-ID thousands dot), without relying on Intl/full-icu. */
function formatThousands(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Builds the honest user-facing summary of what was checked, e.g. "Saya sedang hamil dan memiliki penyakit kronis." */
function buildScreeningUserText(screening: HealthScreening): string {
  const checked = SCREENING_QUESTIONS.filter((q) => screening[q.key]).map((q) => q.phrase);
  if (checked.length === 0) return 'Tidak ada yang berlaku.';
  if (checked.length === 1) return `Saya ${checked[0]}.`;
  if (checked.length === 2) return `Saya ${checked[0]} dan ${checked[1]}.`;
  return `Saya ${checked[0]}, ${checked[1]}, dan ${checked[2]}.`;
}

function buildPlanSummaryText(plan: PlanResponse, target?: PlanTarget): string {
  if (target === 'exercises') {
    return `Siap. Ini susunan latihan hari ini (${plan.plan.exercises.length} sesi). Target harianmu ${formatThousands(plan.target_calories)} kkal.`;
  }
  if (target === 'meals') {
    return `Siap. Ini menu makan hari ini, targetnya ${formatThousands(plan.target_calories)} kkal dan ${plan.protein_g} g protein.`;
  }
  const firstEx = plan.plan.exercises[0];
  const exerciseText = firstEx ? `${firstEx.name} ${firstEx.duration_min} menit` : plan.plan.summary;
  return `Siap. Hari ini ${formatThousands(plan.target_calories)} kkal, ${exerciseText}. Mau aku susun apa dulu?`;
}

/**
 * Free-text input is NOT wired to a real LLM chat endpoint -- backend only
 * has POST /api/v1/plan (structured). Messages about exercise or food run the
 * same request as the two quick-action buttons; the rest gets an honest fallback.
 * See Docs.md backend API list.
 */
function targetFromText(text: string): PlanTarget | null {
  const lower = text.toLowerCase();
  if (/olahraga|latihan|exercise/.test(lower)) return 'exercises';
  if (/makan|menu|diet|gizi/.test(lower)) return 'meals';
  return null;
}

function routeFreeText(text: string): string {
  const lower = text.toLowerCase();
  if (/berat|progress|progres/.test(lower)) {
    return 'Catatan berat badan ada di tab Progres. Pakai tombol "Catat berat hari ini" di atas, atau buka tab Progres.';
  }
  return 'Aku masih fokus bantu urusan latihan, menu makan, dan progres berat badan. Coba salah satu tombol di atas, atau ketik soal itu.';
}

export default function RencanaScreen() {
  const theme = useTheme();
  const { profile, screening, updateScreening } = useProfile();
  const { width } = useWindowDimensions();
  const isWideWeb = Platform.OS === 'web' && width >= WEB_WIDE_BREAKPOINT;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [screeningConfirmed, setScreeningConfirmed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [composerText, setComposerText] = useState('');

  const initializedRef = useRef(false);
  const idCounter = useRef(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const screeningY = useRef(0);
  // What "Coba lagi" should re-run after a failed request.
  const lastTarget = useRef<PlanTarget | undefined>(undefined);

  const blocked = screeningBlocked(screening);

  const nextId = () => `m-${idCounter.current++}`;

  // Assistant speaks first: intro line, then the screening card (inline on
  // mobile/narrow-web; filtered out of the thread and shown as a standalone
  // panel on wide web -- see isWideWeb filtering below).
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    setMessages([
      { id: nextId(), role: 'assistant', kind: 'text', text: INTRO_TEXT },
      { id: nextId(), role: 'assistant', kind: 'screening_card' },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  }, [messages.length]);

  const scrollToScreening = () => {
    scrollRef.current?.scrollTo({ y: Math.max(screeningY.current - 16, 0), animated: true });
  };

  // Asks the backend (POST /api/v1/plan -> OpenRouter) for a plan. With a `target`
  // the request leads with latihan or menu makan and only that part is shown.
  const generate = async (target?: PlanTarget) => {
    if (isGenerating) return;
    lastTarget.current = target;
    setIsGenerating(true);
    const loadingId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: 'assistant', kind: 'loading', text: target ? TARGET_LOADING_TEXT[target] : LOADING_TEXT },
    ]);
    try {
      const result = await api.plan(profile, screening, target ? TARGET_PREFERENCES[target] : undefined);
      // Show the plan first — persistence must never gate the UI.
      const summaryId = nextId();
      const cardId = nextId();
      setMessages((prev) =>
        prev.flatMap((m) =>
          m.id === loadingId
            ? [
                { id: summaryId, role: 'assistant' as const, kind: 'text' as const, text: buildPlanSummaryText(result, target) },
                { id: cardId, role: 'assistant' as const, kind: 'plan_card' as const, plan: result, focus: target },
              ]
            : [m],
        ),
      );

      // `api.healthSummary` is typed `Promise<unknown>`, so its calorie block
      // is cast to the wire shape the mapper expects. It is optional context:
      // without it `targets` is simply omitted from the stored plan.
      let calories: WireCalorieTargets | null = null;
      try {
        const summary = (await api.healthSummary(profile, profile.bmiStandard)) as {
          calories?: WireCalorieTargets;
        } | null;
        calories = summary?.calories ?? null;
      } catch {
        // Non-fatal: the plan itself already carries target_calories.
      }

      try {
        const { workout } = toPlanInputs(result, { calories });
        await saveWorkoutPlan(MOCK_USER_ID, workout);
      } catch (saveError) {
        const text =
          saveError instanceof Error
            ? `Rencana dibuat, tetapi gagal disimpan: ${saveError.message}`
            : 'Rencana dibuat, tetapi gagal disimpan.';
        setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', kind: 'text', text }]);
      }
    } catch (e) {
      let replacement: ChatMessage;
      if (e instanceof ApiError && e.code === 'screening_blocked') {
        replacement = { id: nextId(), role: 'assistant', kind: 'screening_blocked', text: SCREENING_BLOCKED_TEXT };
      } else if (e instanceof ApiError && e.status === 429) {
        replacement = { id: nextId(), role: 'assistant', kind: 'error_retry', errorKind: 'rate_limit', body: RATE_LIMIT_TEXT };
      } else if (e instanceof ApiError && e.status === 0) {
        replacement = { id: nextId(), role: 'assistant', kind: 'error_retry', errorKind: 'conn', body: e.message || CONN_FALLBACK_TEXT };
      } else {
        replacement = { id: nextId(), role: 'assistant', kind: 'error_retry', errorKind: 'ai_failed', body: AI_FAILED_TEXT };
      }
      setMessages((prev) => prev.flatMap((m) => (m.id === loadingId ? [replacement] : [m])));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmScreening = () => {
    setScreeningConfirmed(true);
    const userText = buildScreeningUserText(screening);
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', kind: 'text', text: userText }]);
    if (screeningBlocked(screening)) {
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'assistant', kind: 'screening_blocked', text: SCREENING_BLOCKED_TEXT },
      ]);
    } else {
      void generate();
    }
  };

  const handleEditScreening = () => {
    if (isWideWeb) return; // standalone panel is always visible already
    scrollToScreening();
  };

  // The user's message always shows up as a bubble, then the bot answers it:
  // by asking the API, or by saying what is still needed first.
  const askForTarget = (target: PlanTarget, userText: string) => {
    if (isGenerating) return;
    const addReply = (reply: ChatMessage) =>
      setMessages((prev) => [...prev, { id: nextId(), role: 'user', kind: 'text', text: userText }, reply]);

    if (!screeningConfirmed) {
      // Safety gate (PRD §7): never generate before the screening is confirmed.
      addReply({ id: nextId(), role: 'assistant', kind: 'text', text: NEED_SCREENING_TEXT });
      if (!isWideWeb) scrollToScreening();
      return;
    }
    if (blocked) {
      addReply({ id: nextId(), role: 'assistant', kind: 'screening_blocked', text: SCREENING_BLOCKED_TEXT });
      return;
    }
    setMessages((prev) => [...prev, { id: nextId(), role: 'user', kind: 'text', text: userText }]);
    void generate(target);
  };

  const handleSend = () => {
    const text = composerText.trim();
    if (!text) return;
    setComposerText('');
    const target = targetFromText(text);
    if (target) {
      askForTarget(target, text);
      return;
    }
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', kind: 'text', text },
      { id: nextId(), role: 'assistant', kind: 'text', text: routeFreeText(text) },
    ]);
  };

  const visibleMessages = isWideWeb ? messages.filter((m) => m.kind !== 'screening_card') : messages;

  const chatContent = (
    <>
      <View>
        <ThemedText style={styles.title}>RENCANA</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subheading}>
          Tanya apa saja soal latihan dan makanmu hari ini.
        </ThemedText>
      </View>

      {visibleMessages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          screening={screening}
          updateScreening={updateScreening}
          screeningConfirmed={screeningConfirmed}
          isGenerating={isGenerating}
          onConfirmScreening={handleConfirmScreening}
          onEditScreening={handleEditScreening}
          onRetry={() => void generate(lastTarget.current)}
          onLayoutScreening={(y) => (screeningY.current = y)}
        />
      ))}
    </>
  );

  const quickChips = (
    <View style={styles.chipRow}>
      <Chip label="Susun latihan" onPress={() => askForTarget('exercises', TARGET_USER_TEXT.exercises)} />
      <Chip label="Susun menu makan" onPress={() => askForTarget('meals', TARGET_USER_TEXT.meals)} />
      <Chip label="Catat berat hari ini" onPress={() => router.push('/progress')} />
    </View>
  );

  const composer = (
    <View style={styles.composerRow}>
      <TextInput
        value={composerText}
        onChangeText={setComposerText}
        placeholder="Tulis pesan"
        placeholderTextColor={theme.textMuted}
        style={[styles.composerInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.backgroundElement }]}
        returnKeyType="send"
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Kirim pesan"
        onPress={handleSend}
        style={({ pressed }) => [styles.sendButton, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
        <Ionicons name="paper-plane" size={18} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  const bottomBlock = (
    <View style={[styles.bottomBlock, { paddingBottom: BottomTabInset, backgroundColor: theme.background }]}>
      {quickChips}
      {composer}
      <Disclaimer text={DISCLAIMER_TEXT} />
    </View>
  );

  if (isWideWeb) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.webRow}>
            <View style={styles.chatColumn}>
              <ScrollView
                ref={scrollRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>
                {chatContent}
              </ScrollView>
              {bottomBlock}
            </View>
            <View style={styles.screeningColumn}>
              <ScreeningCard
                screening={screening}
                updateScreening={updateScreening}
                disabled={isGenerating}
                onConfirm={handleConfirmScreening}
              />
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {chatContent}
        </ScrollView>
        {bottomBlock}
      </SafeAreaView>
    </ThemedView>
  );
}

function MessageBubble({
  message,
  screening,
  updateScreening,
  screeningConfirmed,
  isGenerating,
  onConfirmScreening,
  onEditScreening,
  onRetry,
  onLayoutScreening,
}: {
  message: ChatMessage;
  screening: HealthScreening;
  updateScreening: (patch: Partial<HealthScreening>) => void;
  screeningConfirmed: boolean;
  isGenerating: boolean;
  onConfirmScreening: () => void;
  onEditScreening: () => void;
  onRetry: () => void;
  onLayoutScreening: (y: number) => void;
}) {
  const theme = useTheme();

  if (message.kind === 'text') {
    const isUser = message.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser && styles.bubbleRowUser]}>
        <View
          style={[
            styles.bubble,
            isUser
              ? { backgroundColor: theme.primary, borderTopRightRadius: 4 }
              : { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1, borderTopLeftRadius: 4 },
          ]}>
          <ThemedText type="small" style={isUser ? { color: '#FFFFFF' } : undefined}>
            {message.text}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (message.kind === 'screening_card') {
    return (
      <View style={styles.bubbleRow} onLayout={(e) => onLayoutScreening(e.nativeEvent.layout.y)}>
        <View style={styles.cardSlot}>
          <ScreeningCard
            screening={screening}
            updateScreening={updateScreening}
            disabled={isGenerating}
            onConfirm={onConfirmScreening}
          />
        </View>
      </View>
    );
  }

  if (message.kind === 'loading') {
    return (
      <View style={styles.bubbleRow}>
        <View style={[styles.bubble, styles.loadingBubble, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText type="small" style={styles.loadingText}>
            {message.text}
          </ThemedText>
        </View>
      </View>
    );
  }

  if (message.kind === 'plan_card') {
    return (
      <View style={styles.bubbleRow}>
        <View style={styles.cardSlot}>
          <PlanView plan={message.plan} focus={message.focus} />
        </View>
      </View>
    );
  }

  if (message.kind === 'screening_blocked') {
    return (
      <View style={styles.bubbleRow}>
        <View style={[styles.stateBox, { backgroundColor: '#FFF7ED', borderColor: '#B45309' }]}>
          <ThemedText type="smallBold" style={{ color: '#B45309', letterSpacing: 0.4 }}>
            RENCANA TIDAK DIBUAT
          </ThemedText>
          <ThemedText type="smallBold" style={styles.stateHeading}>
            Ada kondisi yang perlu dibahas dulu
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {message.text}
          </ThemedText>
          <PillButton label="Ubah jawaban penyaringan" variant="outline" onPress={onEditScreening} style={styles.stateButton} />
        </View>
      </View>
    );
  }

  // error_retry
  const copy =
    message.errorKind === 'rate_limit'
      ? { label: 'TERLALU BANYAK PERMINTAAN', heading: 'Tunggu beberapa menit', color: '#B45309', buttonLabel: 'Coba lagi nanti' }
      : message.errorKind === 'ai_failed'
        ? { label: 'RENCANA GAGAL DIBUAT', heading: 'Layanan AI tidak merespons', color: '#B91C1C', buttonLabel: 'Coba lagi' }
        : { label: undefined, heading: undefined, color: theme.warning, buttonLabel: 'Coba lagi' };
  return (
    <View style={styles.bubbleRow}>
      <View style={[styles.stateBox, { backgroundColor: theme.backgroundElement, borderColor: copy.color }]}>
        {copy.label ? (
          <ThemedText type="smallBold" style={{ color: copy.color, letterSpacing: 0.4 }}>
            {copy.label}
          </ThemedText>
        ) : null}
        {copy.heading ? <ThemedText type="smallBold" style={styles.stateHeading}>{copy.heading}</ThemedText> : null}
        <ThemedText type="small" themeColor="textSecondary">
          {message.body}
        </ThemedText>
        <PillButton label={copy.buttonLabel} loading={isGenerating} onPress={onRetry} style={styles.stateButton} />
      </View>
    </View>
  );
}

function ScreeningCard({
  screening,
  updateScreening,
  disabled,
  onConfirm,
}: {
  screening: HealthScreening;
  updateScreening: (patch: Partial<HealthScreening>) => void;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <Card style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
        PENYARINGAN KESEHATAN
      </ThemedText>
      {SCREENING_QUESTIONS.map((q) => {
        const checked = screening[q.key];
        return (
          <Checkbox
            key={q.key}
            label={q.label}
            checked={checked}
            onToggle={() => updateScreening({ [q.key]: !checked } as Partial<HealthScreening>)}
          />
        );
      })}
      <PillButton label="Lanjut" onPress={onConfirm} disabled={disabled} style={styles.stateButton} />
    </Card>
  );
}

function PlanView({ plan, focus }: { plan: PlanResponse; focus?: PlanTarget }) {
  const theme = useTheme();
  return (
    <>
      <Card style={styles.section}>
        <View style={styles.rowBetween}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            TARGET HARI INI
          </ThemedText>
          {plan.cached ? (
            <View style={[styles.cachedBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor="primary">
                dari cache
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.targetRow}>
          <ThemedText type="smallBold" style={styles.targetValue}>
            {plan.target_calories} <ThemedText type="small" themeColor="textSecondary">kkal</ThemedText>
          </ThemedText>
          <ThemedText type="smallBold" style={styles.targetValue}>
            {plan.protein_g} <ThemedText type="small" themeColor="textSecondary">g protein</ThemedText>
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {plan.plan.summary}
        </ThemedText>
      </Card>

      {/* Exercises (hidden when the user only asked for the menu) */}
      {focus !== 'meals' ? (
      <Card style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
          OLAHRAGA
        </ThemedText>
        {plan.plan.exercises.map((ex, i) => (
          <View key={`${ex.name}-${i}`} style={[styles.exerciseRow, { borderColor: theme.border }]}>
            <View style={[styles.exIndex, { backgroundColor: theme.background }]}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {String(i + 1).padStart(2, '0')}
              </ThemedText>
            </View>
            <View style={styles.exText}>
              <ThemedText type="smallBold">{ex.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {ex.type} · {ex.duration_min} menit
              </ThemedText>
            </View>
            <View style={[styles.intensityBadge, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small" themeColor={INTENSITY_COLOR[ex.intensity] ?? 'primary'}>
                {ex.intensity}
              </ThemedText>
            </View>
          </View>
        ))}
      </Card>
      ) : null}

      {/* Meals (hidden when the user only asked for exercises) */}
      {focus !== 'exercises' ? (
      <Card style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
          MENU MAKAN
        </ThemedText>
        {plan.plan.meals.map((slot, si) => (
          <View key={`${slot.slot}-${si}`} style={styles.mealSlot}>
            <ThemedText type="smallBold" themeColor="primary">
              {slot.slot}
            </ThemedText>
            {slot.items.map((item, ii) => (
              <View key={`${item.name}-${ii}`} style={styles.mealItemRow}>
                <ThemedText type="small" style={styles.mealName}>
                  {item.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.calories} kkal · {item.protein_g} g
                </ThemedText>
              </View>
            ))}
          </View>
        ))}
      </Card>
      ) : null}

      {plan.plan.tips.length > 0 ? (
        <Card style={styles.section}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionLabel}>
            TIPS
          </ThemedText>
          {plan.plan.tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name="bulb-outline" size={16} color={theme.primary} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.tipText}>
                {tip}
              </ThemedText>
            </View>
          ))}
        </Card>
      ) : null}
    </>
  );
}

function Checkbox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.checkboxRow}>
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? theme.warning : 'transparent',
            borderColor: checked ? theme.warning : theme.border,
          },
        ]}>
        {checked ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, alignItems: 'center', width: '100%' },
  scrollView: { flex: 1, width: '100%' },
  scrollContent: {
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.three,
  },
  title: { fontFamily: FontFamily.headingExtraBold, fontSize: 36, lineHeight: 40 },
  subheading: { marginTop: Spacing.one },
  section: { gap: Spacing.three },
  sectionLabel: { letterSpacing: 0.4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  // Web 2-column layout.
  webRow: { flex: 1, flexDirection: 'row', width: '100%', maxWidth: CHAT_MAX_WIDTH + SCREENING_PANEL_WIDTH + Spacing.four * 3, gap: Spacing.four, alignSelf: 'center', paddingHorizontal: Spacing.four },
  chatColumn: { flex: 1, maxWidth: CHAT_MAX_WIDTH },
  screeningColumn: { width: SCREENING_PANEL_WIDTH, paddingTop: Spacing.three + 36 },

  // Chat bubbles.
  bubbleRow: { width: '100%', maxWidth: CHAT_MAX_WIDTH, alignSelf: 'center', flexDirection: 'row' },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: 16, padding: Spacing.three, gap: 6 },
  cardSlot: { width: '100%', gap: Spacing.three },
  loadingBubble: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, borderWidth: 1, maxWidth: '100%' },
  loadingText: { flex: 1 },

  stateBox: { width: '100%', gap: 6, padding: Spacing.three, borderRadius: 16, borderWidth: 1 },
  stateHeading: { fontSize: 16 },
  stateButton: { marginTop: Spacing.two, alignSelf: 'flex-start' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44, paddingVertical: 6 },
  checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cachedBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  targetRow: { flexDirection: 'row', gap: Spacing.four },
  targetValue: { fontFamily: FontFamily.headingBold, fontSize: 24 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, borderTopWidth: 1, paddingTop: Spacing.two },
  exIndex: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  exText: { flex: 1, gap: 2 },
  intensityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  mealSlot: { gap: 4 },
  mealItemRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  mealName: { flex: 1 },
  tipRow: { flexDirection: 'row', gap: 8 },
  tipText: { flex: 1 },

  // Bottom-fixed block: quick chips + composer + disclaimer, sibling of the
  // scrolling chat (not absolute-positioned, so it never overlaps content).
  bottomBlock: { width: '100%', maxWidth: CHAT_MAX_WIDTH, alignSelf: 'center', gap: Spacing.two, paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  composerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  composerInput: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1, paddingHorizontal: Spacing.three, fontSize: 15 },
  sendButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.85 },
});
