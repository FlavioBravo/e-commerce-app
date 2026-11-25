import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DeleteProductButton } from "@/components/delete-product-button";
import { I18nProvider } from "@/components/i18n-provider";
import en from "@/dictionaries/en";
import { deleteProduct } from "@/lib/browser-api";
import { ApiError } from "@/lib/errors";
import { revalidateCatalog } from "@/lib/revalidate-catalog";

const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

jest.mock("@/lib/browser-api", () => ({
  deleteProduct: jest.fn(),
}));

jest.mock("@/lib/revalidate-catalog", () => ({
  revalidateCatalog: jest.fn(),
}));

function renderDelete() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider locale="en" dictionary={en}>
        <DeleteProductButton productId={4} sku="LAMP-1" />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe("DeleteProductButton", () => {
  beforeEach(() => {
    refresh.mockReset();
    jest.mocked(deleteProduct).mockReset();
    jest.mocked(revalidateCatalog).mockClear();
  });

  it("does nothing when confirmation is dismissed", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "confirm").mockReturnValue(false);
    renderDelete();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteProduct).not.toHaveBeenCalled();
  });

  it("deletes the product after confirmation", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    jest.mocked(deleteProduct).mockResolvedValue({ id: 4, deleted: true });
    renderDelete();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(deleteProduct).toHaveBeenCalledWith(4);
    expect(revalidateCatalog).toHaveBeenCalledWith(["LAMP-1"]);
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the API error", async () => {
    const user = userEvent.setup();
    jest.spyOn(window, "confirm").mockReturnValue(true);
    jest.mocked(deleteProduct).mockRejectedValue(new ApiError("Product cannot be deleted because it belongs to an order."));
    renderDelete();
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("Product cannot be deleted because it belongs to an order.")).toBeInTheDocument();
  });
});
