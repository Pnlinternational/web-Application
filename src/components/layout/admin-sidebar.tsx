import { Brand } from "./brand";
import { NavLink } from "./nav-link";

const links = [
  { to: "/admin", label: "Dashboard", exact: true },
  { to: "/admin/products", label: "Products", exact: false },
  { to: "/admin/orders", label: "Orders", exact: false },
  { to: "/admin/customers", label: "Customers", exact: false },
] as const;

export function AdminSidebar({ footer }: { footer?: React.ReactNode }) {
  return (
    <aside className="flex w-60 shrink-0 flex-col gap-6 border-r border-border bg-muted/40 p-4">
      <Brand to="/admin" />
      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} activeOptions={{ exact: link.exact }}>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto">{footer}</div>
    </aside>
  );
}
