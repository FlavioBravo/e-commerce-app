import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CartView } from "@/components/cart-view";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, isLocale } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = getDictionary(isLocale(locale) ? locale : defaultLocale);
  return {
    title: dictionary.cart.title,
    robots: { index: false, follow: false },
  };
}

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  return (
    <div className="grid gap-6">
      <h1 className="text-[26px] font-semibold">{dictionary.cart.title}</h1>
      <CartView />
    </div>
  );
}
