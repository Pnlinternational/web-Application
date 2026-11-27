import type { User } from "@/features/auth/schemas";
import type { OrderCounts } from "@/features/orders/status";
import {
  clone,
  mockChangePassword,
  mockDb,
  mockGetProfile,
  mockLatency,
  mockUpdateProfile,
} from "./mock-backend";
import type {
  IdentityStatus,
  PasswordChange,
  Profile,
  ProfileUpdate,
  WalletSummary,
} from "./schemas";

export interface AccountService {
  getProfile(): Promise<Profile>;
  updateProfile(update: ProfileUpdate, idempotencyKey: string): Promise<Profile>;
  /** Balance and pending amount come from the server; the app never calculates them. */
  getWallet(): Promise<WalletSummary>;
  getIdentityStatus(): Promise<IdentityStatus>;
  getOrderCounts(): Promise<OrderCounts>;
  changePassword(change: PasswordChange, idempotencyKey: string): Promise<void>;
}

// No API endpoints yet (GET me has no name/email; no wallet, KYC status, order or password
// endpoints): served by the in-memory mock. Replace with axios calls through `endpoints.me`.
export function getAccountService(user: User): AccountService {
  return {
    getProfile: () => mockGetProfile(user),
    updateProfile: (update) => mockUpdateProfile(user, update),
    async getWallet() {
      await mockLatency();
      return clone(mockDb(user).wallet);
    },
    async getIdentityStatus() {
      await mockLatency();
      return mockDb(user).identity;
    },
    async getOrderCounts() {
      await mockLatency();
      return clone(mockDb(user).orderCounts);
    },
    changePassword: (change) => mockChangePassword(user, change),
  };
}
