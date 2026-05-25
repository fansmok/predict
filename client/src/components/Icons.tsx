interface IconProps {
  size?: number;
  className?: string;
}

export function IconBall({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3v18M3 12h18" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      <path d="M5.6 5.6c2.8 1.6 4.4 4 4.4 6.4s-1.6 4.8-4.4 6.4M18.4 5.6c-2.8 1.6-4.4 4-4.4 6.4s1.6 4.8 4.4 6.4" stroke="currentColor" strokeWidth="1.2" opacity="0.7" />
    </svg>
  );
}

export function IconTarget({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

export function IconTrophy({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 4h12v3a6 6 0 01-12 0V4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 7H4a2 2 0 002 2M18 7h2a2 2 0 01-2 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 13v3M8 20h8M9 16h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconUser({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 20c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconSquad({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="16" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8.5L12 11.5M16 8.5L12 11.5M12 16.5V19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6 20h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconLogo({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#logoGrad)" />
      <circle cx="12" cy="12" r="6" stroke="white" strokeWidth="1.5" opacity="0.9" />
      <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="1" opacity="0.5" />
      <defs>
        <linearGradient id="logoGrad" x1="2" y1="2" x2="22" y2="22">
          <stop stopColor="#10b981" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function IconCrown({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 18h16l-1.5-10-4 4-2.5-5-2.5 5-4-4L4 18z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M4 18v2h16v-2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconMedal({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="15" r="5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 3l3 5 3-5M7 3h4M13 3h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconBoot({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 14l2-6h8l2 6v4H4v-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 8V6a2 2 0 012-2h0a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="16" cy="17" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function IconChevronDown({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCheck({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconPass({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13 8l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="12" r="2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconShield({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3L5 6v6c0 4.2 3 7.5 7 9 4-1.5 7-4.8 7-9V6l-7-3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconRedCard({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="6" y="4" width="12" height="16" rx="2" fill="currentColor" opacity="0.22" />
      <rect x="6" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function IconGoalConceded({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 8h16v10H4V8z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4 8l2-4h12l2 4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M8 8v10M16 8v10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
      <circle cx="12" cy="13" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function IconGlove({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M8 10V6a2 2 0 0 1 4 0v1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10 7V5a2 2 0 0 1 4 0v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 10V4a2 2 0 0 1 4 0v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6 10v2a6 6 0 0 0 12 0v-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 20h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconGlobe({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M3 12h18M12 3c2.5 2.8 4 5.6 4 9s-1.5 6.2-4 9M12 3c-2.5 2.8-4 5.6-4 9s1.5 6.2 4 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconFriends({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 20c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 13.5c2.2.4 4 2 4 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function IconLink({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M10 14a4 4 0 0 1 0-5.7l1.3-1.3a4 4 0 0 1 5.7 5.7l-1 1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M14 10a4 4 0 0 1 0 5.7l-1.3 1.3a4 4 0 0 1-5.7-5.7l1-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconCopy({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 15V6a2 2 0 0 1 2-2h9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IconDice({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" />
      <circle cx="15" cy="9" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="9" cy="15" r="1.2" fill="currentColor" />
      <circle cx="15" cy="15" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function IconFlask({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 3h6v5l5 9a3 3 0 01-2.6 4.5H6.6A3 3 0 014 17l5-9V3z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 7h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
