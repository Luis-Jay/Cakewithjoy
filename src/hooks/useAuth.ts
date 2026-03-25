import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import { useAuthStore } from "../store/authStore";
import type { UserRole } from "../types/auth";

// Temporary role fallback until the backend sets Firebase custom claims.
// Once the backend is running, the role will come from tokenResult.claims.role.
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
        // Use backend-assigned custom claim if present, otherwise infer from email
        const role: UserRole =
          (tokenResult.claims.role as UserRole) ??
          inferRoleFromEmail(firebaseUser.email ?? "");

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role,
        });
      } else {
        clearUser();
      }
    });

    return unsubscribe;
  }, []);

  return { user, isLoading };
}
