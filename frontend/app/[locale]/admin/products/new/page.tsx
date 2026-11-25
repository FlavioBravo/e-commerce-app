import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/product-form";
import { getCategories } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, isLocale } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(isLocale(locale) ? locale : defaultLocale).admin.newTitle };
}

export default async function NewProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const categories = await getCategories("live").catch(() => []);
  return (
    <div className="grid gap-5">
      <h1 className="text-[26px] font-semibold">{dictionary.admin.newTitle}</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
