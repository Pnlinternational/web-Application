import { describe, expect, it } from "vite-plus/test";
import { orderGroupAria, orderGroupOf, ordersSearchSchema } from "./status";

describe("order status groups", () => {
  it("labels counts for screen readers", () => {
    expect(orderGroupAria("In China", 2)).toBe("In China, 2 orders");
    expect(orderGroupAria("To pay", 1)).toBe("To pay, 1 order");
    expect(orderGroupAria("Arrived", 0)).toBe("Arrived, 0 orders");
  });

  it("maps API statuses to one group each", () => {
    expect(orderGroupOf("awaiting_payment")).toBe("to_pay");
    expect(orderGroupOf("at_china_warehouse")).toBe("in_china");
    expect(orderGroupOf("in_customs")).toBe("in_transit");
    expect(orderGroupOf("delivered")).toBe("arrived");
    expect(orderGroupOf("something_new")).toBeUndefined();
  });

  it("keeps a known ?status and drops anything else", () => {
    expect(ordersSearchSchema.parse({ status: "in_china" })).toEqual({ status: "in_china" });
    expect(ordersSearchSchema.parse({ status: "lost" })).toEqual({ status: undefined });
  });
});
