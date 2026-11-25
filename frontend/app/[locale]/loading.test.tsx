import { render, screen } from "@testing-library/react";

import LocaleLoading from "@/app/[locale]/loading";

describe("LocaleLoading", () => {
  it("announces that the page is loading", () => {
    render(<LocaleLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
  });
});
