"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";

import { useCartStore } from "@/lib/cart-store";

const CartReadyContext = createContext(false);

/** Whether the cart has finished reading localStorage. */
export function useCartReady(): boolean {
  return useContext(CartReadyContext);
}

/** Provides React Query and rehydrates the cart before the count is shown. */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void useCartStore.persist.rehydrate().then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CartReadyContext.Provider value={ready}>{children}</CartReadyContext.Provider>
    </QueryClientProvider>
  );
}
