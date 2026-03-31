import { useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import type { UserRole } from "../types/auth";

function inferRoleFromEmail(email: string): UserRole {
  if (email.startsWith("admin@")) return "admin";
  if (email.startsWith("staff@")) return "staff";
  return "customer";
}

export function useAuth() {
  const { user, isLoading, setUser, setLoading, clearUser } = useAuthStore();

  useEffect(() => {
    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult();
        const role: UserRole =
          (tokenResult.claims.role as UserRole) ??
          inferRoleFromEmail(firebaseUser.email ?? "");

        // Check is_active from backend (staff/admin only — customers always active)
        let isActive = true;
        if (role === "staff" || role === "admin") {
          const profile = await authService.syncSession();
          if (profile && profile.is_active === false) {
            // Inactive staff — sign out immediately, show no access screen
            await signOut(auth);
            clearUser();
            return;
          }
          isActive = profile?.is_active ?? true;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
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
