import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vite-plus/test";
import type { Product, ProductListParams } from "../schemas";
import { AdminProductsTable } from "./admin-products-table";

const product: Product = {
  id: "p1",
  slug: "tee",
  name: "Cotton tee",
  description: "",
  price: { amount: 2500, currency: "USD" },
  imageUrl: null,
  stock: 12,
  status: "active",
  createdAt: "2026-01-15T12:00:00Z",
};

const params: ProductListParams = { page: 1, pageSize: 20 };

function renderTable(onParamsChange = vi.fn()) {
  render(
    <AdminProductsTable
      page={{ items: [product], total: 45, page: 1, pageSize: 20 }}
      params={params}
      onParamsChange={onParamsChange}
    />,
  );
  return onParamsChange;
}

it("renders formatted rows and the page summary", () => {
  renderTable();
  expect(screen.getByText("Cotton tee")).toBeTruthy();
  expect(screen.getByText("$25.00")).toBeTruthy();
  expect(screen.getByText(/Page 1 of 3/)).toBeTruthy();
});

it("requests the next page through params (1-based)", async () => {
  const onParamsChange = renderTable();
  await userEvent.click(screen.getByRole("button", { name: "Next" }));
  expect(onParamsChange).toHaveBeenCalledWith({ page: 2, pageSize: 20 });
});

it("sorting resets to the first page", async () => {
  const onParamsChange = renderTable();
  await userEvent.click(screen.getByRole("button", { name: /Name/ }));
  expect(onParamsChange).toHaveBeenCalledWith({
    page: 1,
    pageSize: 20,
    sortBy: "name",
    order: "asc",
  });
});
