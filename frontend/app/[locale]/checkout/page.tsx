import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutForm } from "@/components/checkout-form";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, isLocale } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = getDictionary(isLocale(locale) ? locale : defaultLocale);
  return {
    title: dictionary.checkout.title,
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  return (
    <div className="grid gap-6">
      <h1 className="text-[26px] font-semibold">{dictionary.checkout.title}</h1>
      <CheckoutForm />
    </div>
  );
}
