import type { PaginationState, SortingState, Updater } from "@tanstack/react-table";
import { createDataTableColumnHelper, DataTable } from "@/components/data-table/data-table";
import { formatMoney } from "@/lib/currency";
import { formatDate } from "@/lib/format";
import type { Paginated } from "@/lib/schemas";
import { type Product, type ProductListParams, productSortFields } from "../schemas";

const column = createDataTableColumnHelper<Product>();

const statusStyles: Record<Product["status"], string> = {
  active: "bg-success/15 text-success",
  draft: "bg-muted text-muted-foreground",
  archived: "bg-danger/10 text-danger",
};

const columns = column.columns([
  column.accessor("name", { header: "Name" }),
  column.accessor("price", {
    header: "Price",
    cell: (info) => <span className="tabular-nums">{formatMoney(info.getValue())}</span>,
  }),
  column.accessor("stock", {
    header: "Stock",
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  column.accessor("status", {
    header: "Status",
    enableSorting: false,
    cell: (info) => (
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[info.getValue()]}`}
      >
        {info.getValue()}
      </span>
    ),
  }),
  column.accessor("createdAt", { header: "Created", cell: (info) => formatDate(info.getValue()) }),
]);

function apply<T>(updater: Updater<T>, current: T) {
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater;
}

function isSortField(id: string): id is (typeof productSortFields)[number] {
  return (productSortFields as readonly string[]).includes(id);
}

interface AdminProductsTableProps {
  page: Paginated<Product>;
  params: ProductListParams;
  onParamsChange: (next: ProductListParams) => void;
}

// Translates between URL params (page is 1-based) and table state (pageIndex is 0-based).
export function AdminProductsTable({ page, params, onParamsChange }: AdminProductsTableProps) {
  const pagination: PaginationState = { pageIndex: params.page - 1, pageSize: params.pageSize };
  const sorting: SortingState = params.sortBy
    ? [{ id: params.sortBy, desc: params.order === "desc" }]
    : [];

  return (
    <DataTable
      caption="Products"
      columns={columns}
      data={page.items}
      rowCount={page.total}
      getRowId={(product) => product.id}
      pagination={pagination}
      onPaginationChange={(updater) => {
        const next = apply(updater, pagination);
        onParamsChange({ ...params, page: next.pageIndex + 1, pageSize: next.pageSize });
      }}
      sorting={sorting}
      onSortingChange={(updater) => {
        const [first] = apply(updater, sorting);
        const sortBy = first && isSortField(first.id) ? first.id : undefined;
        onParamsChange({
          ...params,
          page: 1,
          sortBy,
          order: sortBy ? (first?.desc ? "desc" : "asc") : undefined,
        });
      }}
      emptyMessage="No products yet."
    />
  );
}
