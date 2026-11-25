import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ImportForm } from "@/components/import-form";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, isLocale } from "@/lib/locale";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(isLocale(locale) ? locale : defaultLocale).admin.importTitle };
}

export default async function ImportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  return (
    <div className="grid gap-5">
      <h1 className="text-[26px] font-semibold">{dictionary.admin.importTitle}</h1>
      <p className="max-w-2xl text-sm text-muted">{dictionary.admin.importHelp}</p>
      <ImportForm />
    </div>
  );
}
