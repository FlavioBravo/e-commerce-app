import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddToCart } from "@/components/add-to-cart";
import { ProductMedia } from "@/components/product-media";
import { getProductBySku } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { productJsonLd } from "@/lib/json-ld";
import { defaultLocale, isLocale, localePath, type Locale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";

type Props = { params: Promise<{ locale: string; sku: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, sku } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : defaultLocale;
  const dictionary = getDictionary(safeLocale);
  const product = await getProductBySku(sku);
  if (!product) return { title: dictionary.product.notFound };
  const path = `/products/${encodeURIComponent(product.sku)}`;
  return {
    title: product.name,
    description: product.description,
    alternates: {
      languages: {
        es: localePath("es", path),
        en: localePath("en", path),
      },
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, sku } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = getDictionary(locale);
  const product = await getProductBySku(sku);
  if (!product) notFound();

  return (
    <article className="grid gap-8 lg:grid-cols-[1.4fr_0.7fr] lg:items-start">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: productJsonLd(product) }} />
      <div>
        <Link href={localePath(locale, "/products")} className="text-sm font-medium underline">
          {dictionary.nav.catalog}
        </Link>
        <ProductMedia
          label={product.category}
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="mt-4 h-56 rounded-2xl sm:h-72 lg:aspect-[4/3] lg:h-auto"
        />
        <h1 className="mt-6 text-[26px] font-semibold leading-tight">{product.name}</h1>
        <p className="mt-1 text-muted">{product.category}</p>
        <p className="mt-6 max-w-2xl text-base leading-7">{product.description}</p>
      </div>
      <aside className="rounded-2xl border border-line p-6 shadow-card lg:sticky lg:top-24">
        <p className="text-[22px] font-semibold">{formatMoney(product.price)}</p>
        <dl className="mt-4 grid gap-2 text-sm text-muted">
          <div className="flex justify-between">
            <dt>{dictionary.product.sku}</dt>
            <dd className="text-ink">{product.sku}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{dictionary.product.stock}</dt>
            <dd className="text-ink">{product.stock}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{dictionary.product.weight}</dt>
            <dd className="text-ink">{product.weightKg} kg</dd>
          </div>
        </dl>
        <div className="mt-6">
          <AddToCart
            productId={product.id}
            sku={product.sku}
            name={product.name}
            unitPrice={product.price}
            stock={product.stock}
            wide
          />
        </div>
      </aside>
    </article>
  );
}
