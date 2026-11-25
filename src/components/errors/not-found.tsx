import { Link, type LinkProps } from "@tanstack/react-router";

interface NotFoundProps {
  title?: string;
  message?: string;
  homeTo?: LinkProps["to"];
  homeLabel?: string;
}

export function NotFound({
  title = "Page not found",
  message = "The page you're looking for doesn't exist or has moved.",
  homeTo = "/",
  homeLabel = "Back to home",
}: NotFoundProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-24 text-center">
      <p className="text-label text-muted">404</p>
      <h1 className="text-h2">{title}</h1>
      <p className="text-body-sm text-muted">{message}</p>
      <Link
        to={homeTo}
        className="text-label text-primary underline-offset-4 hover-pointer:underline"
      >
        {homeLabel}
      </Link>
    </div>
  );
}
