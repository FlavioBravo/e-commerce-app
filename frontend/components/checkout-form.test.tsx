import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CheckoutForm } from "@/components/checkout-form";
import { I18nProvider } from "@/components/i18n-provider";
import en from "@/dictionaries/en";
import { placeOrder } from "@/lib/browser-api";
import { useCartStore } from "@/lib/cart-store";
import { revalidateCatalog } from "@/lib/revalidate-catalog";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("@/components/providers", () => ({
  useCartReady: () => true,
}));

jest.mock("@/lib/browser-api", () => ({
  placeOrder: jest.fn(),
}));

jest.mock("@/lib/revalidate-catalog", () => ({
  revalidateCatalog: jest.fn(),
}));

const lamp = {
  productId: 1,
  sku: "LAMP-1",
  name: "Desk lamp",
  unitPrice: "10.00",
  stock: 5,
  quantity: 1,
};

function renderCheckout() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <I18nProvider locale="en" dictionary={en}>
        <CheckoutForm />
      </I18nProvider>
    </QueryClientProvider>,
  );
}

describe("CheckoutForm", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
    jest.mocked(placeOrder).mockReset();
    jest.mocked(revalidateCatalog).mockClear();
  });

  it("shows an empty cart", () => {
    renderCheckout();
    expect(screen.getByText("There are no products to pay for.")).toBeInTheDocument();
  });

  it("sends product ids and quantities", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [lamp] });
    jest.mocked(placeOrder).mockResolvedValue({
      id: 9,
      status: "paid",
      total: "10.00",
      paymentReference: "pay_test",
      items: [],
    });
    renderCheckout();
    await user.click(screen.getByRole("button", { name: "Pay" }));
    expect(placeOrder).toHaveBeenCalledWith([{ productId: 1, quantity: 1 }]);
    await waitFor(() => expect(revalidateCatalog).toHaveBeenCalledWith(["LAMP-1"]));
  });

  it("blocks a line whose quantity is below 1", async () => {
    const user = userEvent.setup();
    useCartStore.setState({ items: [{ ...lamp, quantity: 0 }] });
    renderCheckout();
    await user.click(screen.getByRole("button", { name: "Pay" }));
    expect(await screen.findByText("Quantity must be at least 1.")).toBeInTheDocument();
    expect(placeOrder).not.toHaveBeenCalled();
  });
});
