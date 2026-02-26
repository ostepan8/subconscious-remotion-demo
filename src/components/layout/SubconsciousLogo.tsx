import Image from "next/image";

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
      <Image
        src="/brand/Subconscious_Logo_Graphic.svg"
        alt="Subconscious"
        width={size}
        height={size}
        className="shrink-0"
        priority
      />
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
