import { type ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/cn";

interface DialogProps {
  open: boolean;
  /** Escape, Cancel and (for plain dialogs) a backdrop click all call this. */
  onClose: () => void;
  title: string;
  description?: ReactNode;
  /** alertdialog for confirmations: no backdrop dismiss. */
  role?: "dialog" | "alertdialog";
  children: ReactNode;
  className?: string;
}

function show(dialog: HTMLDialogElement) {
  // jsdom has no showModal; the attribute keeps tests working.
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function hide(dialog: HTMLDialogElement) {
  if (typeof dialog.close === "function") dialog.close();
  else dialog.removeAttribute("open");
}

/**
 * Modal dialog on the native <dialog>: showModal() makes the page behind inert (focus stays
 * inside) and Escape closes it. Focus goes to `[data-autofocus]` on open and back to the
 * trigger on close. Motion lives in app.css (.app-dialog).
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  role = "dialog",
  children,
  className,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const isOpen = dialog.hasAttribute("open");

    if (open && !isOpen) {
      returnFocusTo.current = document.activeElement as HTMLElement | null;
      show(dialog);
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    } else if (!open && isOpen) {
      hide(dialog);
      returnFocusTo.current?.focus();
    }
  }, [open]);

  // Unmounting while open (e.g. navigating away) still hands focus back.
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.hasAttribute("open")) returnFocusTo.current?.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      role={role}
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (role === "dialog" && event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "app-dialog m-auto w-[calc(100%-3rem)] max-w-110 rounded-2xl bg-card p-5 text-ink shadow-xl",
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h2 id={titleId} className="text-bar-title">
          {title}
        </h2>
        {description ? (
          <p id={descriptionId} className="mb-2 text-body-sm text-muted">
            {description}
          </p>
        ) : null}
        {children}
      </div>
    </dialog>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Disables both buttons and shows a spinner on confirm, so a confirm can't be sent twice. */
  pending?: boolean;
  tone?: "danger" | "primary";
}

/** Two-button confirmation (Addresses/Security mobile designs): cancel left, action right. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  pending = false,
  tone = "danger",
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!pending) onCancel();
      }}
      title={title}
      description={description}
      role="alertdialog"
    >
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          data-autofocus
          disabled={pending}
          onClick={onCancel}
          className="h-12 rounded-md border border-border bg-card text-body-sm font-semibold text-ink transition-[background-color,transform] duration-150 ease-out hover-pointer:bg-surface active:scale-[0.97] disabled:opacity-60"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          disabled={pending}
          aria-busy={pending || undefined}
          onClick={onConfirm}
          className={cn(
            "flex h-12 items-center justify-center gap-2 rounded-md text-body-sm font-bold transition-[background-color,transform] duration-150 ease-out active:scale-[0.97] disabled:opacity-80",
            tone === "danger"
              ? "bg-danger text-danger-foreground"
              : "bg-primary text-primary-foreground hover-pointer:bg-primary-hover",
          )}
        >
          {pending ? (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent [animation-duration:600ms]"
            />
          ) : null}
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
