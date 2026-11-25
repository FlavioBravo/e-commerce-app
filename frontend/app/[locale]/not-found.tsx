"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n-provider";

export default function NotFound() {
  const { dictionary, href } = useI18n();
  return (
    <div className="grid gap-3">
      <h1 className="text-[26px] font-semibold">{dictionary.notFound.title}</h1>
      <Link href={href("/products")} className="text-sm font-medium underline">
        {dictionary.notFound.back}
      </Link>
    </div>
  );
}
