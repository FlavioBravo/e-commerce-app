import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDictionary } from "@/lib/i18n";
import { isLocale, localePath } from "@/lib/locale";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);

  return (
    <div className="grid gap-6">
      <nav className="flex gap-2 text-sm font-medium">
        <Link href={localePath(locale, "/admin/products")} className="rounded-full px-4 py-2 hover:bg-fog">
          {dictionary.admin.products}
        </Link>
        <Link href={localePath(locale, "/admin/products/new")} className="rounded-full px-4 py-2 hover:bg-fog">
          {dictionary.admin.new}
        </Link>
        <Link href={localePath(locale, "/admin/import")} className="rounded-full px-4 py-2 hover:bg-fog">
          {dictionary.admin.import}
        </Link>
      </nav>
      {children}
    </div>
  );
}
