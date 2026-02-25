interface SubconsciousLogoProps {
  size?: number;
  showText?: boolean;
  textClass?: string;
}

export default function SubconsciousLogo({
  size = 28,
  showText = true,
  textClass = "",
}: SubconsciousLogoProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <defs>
          <linearGradient
            id="sc-bg"
            x1="0"
            y1="0"
            x2="32"
            y2="32"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FF5C28" />
            <stop offset="1" stopColor="#FF8F6B" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#sc-bg)" />
        <path
          d="M12 22a8 8 0 0 1 0-12"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M15.5 20a5 5 0 0 1 0-8"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />
        <path
          d="M19 18a2.5 2.5 0 0 1 0-4"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        <circle cx="21" cy="16" r="1.6" fill="white" />
      </svg>
      {showText && (
        <span
          className={`font-semibold tracking-tight ${textClass}`}
          style={{ color: "var(--foreground)" }}
        >
          Subconscious
        </span>
      )}
    </span>
  );
}
