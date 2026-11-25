"use client";

import { useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { useCartStore } from "@/lib/cart-store";

type Props = {
  productId: number;
  sku: string;
  name: string;
  unitPrice: string;
  stock: number;
  wide?: boolean;
};

export function AddToCart({ productId, sku, name, unitPrice, stock, wide = false }: Props) {
  const { dictionary } = useI18n();
  const add = useCartStore((state) => state.add);
  const [added, setAdded] = useState(false);

  if (stock < 1) {
    return <p className="text-sm text-muted">{dictionary.product.outOfStock}</p>;
  }

  return (
    <div className={wide ? "grid gap-2" : "flex items-center gap-3"}>
      <button
        type="button"
        className={`rounded-lg bg-rausch px-5 py-3 text-sm font-semibold text-white hover:bg-[#e31c5f] ${wide ? "w-full" : ""}`}
        onClick={() => {
          add({ productId, sku, name, unitPrice, stock });
          setAdded(true);
        }}
      >
        {added ? dictionary.product.added : dictionary.product.add}
      </button>
    </div>
  );
}
