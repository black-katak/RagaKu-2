/**
 * Firestore access layer for user profiles and AI workout plans.
 *
 * Layout:
 *   users/{uid}
 *   users/{uid}/workoutPlans/{planId}
 *
 * Uses the modular Firebase SDK and the `db` instance from `src/lib/firebase.ts`.
 * Every function wraps its Firestore call: reads return `null` (or an empty
 * list) when nothing exists, and failures surface as `UserServiceError` with
 * the original error attached as `cause`.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as fsLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import {
  COLLECTIONS,
  type UserProfileDocument,
  type UserProfileInput,
  type WorkoutPlanDocument,
  type WorkoutPlanInput,
} from '@/types/database';

/** Error thrown for any Firestore failure in this module. */
export class UserServiceError extends Error {
  readonly operation: string;

  constructor(operation: string, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'UserServiceError';
    this.operation = operation;
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

function requireUid(uid: string, operation: string): void {
  if (!uid || !uid.trim()) {
    throw new UserServiceError(operation, 'uid is required.');
  }
}

function userDocRef(uid: string) {
  return doc(db, COLLECTIONS.users, uid);
}

function workoutPlansRef(uid: string) {
  return collection(db, COLLECTIONS.users, uid, COLLECTIONS.workoutPlans);
}

/**
 * Drop `undefined` values so Firestore does not reject the write.
 * `null` is preserved — it is a meaningful "explicitly cleared" value here.
 */
function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

/**
 * Create or update `users/{uid}`.
 *
 * Merges by default, so partial updates are safe. `createdAt` is written only
 * when the document does not already exist; `updatedAt` is always refreshed.
 */
export async function saveUserProfile(
  uid: string,
  profile: UserProfileInput,
): Promise<void> {
  requireUid(uid, 'saveUserProfile');
  const ref = userDocRef(uid);

  try {
    const existing = await getDoc(ref);
    const payload: Record<string, unknown> = {
      ...stripUndefined(profile as unknown as Record<string, unknown>),
      uid,
      onboardingCompleted: profile.onboardingCompleted ?? false,
      updatedAt: serverTimestamp(),
    };
    if (!existing.exists()) {
      payload.createdAt = serverTimestamp();
    }
    await setDoc(ref, payload, { merge: true });
  } catch (error) {
    throw new UserServiceError(
      'saveUserProfile',
      `Gagal menyimpan profil pengguna (${uid}).`,
      { cause: error },
    );
  }
}

/**
 * Read `users/{uid}`.
 *
 * @returns the profile document, or `null` when no profile exists.
 */
export async function getUserProfile(
  uid: string,
): Promise<UserProfileDocument | null> {
  requireUid(uid, 'getUserProfile');

  try {
    const snapshot = await getDoc(userDocRef(uid));
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    return {
      ...(data as Omit<UserProfileDocument, 'uid'>),
      uid: snapshot.id,
    } as UserProfileDocument;
  } catch (error) {
    throw new UserServiceError(
      'getUserProfile',
      `Gagal memuat profil pengguna (${uid}).`,
      { cause: error },
    );
  }
}

/**
 * Write a plan to `users/{uid}/workoutPlans/{planId}`.
 *
 * `planId` defaults to `plan.planDate`, which makes same-day regeneration
 * idempotent (one plan document per date). Pass an explicit `planId` to keep
 * multiple plans for one date.
 *
 * @returns the id of the written document.
 */
export async function saveWorkoutPlan(
  uid: string,
  plan: WorkoutPlanInput,
  planId?: string,
): Promise<string> {
  requireUid(uid, 'saveWorkoutPlan');
  if (!plan?.planDate) {
    throw new UserServiceError('saveWorkoutPlan', 'plan.planDate is required.');
  }

  const id = planId?.trim() || plan.planDate;
  const ref = doc(workoutPlansRef(uid), id);

  try {
    const existing = await getDoc(ref);
    const payload: Record<string, unknown> = {
      ...stripUndefined(plan as unknown as Record<string, unknown>),
      id,
      uid,
      tips: plan.tips ?? [],
      source: plan.source ?? 'ai',
      updatedAt: serverTimestamp(),
    };
    if (!existing.exists()) {
      payload.createdAt = serverTimestamp();
      payload.completed = false;
    }
    await setDoc(ref, payload, { merge: true });
    return id;
  } catch (error) {
    throw new UserServiceError(
      'saveWorkoutPlan',
      `Gagal menyimpan rencana latihan (${uid}/${id}).`,
      { cause: error },
    );
  }
}

/**
 * List plans in `users/{uid}/workoutPlans`, newest plan date first.
 *
 * @returns an array, empty when the user has no plans yet.
 */
export async function getUserWorkoutPlans(
  uid: string,
  options?: { limit?: number },
): Promise<WorkoutPlanDocument[]> {
  requireUid(uid, 'getUserWorkoutPlans');

  try {
    const constraints: QueryConstraint[] = [orderBy('planDate', 'desc')];
    if (options?.limit && options.limit > 0) {
      constraints.push(fsLimit(options.limit));
    }

    const snapshot = await getDocs(query(workoutPlansRef(uid), ...constraints));
    return snapshot.docs.map((d) => {
      const data = d.data();
      return {
        ...(data as Omit<WorkoutPlanDocument, 'id' | 'uid'>),
        id: d.id,
        uid,
      } as WorkoutPlanDocument;
    });
  } catch (error) {
    throw new UserServiceError(
      'getUserWorkoutPlans',
      `Gagal memuat daftar rencana latihan (${uid}).`,
      { cause: error },
    );
  }
}

/** Re-exported for callers that need to build timestamps client-side. */
export { Timestamp };
