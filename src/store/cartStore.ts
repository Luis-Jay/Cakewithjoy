import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  cakeImage?: string;
  discountType?: string;
  idPhoto?: string;
  idHoldingPhoto?: string;
}

interface CartState {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQty: (id: string, delta: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      setItems: (items) => set({ items }),

      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === newItem.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { ...newItem, quantity: 1 }] };
        }),

      updateQty: (id, delta) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
            .filter((i) => i.quantity > 0),
        })),

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "bms-cart",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
