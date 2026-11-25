"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = {
  productId: number;
  sku: string;
  name: string;
  unitPrice: string;
  stock: number;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">) => void;
  setQuantity: (productId: number, quantity: number) => void;
  remove: (productId: number) => void;
  clear: () => void;
};

/**
 * Browser cart persisted in localStorage.
 * Hydration waits until `Providers` calls `persist.rehydrate`, so the first server render stays empty.
 *
 * `add` inserts one unit, or increases quantity up to the line stock.
 * `setQuantity` drops the line when the next quantity is below 1.
 * `remove` deletes one line. `clear` empties the cart after a successful payment.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((state) => {
          if (item.stock < 1) return state;
          const current = state.items.find((entry) => entry.productId === item.productId);
          if (!current) return { items: [...state.items, { ...item, quantity: 1 }] };
          return {
            items: state.items.map((entry) =>
              entry.productId === item.productId
                ? {
                    ...entry,
                    ...item,
                    quantity: Math.min(entry.quantity + 1, item.stock),
                  }
                : entry,
            ),
          };
        }),
      setQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.flatMap((entry) => {
            if (entry.productId !== productId) return [entry];
            if (quantity < 1) return [];
            return [{ ...entry, quantity: Math.min(quantity, entry.stock) }];
          }),
        })),
      remove: (productId) => set((state) => ({ items: state.items.filter((entry) => entry.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "ecommerce-cart",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
