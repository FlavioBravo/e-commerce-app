import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteProductButton } from "@/components/delete-product-button";
import { getProducts } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, formatMessage, isLocale, localePath, type Locale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";
import { parseAdminSearch } from "@/lib/schemas";

type Search = { q?: string; page?: string };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDictionary(isLocale(locale) ? locale : defaultLocale).admin.title };
}

export default async function AdminProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Search>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dictionary = getDictionary(locale);
  const query = await searchParams;
  const { q, page } = parseAdminSearch(query);
  let loadError: string | null = null;
  let catalog: Awaited<ReturnType<typeof getProducts>> | null = null;
  try {
    catalog = await getProducts({ q, page, pageSize: 20 }, "live");
  } catch (error) {
    loadError = error instanceof Error ? error.message : dictionary.admin.loadError;
  }
  const totalPages = catalog ? Math.max(1, Math.ceil(catalog.total / catalog.pageSize)) : 1;
  const copy = dictionary.admin;

  return (
    <div className="grid gap-5">
      <h1 className="text-[26px] font-semibold">{copy.products}</h1>
      <form action={localePath(locale, "/admin/products")} className="flex gap-3">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder={copy.search}
          className="rounded-full border border-line px-4 py-2 text-sm outline-none"
        />
        <button type="submit" className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white">
          {copy.search}
        </button>
      </form>
      {loadError ? <p className="text-sm text-red-800">{loadError}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-fog">
            <tr>
              <th className="px-3 py-2">{copy.name}</th>
              <th className="px-3 py-2">{copy.sku}</th>
              <th className="px-3 py-2">{copy.price}</th>
              <th className="px-3 py-2">{copy.stock}</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {catalog?.items.map((product) => (
              <tr key={product.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2">{product.name}</td>
                <td className="px-3 py-2">{product.sku}</td>
                <td className="px-3 py-2">{formatMoney(product.price)}</td>
                <td className="px-3 py-2">{product.stock}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-3">
                    <Link href={localePath(locale, `/admin/products/${product.id}/edit`)} className="underline">
                      {copy.edit}
                    </Link>
                    <DeleteProductButton productId={product.id} sku={product.sku} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {catalog && totalPages > 1 ? (
        <nav className="flex gap-3 text-sm">
          {page > 1 ? <Link href={pageHref(locale, page - 1, q)}>{copy.previous}</Link> : null}
          <span>{formatMessage(copy.page, { page, total: totalPages })}</span>
          {page < totalPages ? <Link href={pageHref(locale, page + 1, q)}>{copy.next}</Link> : null}
        </nav>
      ) : null}
    </div>
  );
}

function pageHref(locale: Locale, page: number, q?: string): string {
  const params = new URLSearchParams({ page: String(page) });
  if (q) params.set("q", q);
  return localePath(locale, `/admin/products?${params.toString()}`);
}
