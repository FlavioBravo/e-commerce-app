"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { useCartReady } from "@/components/providers";
import { placeOrder } from "@/lib/browser-api";
import { useCartStore } from "@/lib/cart-store";
import { ApiError } from "@/lib/errors";
import { formatMessage } from "@/lib/locale";
import { translateApiMessage } from "@/lib/messages";
import { formatMoney } from "@/lib/money";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import { checkoutRequestSchema, validationError } from "@/lib/schemas";

export function CheckoutForm() {
  const { locale, dictionary, href } = useI18n();
  const ready = useCartReady();
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const [error, setError] = useState<ApiError | null>(null);
  const copy = dictionary.checkout;
  const mutation = useMutation({
    mutationFn: (payload: Array<{ productId: number; quantity: number }>) => placeOrder(payload),
    onSuccess: (order) => {
      void revalidateCatalog(items.map((item) => item.sku));
      clear();
      router.push(href(`/orders/${order.id}`));
      router.refresh();
    },
    onError: (reason) => setError(reason instanceof ApiError ? reason : new ApiError(copy.failed)),
  });

  if (!ready) return <p className="text-sm text-muted">{dictionary.cart.loading}</p>;
  if (items.length === 0) {
    return (
      <p className="text-sm">
        {copy.empty}{" "}
        <Link href={href("/products")} className="underline">
          {copy.goCatalog}
        </Link>
      </p>
    );
  }

  return (
    <div className="grid max-w-xl gap-5">
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {items.map((item) => (
          <li key={item.productId} className="flex justify-between px-4 py-3 text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatMoney(item.unitPrice)}</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">{copy.note}</p>
      {error ? (
        <div className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
          <p>{translateApiMessage(locale, error.message)}</p>
          {error.details.length > 0 ? (
            <ul className="mt-1 list-disc pl-4">
              {error.details.map((detail, index) => (
                <li key={index}>
                  {detail.sku
                    ? formatMessage(copy.stock, {
                        sku: detail.sku,
                        available: detail.available ?? "",
                        requested: detail.requested ?? "",
                      })
                    : translateApiMessage(locale, String(detail.message ?? ""))}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <button
        type="button"
        disabled={mutation.isPending}
        onClick={() => {
          const parsed = checkoutRequestSchema.safeParse({
            items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
          });
          if (!parsed.success) {
            setError(validationError(copy.failed, parsed.error));
            return;
          }
          setError(null);
          mutation.mutate(parsed.data.items);
        }}
        className="w-fit rounded-lg bg-rausch px-5 py-3 text-sm font-semibold text-white hover:bg-[#e31c5f] disabled:opacity-60"
      >
        {mutation.isPending ? copy.paying : copy.pay}
      </button>
    </div>
  );
}
