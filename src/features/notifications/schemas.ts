import { z } from "zod";

export const NOTIFICATION_GROUPS = [
  { id: "orders", label: "Orders", icon: "box" },
  { id: "wallet", label: "Wallet", icon: "wallet" },
  { id: "support", label: "Support", icon: "chat" },
  { id: "promotions", label: "Promotions", icon: "heart" },
] as const;

export type NotificationGroup = (typeof NOTIFICATION_GROUPS)[number]["id"];

// Where tapping a notification goes. Unknown kinds (newer API, older app) only mark it read.
export const destinationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("order"), orderId: z.string() }),
  z.object({ kind: z.literal("wallet_transaction"), transactionId: z.string() }),
  z.object({ kind: z.literal("ticket"), ticketId: z.string() }),
  z.object({ kind: z.literal("promotion"), promotionId: z.string() }),
  z.object({ kind: z.literal("product"), slug: z.string() }),
  z.object({ kind: z.literal("unknown") }),
]);

export type NotificationDestination = z.infer<typeof destinationSchema>;

export const notificationSchema = z.object({
  id: z.string(),
  group: z.enum(["orders", "wallet", "support", "promotions"]),
  title: z.string(),
  body: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
  destination: destinationSchema,
});

export type AppNotification = z.infer<typeof notificationSchema>;
