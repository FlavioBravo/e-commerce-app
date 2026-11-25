"use client";

import { useMutation } from "@tanstack/react-query";
import { FormEvent, useState } from "react";

import { useI18n } from "@/components/i18n-provider";
import { importCatalog } from "@/lib/browser-api";
import { ApiError } from "@/lib/errors";
import { formatMessage } from "@/lib/locale";
import { translateApiMessage } from "@/lib/messages";
import { revalidateCatalog } from "@/lib/revalidate-catalog";
import type { ImportReport } from "@/lib/types";

export function ImportForm() {
  const { locale, dictionary } = useI18n();
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const copy = dictionary.importForm;
  const statusLabel: Record<string, string> = {
    created: copy.created,
    updated: copy.updated,
    rejected: copy.rejected,
    skipped: copy.skipped,
    superseded: copy.superseded,
  };
  const mutation = useMutation({
    mutationFn: importCatalog,
    onSuccess: (result) => {
      void revalidateCatalog(result.rows.flatMap((row) => (row.sku ? [row.sku] : [])));
      setReport(result);
      setError(null);
    },
    onError: (reason) => setError(reason instanceof ApiError ? translateApiMessage(locale, reason.message) : copy.failed),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("file");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!file || file.size === 0) {
      setError(copy.choose);
      return;
    }
    mutation.mutate(file);
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          {copy.file}
          <input name="file" type="file" accept=".csv,text/csv" className="text-sm" />
        </label>
        <button type="submit" disabled={mutation.isPending} className="rounded-lg bg-rausch px-5 py-3 text-sm font-semibold text-white hover:bg-[#e31c5f] disabled:opacity-60">
          {mutation.isPending ? copy.importing : copy.import}
        </button>
      </form>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      {report ? (
        <div className="grid gap-3">
          <p className="text-sm">
            {formatMessage(copy.summary, {
              created: report.created,
              updated: report.updated,
              rejected: report.rejected,
              skipped: report.skipped,
              superseded: report.superseded,
            })}
          </p>
          <div className="overflow-x-auto rounded-2xl border border-line">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line bg-fog">
                <tr>
                  <th className="px-3 py-2">{copy.line}</th>
                  <th className="px-3 py-2">{copy.sku}</th>
                  <th className="px-3 py-2">{copy.status}</th>
                  <th className="px-3 py-2">{copy.detail}</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((row) => (
                  <tr key={`${row.line}-${row.sku ?? "blank"}`} className="border-b border-line last:border-0">
                    <td className="px-3 py-2">{row.line}</td>
                    <td className="px-3 py-2">{row.sku ?? "—"}</td>
                    <td className="px-3 py-2">{statusLabel[row.status] ?? row.status}</td>
                    <td className="px-3 py-2">{row.messages.map((message) => translateApiMessage(locale, message)).join(" ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
