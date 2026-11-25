import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ProductForm } from "@/components/product-form";
import { I18nProvider } from "@/components/i18n-provider";
import en from "@/dictionaries/en";
import { createProduct } from "@/lib/browser-api";
import { revalidateCatalog } from "@/lib/revalidate-catalog";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/lib/browser-api", () => ({
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
}));

jest.mock("@/lib/revalidate-catalog", () => ({
  revalidateCatalog: jest.fn(),
}));

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider locale="en" dictionary={en}>
        <ProductForm categories={[{ id: 1, name: "Tools" }]} />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Desk lamp");
  await user.type(screen.getByLabelText("Description"), "A lamp for the desk");
  await user.type(screen.getByLabelText("Category"), "Tools");
}

describe("ProductForm", () => {
  beforeEach(() => {
    jest.mocked(createProduct).mockReset();
    jest.mocked(revalidateCatalog).mockClear();
  });

  it("blocks an invalid SKU before calling the API", async () => {
    const user = userEvent.setup();
    renderForm();
    await fillRequired(user);
    await user.type(screen.getByLabelText("SKU"), "bad sku");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("SKU must contain only letters, numbers, and hyphens.")).toBeInTheDocument();
    expect(createProduct).not.toHaveBeenCalled();
  });

  it("submits a normalized product", async () => {
    const user = userEvent.setup();
    jest.mocked(createProduct).mockResolvedValue({
      id: 1,
      sku: "LAMP-1",
      name: "Desk lamp",
      description: "A lamp for the desk",
      category: "Tools",
      price: "0.00",
      stock: 0,
      weightKg: "0",
    });
    renderForm();
    await fillRequired(user);
    await user.type(screen.getByLabelText("SKU"), "lamp-1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Desk lamp",
        sku: "LAMP-1",
        category: "Tools",
        price: "0.00",
        stock: 0,
        weightKg: "0",
      }),
    );
    await waitFor(() => expect(revalidateCatalog).toHaveBeenCalledWith(["LAMP-1"]));
  });
});
