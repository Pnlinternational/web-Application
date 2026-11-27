import { ApiError } from "@/api/errors";
import type { User } from "@/features/auth/schemas";
import type { Address, AddressInput } from "@/features/addresses/schemas";
import type { Favourite } from "@/features/favourites/schemas";
import { formatPrice, MARKET_CURRENCY } from "@/features/market/market";
import type { AppNotification } from "@/features/notifications/schemas";
import type { OrderCounts } from "@/features/orders/status";
import type { Money } from "@/lib/currency";
import type { Market } from "@/lib/phone";
import type {
  IdentityStatus,
  PasswordChange,
  Profile,
  ProfileUpdate,
  WalletSummary,
} from "./schemas";

// In-memory stand-in for API endpoints that don't exist yet (profile, wallet, identity, order
// counts, addresses, favourites, notifications, change password). One store per signed-in user,
// seeded with the design's sample data in that user's currency. Swap each feature's
// get*Service() for a real client when its endpoints ship; nothing else needs to change.

/** Simulated round trip so loading states show; none in tests. */
const LATENCY_MS = import.meta.env.MODE === "test" ? 0 : 300;

/** Current password the mock rejects, to exercise the inline error path. */
export const MOCK_WRONG_PASSWORD = "wrong-password";

interface MockDb {
  profile: Profile;
  wallet: WalletSummary;
  identity: IdentityStatus;
  orderCounts: OrderCounts;
  addresses: Address[];
  favourites: Favourite[];
  notifications: AppNotification[];
}

const dbs = new Map<string, MockDb>();
let nextId = 1;

export function mockId(prefix: string) {
  return `${prefix}-${nextId++}`;
}

export function mockLatency() {
  return new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));
}

/** Copies, so callers can't mutate the store through returned objects. */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

function money(market: Market, major: number): Money {
  // Both NGN and GHS have two minor digits.
  return { amount: Math.round(major * 100), currency: MARKET_CURRENCY[market] };
}

const SAMPLES = {
  NG: {
    phones: ["+2348031234567", "+2348031234568"],
    addresses: [
      ["12 Sample Street", "Ikeja", "Lagos"],
      ["4 Example Close", "Victoria Island", "Lagos"],
    ],
    prices: [39_000, 36_900, 14_800],
    wallet: [24_500, 6_000],
  },
  GH: {
    phones: ["+233241234567", "+233241234568"],
    addresses: [
      ["12 Sample Street", "Osu", "Greater Accra"],
      ["4 Example Close", "Airport Residential", "Greater Accra"],
    ],
    prices: [390, 369, 148],
    wallet: [245, 60],
  },
} as const;

function minutesAgo(now: number, minutes: number) {
  return new Date(now - minutes * 60_000).toISOString();
}

