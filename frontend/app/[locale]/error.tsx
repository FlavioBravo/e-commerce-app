"use client";

import { useI18n } from "@/components/i18n-provider";

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { dictionary } = useI18n();

  return (
    <div className="grid max-w-xl gap-3">
      <h1 className="text-[26px] font-semibold">{dictionary.error.title}</h1>
      <p className="text-sm text-muted">{dictionary.error.body}</p>
      <button
        type="button"
        onClick={reset}
        className="w-fit rounded-lg bg-rausch px-5 py-3 text-sm font-semibold text-white hover:bg-[#e31c5f]"
      >
        {dictionary.error.retry}
      </button>
    </div>
  );
}
