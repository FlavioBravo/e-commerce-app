"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { CATALOG_CACHE_TAG } from "@/lib/api";
import { locales } from "@/lib/locale";

/**
 * Drops the public catalog cache after a product or stock change.
 * Admin and order reads do not use this tag, so they stay live.
 */
export async function revalidateCatalog(skus: string[] = []): Promise<void> {
  revalidateTag(CATALOG_CACHE_TAG);
  const unique = [...new Set(skus.map((sku) => sku.trim()).filter((sku) => sku !== ""))];
  for (const locale of locales) {
    revalidatePath(`/${locale}/products`);
    revalidatePath(`/${locale}/products/[sku]`, "page");
    for (const sku of unique) {
      revalidatePath(`/${locale}/products/${encodeURIComponent(sku)}`);
    }
  }
}
