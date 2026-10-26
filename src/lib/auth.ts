/**
 * Autentikasi lokal sederhana berbasis JSON (AsyncStorage).
 *
 * Tahap awal (sesuai permintaan): akun & sesi disimpan di perangkat sebagai JSON,
 * belum ada server auth. Ini menghentikan "loop login" karena sesi kini benar-benar
 * dipersistensi, bukan sekadar timeout palsu.
 *
 * CATATAN KEAMANAN: ini hanya untuk MVP/prototipe lokal. Kata sandi disimpan dengan
 * hash sederhana (bukan untuk produksi). Untuk rilis, auth harus pindah ke server
 * dengan hashing yang benar (mis. bcrypt/argon2).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACCOUNTS_KEY = 'ragaku.auth.accounts';
const SESSION_KEY = 'ragaku.auth.session';

export interface Account {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  createdAt: string;
  /** Apakah akun ini sudah menyelesaikan alur onboarding (dipakai guard navigasi). */
  onboardingCompleted: boolean;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
  onboardingCompleted: boolean;
}

/** Hash kata sandi non-kriptografis sederhana (hanya untuk prototipe lokal). */
function hashPassword(password: string): string {
  let h = 0;
  for (let i = 0; i < password.length; i += 1) {
    h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
  }
  // Gabungkan dengan panjang agar sedikit lebih tahan tabrakan.
  return `v1:${password.length}:${h}`;
}

async function readAccounts(): Promise<Account[]> {
  try {
    const raw = await AsyncStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

async function writeAccounts(accounts: Account[]): Promise<void> {
  await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toSession(account: Account): Session {
  return {
    userId: account.id,
    email: account.email,
    name: account.name,
    onboardingCompleted: account.onboardingCompleted,
  };
}

export class AuthError extends Error {}

export const auth = {
  async getSession(): Promise<Session | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      return null;
    }
  },

  async register(input: {
    name: string;
    email: string;
    phone?: string;
    password: string;
  }): Promise<Session> {
    const email = normalizeEmail(input.email);
    const accounts = await readAccounts();
    if (accounts.some((a) => a.email === email)) {
      throw new AuthError('Email sudah terdaftar. Silakan masuk.');
    }
    const account: Account = {
      id: `${Date.now()}`,
      name: input.name.trim(),
      email,
      phone: input.phone?.trim(),
      passwordHash: hashPassword(input.password),
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
    };
    await writeAccounts([...accounts, account]);
    const session = toSession(account);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async login(input: { email: string; password: string }): Promise<Session> {
    const email = normalizeEmail(input.email);
    const accounts = await readAccounts();
    const account = accounts.find((a) => a.email === email);
    if (!account || account.passwordHash !== hashPassword(input.password)) {
      throw new AuthError('Email atau kata sandi salah.');
    }
    const session = toSession(account);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem(SESSION_KEY);
  },

  /**
   * Tandai akun yang sedang login sudah menyelesaikan onboarding. Memperbarui akun yang
   * tersimpan (supaya login berikutnya langsung ke app) dan sesi yang aktif.
   */
  async markOnboardingComplete(userId: string): Promise<Session> {
    const accounts = await readAccounts();
    const index = accounts.findIndex((a) => a.id === userId);
    if (index === -1) {
      throw new AuthError('Akun tidak ditemukan.');
    }
    const account: Account = { ...accounts[index], onboardingCompleted: true };
    const nextAccounts = [...accounts];
    nextAccounts[index] = account;
    await writeAccounts(nextAccounts);

    const session = toSession(account);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  /** Hapus seluruh akun & sesi (dipakai oleh "hapus semua data"). */
  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([ACCOUNTS_KEY, SESSION_KEY]);
  },
};
