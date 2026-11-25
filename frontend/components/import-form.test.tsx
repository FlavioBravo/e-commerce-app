import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ImportForm } from "@/components/import-form";
import { I18nProvider } from "@/components/i18n-provider";
import en from "@/dictionaries/en";
import { importCatalog } from "@/lib/browser-api";
import { revalidateCatalog } from "@/lib/revalidate-catalog";

jest.mock("@/lib/browser-api", () => ({
  importCatalog: jest.fn(),
}));

jest.mock("@/lib/revalidate-catalog", () => ({
  revalidateCatalog: jest.fn(),
}));

function renderImport() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider locale="en" dictionary={en}>
        <ImportForm />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe("ImportForm", () => {
  beforeEach(() => {
    jest.mocked(importCatalog).mockReset();
    jest.mocked(revalidateCatalog).mockClear();
  });

  it("asks for a file before calling the API", async () => {
    const user = userEvent.setup();
    renderImport();
    await user.click(screen.getByRole("button", { name: "Import" }));
    expect(screen.getByText("Choose a CSV file.")).toBeInTheDocument();
    expect(importCatalog).not.toHaveBeenCalled();
  });

  it("shows the import report", async () => {
    const user = userEvent.setup();
    jest.mocked(importCatalog).mockResolvedValue({
      created: 1,
      updated: 0,
      rejected: 0,
      skipped: 0,
      superseded: 0,
      rows: [{ line: 2, sku: "LAMP-1", name: "Desk lamp", status: "created", messages: [] }],
    });
    renderImport();
    const file = new File(["name,sku\nDesk lamp,LAMP-1\n"], "catalog.csv", { type: "text/csv" });
    await user.upload(screen.getByLabelText("CSV file"), file);
    await user.click(screen.getByRole("button", { name: "Import" }));

    const uploaded = jest.mocked(importCatalog).mock.calls[0]?.[0] as File;
    expect(uploaded).toBeInstanceOf(File);
    expect(uploaded.name).toBe("catalog.csv");
    expect(uploaded.size).toBeGreaterThan(0);
    expect(await screen.findByText("Created 1 · Updated 0 · Rejected 0 · Skipped 0 · Replaced 0")).toBeInTheDocument();
    expect(screen.getByText("LAMP-1")).toBeInTheDocument();
    expect(revalidateCatalog).toHaveBeenCalledWith(["LAMP-1"]);
  });
});
