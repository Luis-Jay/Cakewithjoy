import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import api from "../config/api";

export const authService = {
  login: (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password),

  register: async (email: string, password: string, fullName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: fullName });
    // Sync new user to MySQL backend (non-blocking – backend may not be up yet)
    try {
      await api.post("/auth/sync", { full_name: fullName });
    } catch {
      // Backend not running yet – silently continue
    }
    return credential;
  },

  logout: () => signOut(auth),

  resetPassword: (email: string) => sendPasswordResetEmail(auth, email),

  // Called after login to sync profile + get role from MySQL
  syncSession: async () => {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch {
      return null;
    }
  },
};
