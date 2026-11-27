import type { User } from "@/features/auth/schemas";
import {
  applyDefault,
  clone,
  mockAddAddress,
  mockDb,
  mockLatency,
  mockNotFound,
} from "@/features/account/mock-backend";
import type { Address, AddressInput } from "./schemas";

export interface AddressService {
  list(): Promise<Address[]>;
  get(id: string): Promise<Address>;
  create(input: AddressInput, idempotencyKey: string): Promise<Address>;
  update(id: string, input: AddressInput, idempotencyKey: string): Promise<Address>;
  remove(id: string, idempotencyKey: string): Promise<void>;
  setDefault(id: string, idempotencyKey: string): Promise<void>;
}

// No address endpoints yet: served by the in-memory mock. The server decides the default
// (first address, or the one marked), so callers refetch the list after every change.
export function getAddressService(user: User): AddressService {
  function find(id: string) {
    const address = mockDb(user).addresses.find((item) => item.id === id);
    if (!address) throw mockNotFound("Address");
    return address;
  }

  return {
    async list() {
      await mockLatency();
      return clone(mockDb(user).addresses);
    },
    async get(id) {
      await mockLatency();
      return clone(find(id));
    },
    async create(input) {
      await mockLatency();
      return clone(mockAddAddress(user, input));
    },
    async update(id, input) {
      await mockLatency();
      const address = find(id);
      Object.assign(address, input);
      applyDefault(mockDb(user), address);
      return clone(address);
    },
    async remove(id) {
      await mockLatency();
      const db = mockDb(user);
      const removed = find(id);
      db.addresses = db.addresses.filter((item) => item.id !== id);
      const first = db.addresses[0];
      if (removed.isDefault && first) first.isDefault = true;
    },
    async setDefault(id) {
      await mockLatency();
      const address = find(id);
      address.isDefault = true;
      applyDefault(mockDb(user), address);
    },
  };
}
