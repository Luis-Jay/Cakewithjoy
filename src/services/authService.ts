import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import api, { isApiConfigured } from "../config/api";

const PRIVILEGED_PREFIXES = ["admin", "production", "sales", "staff", "baker"];
const PRIVILEGED_EMAIL_DOMAINS = ["cakewjoy.com", "cakewithjoy.com"];

const isPrivilegedEmail = (email: string | null | undefined) => {
  const normalized = (email ?? "").trim().toLowerCase();
  const [localPart, domain, ...rest] = normalized.split("@");
  if (!localPart || !domain || rest.length > 0) return false;
  return (
    PRIVILEGED_PREFIXES.some((prefix) => localPart.startsWith(prefix)) &&
    PRIVILEGED_EMAIL_DOMAINS.includes(domain)
  );
};

export const authService = {
  login: async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    if (!credential.user.emailVerified && !isPrivilegedEmail(credential.user.email)) {
      await signOut(auth);
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    return credential;
  },

  register: async (email: string, password: string, fullName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: fullName });
    await sendEmailVerification(credential.user);
    // Sync new user to MySQL backend (non-blocking – backend may not be up yet)
    if (isApiConfigured) {
      try {
        await api.post("/auth/sync", { full_name: fullName });
      } catch {
        // Backend not running yet – silently continue
      }
    }
    await signOut(auth);
    return credential;
  },

  logout: () => signOut(auth),

  resetPassword: (email: string) => sendPasswordResetEmail(auth, email),

  resendVerificationEmail: async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    try {
      await sendEmailVerification(credential.user);
    } finally {
      await signOut(auth);
    }
  },

  // Called after login to sync profile + get role from MySQL
  syncSession: async () => {
    if (!isApiConfigured) return null;

    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch {
      return null;
    }
  },
};
