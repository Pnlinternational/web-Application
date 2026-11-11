import { expect, it } from "vite-plus/test";
import { appendQueryParams, capitalize, generateQueryString, getInitials } from "./utils";

it("builds query strings and skips empty values", () => {
  expect(
    generateQueryString({ page: 2, q: "tee shirt", sortBy: undefined, order: null, active: true }),
  ).toBe("page=2&q=tee+shirt&active=true");
});

it("only appends ? when there is something to append", () => {
  expect(appendQueryParams("products", { page: 1 })).toBe("products?page=1");
  expect(appendQueryParams("products", { q: undefined })).toBe("products");
});

it("capitalizes and builds initials", () => {
  expect(capitalize("draft")).toBe("Draft");
  expect(getInitials("ada", "lovelace")).toBe("AL");
});
