import { Button } from "@hackert-ui/ui";
import { formatDate, formatRelative } from "@/lib/format";
import type { Device } from "../schemas";

const PLATFORM_LABELS: Record<string, string> = { android: "Android", ios: "iPhone", web: "Web" };

interface DeviceListProps {
  devices: readonly Device[];
  /** Id of the row being signed out, if any. */
  pendingId?: string;
  revokingOthers?: boolean;
  onRevoke: (id: string) => void;
  onRevokeOthers: () => void;
}

export function DeviceList({
  devices,
  pendingId,
  revokingOthers = false,
  onRevoke,
  onRevokeOthers,
}: DeviceListProps) {
  const hasOthers = devices.some((device) => !device.current);

  return (
    <div className="flex w-full flex-col gap-3">
      <ul className="flex flex-col divide-y divide-divider rounded-lg border border-divider">
        {devices.map((device) => (
          <li key={device.id} className="flex items-center justify-between gap-3 p-3">
            <div className="flex flex-col text-body-sm">
              <span className="font-medium">
                {(device.platform && PLATFORM_LABELS[device.platform]) ?? "Unknown device"}
                {device.current ? (
                  <span className="ml-2 rounded-xs bg-success/15 px-2 py-0.5 text-badge text-success">
                    This device
                  </span>
                ) : null}
              </span>
              <span className="text-caption text-muted">
                Signed in {formatDate(device.created_at)} · Active{" "}
                {formatRelative(device.last_refreshed_at)}
              </span>
            </div>
            {device.current ? null : (
              <Button
                variant="danger"
                size="sm"
                radius="md"
                loading={pendingId === device.id}
                onClick={() => onRevoke(device.id)}
              >
                Sign out
              </Button>
            )}
          </li>
        ))}
      </ul>
      {hasOthers ? (
        <Button
          variant="danger"
          size="sm"
          radius="md"
          className="self-start"
          loading={revokingOthers}
          onClick={onRevokeOthers}
        >
          Sign out other devices
        </Button>
      ) : null}
    </div>
  );
}
