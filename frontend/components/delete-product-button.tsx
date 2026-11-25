"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { deleteProduct } from "@/lib/browser-api";
import { ApiError } from "@/lib/errors";
import { translateApiMessage } from "@/lib/messages";
import { revalidateCatalog } from "@/lib/revalidate-catalog";

/** Asks for confirmation, then deletes one product and refreshes the list. */
export function DeleteProductButton({ productId, sku }: { productId: number; sku: string }) {
  const { locale, dictionary } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: () => {
      void revalidateCatalog([sku]);
      router.refresh();
    },
    onError: (reason) =>
      setError(reason instanceof ApiError ? translateApiMessage(locale, reason.message) : dictionary.delete.failed),
  });

  return (
    <div>
      <button
        type="button"
        className="text-sm text-red-800 underline"
        disabled={mutation.isPending}
        onClick={() => {
          if (window.confirm(dictionary.delete.confirm)) {
            setError(null);
            mutation.mutate();
          }
        }}
      >
        {dictionary.delete.label}
      </button>
      {error ? <p className="mt-1 text-xs text-red-800">{error}</p> : null}
    </div>
  );
}
