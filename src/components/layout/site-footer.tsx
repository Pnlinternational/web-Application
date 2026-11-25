export function SiteFooter() {
  return (
    <footer className="border-t border-divider">
      <div className="mx-auto max-w-6xl px-4 py-8 text-body-sm text-muted">
        © {new Date().getFullYear()} PNL Store
      </div>
    </footer>
  );
}
