"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n-provider";
import { useCartReady } from "@/components/providers";
import { useCartStore } from "@/lib/cart-store";
import { addMoney, formatMoney } from "@/lib/money";

export function CartView() {
  const { dictionary, href } = useI18n();
  const ready = useCartReady();
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const copy = dictionary.cart;

  if (!ready) return <p className="text-sm text-muted">{copy.loading}</p>;
  if (items.length === 0) {
    return (
      <p className="text-sm">
        {copy.empty}{" "}
        <Link href={href("/products")} className="underline">
          {copy.back}
        </Link>
      </p>
    );
  }

  const total = addMoney(items.map((item) => lineAmount(item.unitPrice, item.quantity)));

  return (
    <div className="grid gap-6">
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {items.map((item) => (
          <li key={item.productId} className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted">{item.sku}</p>
            </div>
            <label className="text-sm">
              {copy.quantity}
              <input
                type="number"
                min={1}
                max={item.stock}
                value={item.quantity}
                onChange={(event) => setQuantity(item.productId, Number(event.target.value))}
                className="ml-2 w-20 rounded-lg border border-line px-2 py-1"
              />
            </label>
            <div className="text-right">
              <p className="font-semibold">{formatMoney(lineAmount(item.unitPrice, item.quantity))}</p>
              <button type="button" onClick={() => remove(item.productId)} className="text-sm text-muted underline">
                {copy.remove}
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{copy.preview}</p>
        <p className="text-2xl font-semibold">{formatMoney(total)}</p>
      </div>
      <Link href={href("/checkout")} className="w-fit rounded-lg bg-rausch px-5 py-3 text-sm font-semibold text-white hover:bg-[#e31c5f]">
        {copy.checkout}
      </Link>
    </div>
  );
}

function lineAmount(unitPrice: string, quantity: number): string {
  const [whole, fraction = ""] = unitPrice.split(".");
  const cents = (Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2))) * quantity;
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
