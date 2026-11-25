import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getOrder } from "@/lib/api";
import { getDictionary } from "@/lib/i18n";
import { defaultLocale, formatMessage, isLocale } from "@/lib/locale";
import { formatMoney } from "@/lib/money";
import { parseResourceId } from "@/lib/schemas";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; id: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = getDictionary(isLocale(locale) ? locale : defaultLocale);
  return {
    title: dictionary.order.title,
    robots: { index: false, follow: false },
  };
}

export default async function OrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const orderId = parseResourceId(id);
  if (orderId === null) notFound();
  const dictionary = getDictionary(locale);
  const order = await getOrder(orderId);
  if (!order) notFound();
  const status = order.status === "paid" ? dictionary.order.paid : order.status;

  return (
    <article className="grid max-w-2xl gap-5">
      <h1 className="text-[26px] font-semibold">{formatMessage(dictionary.order.heading, { id: order.id })}</h1>
      <p className="text-sm">
        {formatMessage(dictionary.order.status, { status, reference: order.paymentReference })}
      </p>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
        {order.items.map((item) => (
          <li key={`${item.productId}-${item.sku}`} className="flex justify-between px-4 py-3 text-sm">
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>{formatMoney(item.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <p className="text-2xl font-semibold">{formatMoney(order.total)}</p>
    </article>
  );
}
