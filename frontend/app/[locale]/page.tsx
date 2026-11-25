import { redirect } from "next/navigation";

import { defaultLocale, isLocale } from "@/lib/locale";

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(isLocale(locale) ? `/${locale}/products` : `/${defaultLocale}/products`);
}
