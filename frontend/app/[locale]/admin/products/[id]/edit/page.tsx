import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/product-form";
import { getCategories, getProduct } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, formatMessage, isLocale } from "@/lib/locale";
import { parseResourceId } from "@/lib/schemas";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(isLocale(locale) ? locale : defaultLocale).admin.edit };
}

export default async function EditProductPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const productId = parseResourceId(id);
  if (productId === null) notFound();
  const dictionary = getDictionary(locale);
  const [product, categories] = await Promise.all([getProduct(productId), getCategories("live").catch(() => [])]);
  if (!product) notFound();
  return (
    <div className="grid gap-5">
      <h1 className="text-[26px] font-semibold">{formatMessage(dictionary.admin.editTitle, { name: product.name })}</h1>
      <ProductForm categories={categories} product={product} />
    </div>
  );
}
