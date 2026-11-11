import { render, screen } from "@testing-library/react";
import { expect, it } from "vite-plus/test";

it("renders React in jsdom", () => {
  render(<h1>hello</h1>);
  expect(screen.getByRole("heading").textContent).toBe("hello");
});