function seed(user: User): MockDb {
  const { market } = user;
  const sample = SAMPLES[market];
  const now = Date.now();
  const [home, work] = sample.addresses;
  const [sneakers, headphones, lamp] = sample.prices;

  return {
    profile: {
      name: "Ada Okafor",
      email: "ada@example.com",
      emailVerified: false,
      phone: user.phone,
      market,
      customerId: `${market}000123`,
    },
    wallet: { balance: money(market, sample.wallet[0]), pending: money(market, sample.wallet[1]) },
    identity: "verified",
    orderCounts: { to_pay: 1, in_china: 2, in_transit: 1, arrived: 0 },
    addresses: [
      {
        id: "addr-home",
        label: "home",
        recipient: "Ada Okafor",
        phone: sample.phones[0],
        street: home[0],
        area: home[1],
        region: home[2],
        landmark: "",
        isDefault: true,
      },
      {
        id: "addr-work",
        label: "work",
        recipient: "Ada Okafor",
        phone: sample.phones[1],
        street: work[0],
        area: work[1],
        region: work[2],
        landmark: "",
        isDefault: false,
      },
    ],
    favourites: [
      {
        productId: "p-sneakers",
        slug: "running-sneakers",
        name: "Running sneakers",
        store: "Taobao",
        price: money(market, sneakers),
        imageUrl: "/assets/samples/sneakers.svg",
      },
      {
        productId: "p-headphones",
        slug: "wireless-headphones",
        name: "Wireless headphones",
        store: "AliExpress",
        price: money(market, headphones),
        imageUrl: "/assets/samples/headphones.svg",
      },
      {
        productId: "p-lamp",
        slug: "desk-lamp",
        name: "Desk lamp",
        store: "Pinduoduo",
        price: money(market, lamp),
        imageUrl: "/assets/samples/desk-lamp.svg",
      },
    ],
    notifications: [
      {
        id: "n-1",
        group: "orders",
        title: "Your items reached the China warehouse",
        body: "Photos are ready. Check your items.",
        createdAt: minutesAgo(now, 12),
        read: false,
        destination: { kind: "order", orderId: "o-1001" },
      },
      {
        id: "n-2",
        group: "orders",
        title: "Choose your packing option",
        body: "We need this to confirm your freight.",
        createdAt: minutesAgo(now, 60),
        read: false,
        destination: { kind: "order", orderId: "o-1002" },
      },
      {
        id: "n-3",
        group: "promotions",
        title: "Audio deals from China",
        body: "See this week's picks on headphones and speakers.",
        createdAt: minutesAgo(now, 180),
        read: false,
        destination: { kind: "promotion", promotionId: "promo-audio" },
      },
      {
        id: "n-4",
        group: "wallet",
        title: "Refund added to your wallet",
        body: `${formatPrice(money(market, sample.wallet[1]))} for a cancelled order.`,
        createdAt: minutesAgo(now, 26 * 60),
        read: true,
        destination: { kind: "wallet_transaction", transactionId: "t-501" },
      },
      {
        id: "n-5",
        group: "support",
        title: "Support replied to your ticket",
        body: "Tap to read the reply.",
        createdAt: minutesAgo(now, 28 * 60),
        read: true,
        destination: { kind: "ticket", ticketId: "tk-77" },
      },
      {
        id: "n-6",
        group: "orders",
        title: "Shipment left for Lagos",
        body: "Your parcel is in transshipment.",
        createdAt: minutesAgo(now, 24 * 24 * 60),
        read: true,
        destination: { kind: "order", orderId: "o-0990" },
      },
    ],
  };
}

export function mockDb(user: User): MockDb {
  let db = dbs.get(user.id);
  if (!db) {
    db = seed(user);
    dbs.set(user.id, db);
  }
  return db;
}

/** Tests: start every case from the seed data. */
export function resetMockBackend() {
  dbs.clear();
  nextId = 1;
}

/** Tests: replace one user's data (e.g. an empty address list). */
export function editMockDb(user: User, edit: (db: MockDb) => void) {
  edit(mockDb(user));
}

export function mockNotFound(what: string) {
  return new ApiError({ status: 404, code: "not_found", message: `${what} not found` });
}

export async function mockGetProfile(user: User) {
  await mockLatency();
  return clone(mockDb(user).profile);
}

export async function mockUpdateProfile(user: User, update: ProfileUpdate) {
  await mockLatency();
  const db = mockDb(user);
  const email = update.email.trim();
  db.profile = {
    ...db.profile,
    name: update.name.trim(),
    email,
    // A new email needs confirming again.
    emailVerified: email === db.profile.email ? db.profile.emailVerified : false,
  };
  return clone(db.profile);
}

export async function mockChangePassword(_user: User, change: PasswordChange) {
  await mockLatency();
  if (change.currentPassword === MOCK_WRONG_PASSWORD) {
    throw new ApiError({
      status: 401,
      code: "auth.invalid_credentials",
      message: "That isn't your current password.",
    });
  }
}

export function mockAddAddress(user: User, input: AddressInput) {
  const db = mockDb(user);
  const address: Address = { ...input, id: mockId("addr") };
  applyDefault(db, address);
  db.addresses.push(address);
  return address;
}

/** The server owns which address is the default: exactly one, the first one added by default. */
export function applyDefault(db: MockDb, changed: Address) {
  if (
    db.addresses.length === 0 ||
    (db.addresses.length === 1 && db.addresses[0]?.id === changed.id)
  ) {
    changed.isDefault = true;
  }
  if (changed.isDefault) {
    for (const address of db.addresses) {
      if (address.id !== changed.id) address.isDefault = false;
    }
  }
}
