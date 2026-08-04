interface IconProps {
  size?: number;
}

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function ChatIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M20 12a7.5 7.5 0 01-11 6.6L5 20l1.4-3.8A7.5 7.5 0 1120 12z" />
    </svg>
  );
}

export function MicIcon({ size = 26 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0013 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

export function StopIcon({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="7" y="7" width="10" height="10" rx="2.5" fill="currentColor" />
    </svg>
  );
}

export function PhoneIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M6.5 3.5h3l1.5 4-2 1.4a10.5 10.5 0 005.1 5.1l1.4-2 4 1.5v3a1.5 1.5 0 01-1.7 1.5A15.5 15.5 0 015 5.2 1.5 1.5 0 016.5 3.5z" />
    </svg>
  );
}

export function PhoneOffIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M6.5 3.5h3l1.5 4-2 1.4a10.5 10.5 0 005.1 5.1l1.4-2 4 1.5v3a1.5 1.5 0 01-1.7 1.5A15.5 15.5 0 015 5.2 1.5 1.5 0 016.5 3.5z" />
      <path d="M3.5 20.5L20.5 3.5" />
    </svg>
  );
}

export function SendIcon({ size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M4.5 12l15-7-6.2 15-1.9-6.1-6.9-1.9z" />
    </svg>
  );
}

export function ArticleIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M6 3.5h8.5L19 8v12.5H6z" />
      <path d="M14 3.5V8h5" />
      <path d="M9 12.5h6M9 16h4" />
    </svg>
  );
}

export function LockIcon({ size = 15 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
      <path d="M8.5 10.5V7.8a3.5 3.5 0 017 0v2.7" />
    </svg>
  );
}

export function ToolIcon({ size = 13 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
      <path d="M14.5 6.5a3.5 3.5 0 004.6 4.6L21 13l-8 8-2-2 8-8" />
      <path d="M9.5 17.5L4 12a3.5 3.5 0 014.6-4.6" />
    </svg>
  );
}
