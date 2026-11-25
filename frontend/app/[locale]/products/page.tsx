import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductMedia } from "@/components/product-media";
import { getCategories, getProducts } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { formatMessage, isLocale, localePath, locales, type Locale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";
import { parseCatalogSearch } from "@/lib/schemas";

type Search = { q?: string; category?: string; page?: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale = await readLocale(params);
  return {
    title: getDictionary(locale).catalog.title,
    alternates: { languages: languageAlternates("/products") },
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const locale = await readLocale(params);
  const dictionary = getDictionary(locale);
  const query = await searchParams;
  const { q, category, page } = parseCatalogSearch(query);

  let catalog: Awaited<ReturnType<typeof getProducts>> | null = null;
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let loadError: string | null = null;
  try {
    [catalog, categories] = await Promise.all([getProducts({ q, category, page, pageSize: 12 }), getCategories()]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : dictionary.catalog.loadError;
  }

  const totalPages = catalog ? Math.max(1, Math.ceil(catalog.total / catalog.pageSize)) : 1;
  const copy = dictionary.catalog;

  return (
    <div className="grid gap-8">
      <form
        action={localePath(locale, "/products")}
        className="mx-auto flex w-full max-w-3xl items-center rounded-full border border-line bg-white py-2 pl-6 pr-2 shadow-search"
      >
        <label className="min-w-0 flex-1">
          <span className="block text-xs font-semibold">{copy.search}</span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder={copy.searchPlaceholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </label>
        <div className="mx-4 hidden h-8 w-px bg-line sm:block" />
        <label className="hidden sm:block">
          <span className="block text-xs font-semibold">{copy.category}</span>
          <select name="category" defaultValue={category ?? ""} className="max-w-[140px] bg-transparent text-sm outline-none">
            <option value="">{copy.all}</option>
            {categories.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" aria-label={copy.search} className="ml-3 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-rausch text-white">
          <SearchIcon />
        </button>
      </form>

      <div className="flex gap-6 overflow-x-auto border-b border-[#ebebeb]">
        <CategoryLink href={localePath(locale, "/products")} selected={!category}>
          {copy.everything}
        </CategoryLink>
        {categories.map((item) => (
          <CategoryLink
            key={item.id}
            href={localePath(locale, `/products?category=${encodeURIComponent(item.name)}`)}
            selected={category === item.name}
          >
            {item.name}
          </CategoryLink>
        ))}
      </div>

      {loadError ? <p className="text-sm text-red-700">{loadError}</p> : null}
      {catalog && catalog.items.length === 0 ? <p className="text-sm text-muted">{copy.empty}</p> : null}

      <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {catalog?.items.map((product) => (
          <li key={product.id}>
            <Link href={localePath(locale, `/products/${encodeURIComponent(product.sku)}`)} className="group block">
              <ProductMedia
                label={product.category}
                sizes="(min-width: 1280px) 320px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                className="aspect-square rounded-2xl transition group-hover:brightness-95"
              />
              <div className="mt-3">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="truncate text-[15px] font-semibold">{product.name}</h2>
                  <p className="shrink-0 text-[15px] font-semibold">{formatMoney(product.price)}</p>
                </div>
                <p className="truncate text-sm text-muted">{product.category}</p>
                <p className="text-sm text-muted">
                  {product.stock > 0 ? formatMessage(copy.available, { count: product.stock }) : copy.outOfStock}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {catalog && totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={pageHref(locale, { q, category, page: page - 1 })} className="rounded-full border border-ink px-4 py-2 font-medium">
              {copy.previous}
            </Link>
          ) : null}
          <span className="text-muted">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={pageHref(locale, { q, category, page: page + 1 })} className="rounded-full border border-ink px-4 py-2 font-medium">
              {copy.next}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}

function CategoryLink({ href, selected, children }: { href: string; selected: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`shrink-0 border-b-2 pb-3 text-sm ${selected ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:border-[#dddddd] hover:text-ink"}`}
    >
      {children}
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.2" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function pageHref(locale: Locale, filters: { q?: string; category?: string; page: number }): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  params.set("page", String(filters.page));
  return localePath(locale, `/products?${params.toString()}`);
}

async function readLocale(params: Promise<{ locale: string }>): Promise<Locale> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return locale;
}

function languageAlternates(path: string): Record<Locale, string> {
  return { es: localePath("es", path), en: localePath("en", path) };
}
