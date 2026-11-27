import { z } from "zod";
import type { IconName } from "@/components/icons/icon";

// The one mapping from order statuses to the four groups on the Account overview and the
// Orders filter. `apiStatuses` is a guess until the API has orders (see CLAUDE_CONTEXT gaps).
export const ORDER_GROUPS = [
  { id: "to_pay", label: "To pay", icon: "wallet", apiStatuses: ["awaiting_payment"] },
  {
    id: "in_china",
    label: "In China",
    icon: "box",
    apiStatuses: ["purchasing", "at_china_warehouse", "packing"],
  },
  { id: "in_transit", label: "In transit", icon: "truck", apiStatuses: ["shipped", "in_customs"] },
  { id: "arrived", label: "Arrived", icon: "pin", apiStatuses: ["arrived", "delivered"] },
] as const satisfies readonly {
  id: string;
  label: string;
  icon: IconName;
  apiStatuses: readonly string[];
}[];

export type OrderGroupId = (typeof ORDER_GROUPS)[number]["id"];

export const ORDER_GROUP_IDS = ORDER_GROUPS.map((group) => group.id) as [
  OrderGroupId,
  ...OrderGroupId[],
];

export type OrderCounts = Record<OrderGroupId, number>;

/** Search schema for /account/orders?status=in_china. Unknown values are dropped. */
export const ordersSearchSchema = z.object({
  status: z.enum(ORDER_GROUP_IDS).optional().catch(undefined),
});

export function orderGroupLabel(id: OrderGroupId) {
  return ORDER_GROUPS.find((group) => group.id === id)?.label ?? id;
}

export function orderGroupOf(apiStatus: string): OrderGroupId | undefined {
  return ORDER_GROUPS.find((group) => (group.apiStatuses as readonly string[]).includes(apiStatus))
    ?.id;
}

/** Screen-reader label for a status shortcut: "In China, 2 orders". */
export function orderGroupAria(label: string, count: number) {
  return `${label}, ${count} ${count === 1 ? "order" : "orders"}`;
}
