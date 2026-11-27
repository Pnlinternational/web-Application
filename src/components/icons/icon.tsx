// Filled 24×24 glyphs from the design canvas (renderVals `P` maps). Colour comes from currentColor.
const PATHS = {
  home: "M3 9.3 12 3l9 6.3V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  person:
    "M12 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10zM3.1 20.2C4 16.5 7.4 14 12 14s8 2.5 8.9 6.2A1.5 1.5 0 0 1 19.4 22H4.6a1.5 1.5 0 0 1-1.5-1.8z",
  pin: "M12 2a7.5 7.5 0 0 0-7.5 7.5c0 5.2 6.2 11.3 6.9 12a.8.8 0 0 0 1.2 0c.7-.7 6.9-6.8 6.9-12A7.5 7.5 0 0 0 12 2zm0 10a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z",
  heart: "M12 21S3 15.7 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.7-9 12-9 12z",
  bell: "M12 2a7 7 0 0 0-7 7c0 3.2-.8 5-1.6 6.1-.7 1-.1 2.4 1.2 2.4h14.8c1.3 0 1.9-1.4 1.2-2.4C19.8 14 19 12.2 19 9a7 7 0 0 0-7-7zM9.3 19.2a.8.8 0 0 0-.7 1.1 3.7 3.7 0 0 0 6.8 0 .8.8 0 0 0-.7-1.1z",
  lock: "M7 10V8a5 5 0 0 1 10 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2zm2 0h6V8a3 3 0 0 0-6 0z",
  shield: "M12 2l8 3v6c0 5.5-3.5 9.5-8 11-4.5-1.5-8-5.5-8-11V5z",
  shieldCheck:
    "M12 2l8 3v6c0 5.5-3.5 9.5-8 11-4.5-1.5-8-5.5-8-11V5zm-1 13.4 5.7-5.7-1.4-1.4-4.3 4.3-2.3-2.3-1.4 1.4z",
  doc: "M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z",
  chat: "M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
  wallet:
    "M4 5h15a2 2 0 0 1 2 2v1h-5a4 4 0 0 0 0 8h5v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm12 5h6v4h-6a2 2 0 1 1 0-4z",
  box: "M12 2.5 3.8 6.8 12 11.2l8.2-4.4zM2.8 8.5v8.2a1 1 0 0 0 .5.9l7.7 4v-9zM21.2 8.5v8.2a1 1 0 0 1-.5.9l-7.7 4v-9z",
  truck:
    "M2 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2h3l3 4v4a2 2 0 0 1-2 2h-.2a3 3 0 0 1-5.6 0H9.8a3 3 0 0 1-5.6 0H4a2 2 0 0 1-2-2z",
  refund:
    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM11 7l-4.5 4.5L11 16v-3h3a2 2 0 0 1 0 4h-1v2h1a4 4 0 0 0 0-8h-3z",
  ticket:
    "M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4z",
  edit: "M15.7 3.3a2.5 2.5 0 0 1 3.5 0l1.5 1.5a2.5 2.5 0 0 1 0 3.5L9 20l-5.5 1a.8.8 0 0 1-.9-.9L3.6 15z",
  locate:
    "M21.6 2.4a1 1 0 0 0-1.1-.2l-18 8a1 1 0 0 0 .2 1.9l7.7 1.5 1.5 7.7a1 1 0 0 0 1.9.2l8-18a1 1 0 0 0-.2-1.1z",
  trash:
    "M9 2a2 2 0 0 0-2 2v1H3.5a1 1 0 0 0 0 2H5l.9 13.1A2 2 0 0 0 7.9 22h8.2a2 2 0 0 0 2-1.9L19 7h1.5a1 1 0 1 0 0-2H17V4a2 2 0 0 0-2-2zm0 2h6v1H9z",
  grid: "M5.4 3h3.4a2.4 2.4 0 0 1 2.4 2.4v3.4a2.4 2.4 0 0 1-2.4 2.4H5.4A2.4 2.4 0 0 1 3 8.8V5.4A2.4 2.4 0 0 1 5.4 3zm9.8 0h3.4A2.4 2.4 0 0 1 21 5.4v3.4a2.4 2.4 0 0 1-2.4 2.4h-3.4a2.4 2.4 0 0 1-2.4-2.4V5.4A2.4 2.4 0 0 1 15.2 3zM5.4 12.8h3.4a2.4 2.4 0 0 1 2.4 2.4v3.4A2.4 2.4 0 0 1 8.8 21H5.4A2.4 2.4 0 0 1 3 18.6v-3.4a2.4 2.4 0 0 1 2.4-2.4zm9.8 0h3.4a2.4 2.4 0 0 1 2.4 2.4v3.4a2.4 2.4 0 0 1-2.4 2.4h-3.4a2.4 2.4 0 0 1-2.4-2.4v-3.4a2.4 2.4 0 0 1 2.4-2.4z",
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 24, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path fillRule="evenodd" d={PATHS[name]} />
    </svg>
  );
}

/** Stroked chevron (list rows) and back arrow (mobile bars). */
export function ChevronRightIcon({ size = 16, className }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function BackArrowIcon({ size = 24, className }: Omit<IconProps, "name">) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </svg>
  );
}
