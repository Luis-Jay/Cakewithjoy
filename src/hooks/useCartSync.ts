import { useEffect, useRef } from "react";
import { ref, get, set } from "firebase/database";
import { db } from "../config/firebase";
import { useCartStore } from "../store/cartStore";
import type { CartItem } from "../store/cartStore";

export function useCartSync(uid: string | null | undefined) {
  const setItems = useCartStore((s) => s.setItems);
  const items = useCartStore((s) => s.items);
  const isLoading = useRef(false);

  // Load cart from Firebase when user logs in
  useEffect(() => {
    if (!uid) {
      setItems([]);
      return;
    }

    isLoading.current = true;
    get(ref(db, `carts/${uid}`)).then((snapshot) => {
      const data = snapshot.val();
      setItems(Array.isArray(data) ? data : []);
    }).finally(() => {
      isLoading.current = false;
    });
  }, [uid]);

  // Save cart to Firebase whenever items change
  useEffect(() => {
    if (!uid || isLoading.current) return;
    set(ref(db, `carts/${uid}`), items);
  }, [uid, items]);
}
