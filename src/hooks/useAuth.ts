import { useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";
import { auth, db } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import type { UserRole } from "../types/auth";

function inferRoleFromEmail(email: string): UserRole {
  if (email.startsWith("admin@")) return "admin";
  if (email.startsWith("production@")) return "production";
  if (email.startsWith("sales@")) return "sales";
  if (email.startsWith("staff@")) return "staff"; // legacy fallback
  if (email.startsWith("baker@")) return "baker";
  return "customer";
}

export function useAuth() {
  const { user, isLoading, setUser, setLoading, clearUser } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const inferredRole = inferRoleFromEmail(firebaseUser.email ?? "");

        // Never let an unverified customer session enter the app state.
        if (!firebaseUser.emailVerified && inferredRole === "customer") {
          await signOut(auth);
          clearUser();
          return;
        }

        const tokenResult = await firebaseUser.getIdTokenResult();

        // Read profile from Firebase DB — primary source for role and isActive
        let dbProfile: any = null;
        try {
          const dbSnap = await get(ref(db, `users/${firebaseUser.uid}`));
          dbProfile = dbSnap.val();
        } catch (error) {
          // Customer accounts may not have access to users/{uid}; continue with auth/token data.
          console.warn("Could not read Firebase user profile, falling back to auth data.", error);
        }

        const role: UserRole =
          (dbProfile?.role as UserRole) ??
          (tokenResult.claims.role as UserRole) ??
          inferredRole;

        // Block inactive staff/admin accounts
        let isActive = true;
        if (role !== "customer") {
          // Check Firebase DB first
          if (dbProfile?.isActive === false) {
            await signOut(auth);
            clearUser();
            return;
          }
          isActive = dbProfile?.isActive ?? true;

          // Also check MySQL backend if available (legacy support)
          try {
            const profile = await authService.syncSession();
            if (profile?.is_active === false) {
              await signOut(auth);
              clearUser();
              return;
            }
          } catch { /* backend not available — continue */ }
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName ?? dbProfile?.name ?? null,
          role,
          isActive,
        });
      } else {
        clearUser();
      }
    });

    return unsubscribe;
  }, []);

  return { user, isLoading };
}
