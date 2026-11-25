import { createIdempotencyKey, withIdempotencyKey } from "@/api/idempotency";
import { QueryBoundary } from "@/components/errors/query-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useRevokeDeviceMutation, useRevokeOtherDevicesMutation } from "../mutations";
import { useDevices } from "../queries";
import { DeviceList } from "./device-list";

function Devices() {
  const { data: devices } = useDevices();
  const revokeOthers = useRevokeOtherDevicesMutation();
  const revoke = useRevokeDeviceMutation();

  return (
    <DeviceList
      devices={devices}
      pendingId={revoke.isPending ? revoke.variables.data.id : undefined}
      revokingOthers={revokeOthers.isPending}
      onRevoke={(id) => revoke.mutate(withIdempotencyKey({ id }))}
      onRevokeOthers={() => revokeOthers.mutate(createIdempotencyKey())}
    />
  );
}

export function DevicesSection() {
  return (
    <section className="flex w-full flex-col gap-3">
      <h2 className="text-section">Signed-in devices</h2>
      <QueryBoundary pending={<Skeleton className="h-24 w-full" />}>
        <Devices />
      </QueryBoundary>
    </section>
  );
}
