import { revalidatePath, revalidateTag } from "next/cache";

import { revalidateCatalog } from "@/lib/revalidate-catalog";

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

describe("revalidateCatalog", () => {
  beforeEach(() => {
    jest.mocked(revalidatePath).mockClear();
    jest.mocked(revalidateTag).mockClear();
  });

  it("drops the catalog tag and both language pages", async () => {
    await revalidateCatalog(["LAMP-1", " LAMP-1 ", ""]);
    expect(revalidateTag).toHaveBeenCalledWith("catalog");
    expect(revalidatePath).toHaveBeenCalledWith("/en/products");
    expect(revalidatePath).toHaveBeenCalledWith("/es/products");
    expect(revalidatePath).toHaveBeenCalledWith("/en/products/[sku]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/es/products/[sku]", "page");
    expect(revalidatePath).toHaveBeenCalledWith("/en/products/LAMP-1");
    expect(revalidatePath).toHaveBeenCalledWith("/es/products/LAMP-1");
  });
});
