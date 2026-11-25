"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useI18n } from "@/components/i18n-provider";
import { useCartReady } from "@/components/providers";
import { useCartStore } from "@/lib/cart-store";
import { locales, type Locale } from "@/lib/locale";

export function Header() {
  const { locale, dictionary, href } = useI18n();
  const ready = useCartReady();
  const count = useCartStore((state) => state.items.reduce((total, item) => total + item.quantity, 0));
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function languageHref(target: Locale): string {
    const path = pathname.replace(/^\/(es|en)(?=\/|$)/, "") || "/products";
    const query = searchParams.toString();
    return `/${target}${path}${query ? `?${query}` : ""}`;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#ebebeb] bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-4 lg:px-12">
        <Link href={href("/products")} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-rausch text-sm text-white">N</span>
          norte
        </Link>
        <nav className="flex items-center gap-2 text-sm font-medium">
          <Link href={href("/products")} className="rounded-full px-4 py-2 hover:bg-fog">
            {dictionary.nav.catalog}
          </Link>
          <Link href={href("/admin/products")} className="rounded-full px-4 py-2 hover:bg-fog">
            {dictionary.nav.admin}
          </Link>
          <div className="flex items-center rounded-full border border-line p-1 text-xs" aria-label={dictionary.nav.language}>
            {locales.map((code) => (
              <Link
                key={code}
                href={languageHref(code)}
                hrefLang={code}
                aria-current={code === locale ? "true" : undefined}
                className={`rounded-full px-2 py-1 uppercase ${code === locale ? "bg-ink text-white" : "text-muted"}`}
              >
                {code}
              </Link>
            ))}
          </div>
          <Link href={href("/cart")} aria-label={dictionary.nav.cart} className="relative grid h-10 w-10 place-items-center rounded-full border border-line hover:shadow-search">
            <CartIcon />
            {ready && count > 0 ? (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rausch px-1 text-[11px] text-white">
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 7h12l-1 12H7L6 7Z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 7a3 3 0 0 1 6 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
