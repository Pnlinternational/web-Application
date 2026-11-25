import { Link } from "@tanstack/react-router";
import { useSession } from "@/features/auth/queries";
import { NavLink } from "./nav-link";

// GET /me has no name, so the avatar shows a person icon rather than initials.
export function AccountNav() {
  const { data: user } = useSession();

  // undefined: still loading, or the check failed; claim neither signed in nor out.
  if (user === undefined) return <span aria-hidden="true" className="ml-2 size-10" />;
  if (!user) return <NavLink to="/login">Sign in</NavLink>;

  return (
    <Link
      to="/account"
      aria-label="Account"
      className="ml-2 grid size-10 place-items-center rounded-full bg-primary text-primary-foreground transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-primary-hover active:scale-[0.97]"
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="7.5" r="5" />
        <path d="M12 14c-4.6 0-8 2.5-8.9 6.2A1.5 1.5 0 0 0 4.6 22h14.8a1.5 1.5 0 0 0 1.5-1.8C20 16.5 16.6 14 12 14Z" />
      </svg>
    </Link>
  );
}
