import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Header } from "@/components/header";
import { I18nProvider } from "@/components/i18n-provider";
import { Providers } from "@/components/providers";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, isLocale, locales } from "@/lib/locale";

import "../globals.css";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = getDictionary(isLocale(locale) ? locale : defaultLocale);
  return {
    title: {
      default: "Norte",
      template: "%s · Norte",
    },
    description: dictionary.meta.description,
  };
}

export default async function LocaleLayout({
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
    <html lang={locale}>
      <body className={`${sans.className} min-h-screen text-ink antialiased`}>
        <Providers>
          <I18nProvider locale={locale} dictionary={dictionary}>
            <Suspense>
              <Header />
            </Suspense>
            <main className="mx-auto max-w-[1440px] px-6 py-8 lg:px-12">{children}</main>
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
