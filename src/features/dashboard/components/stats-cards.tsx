import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/currency";
import { formatNumber } from "@/lib/format";
import { useDashboardStats } from "../queries";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-card p-5">
      <p className="text-body-sm text-muted">{label}</p>
      <p className="mt-1 font-heading text-h2 tabular-nums">{value}</p>
    </div>
  );
}

export function StatsCards() {
  const { data } = useDashboardStats();

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Revenue" value={formatMoney(data.revenue)} />
      <StatCard label="Orders" value={formatNumber(data.orders)} />
      <StatCard label="Customers" value={formatNumber(data.customers)} />
    </div>
  );
}

export function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {["revenue", "orders", "customers"].map((key) => (
        <Skeleton key={key} className="h-[86px]" />
      ))}
    </div>
  );
}
