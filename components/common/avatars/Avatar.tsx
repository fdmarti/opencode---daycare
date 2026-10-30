// Generic kid/parent avatar: gray circle + user icon (same stroke as CuentaIcon).
// Tailwind does not generate interpolated strings; size classes are literals.
type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "w-10 h-10", // 40px (parents list)
  md: "w-12 h-12", // 48px (kids list card)
  lg: "w-[84px] h-[84px]", // 84px (profile header)
};

const iconSize: Record<AvatarSize, number> = {
  sm: 18,
  md: 22,
  lg: 38,
};

export function Avatar({ size = "md" }: { size?: AvatarSize }) {
  return (
    <div
      className={`flex-none rounded-full bg-borde text-placeholder flex items-center justify-center ${sizeClasses[size]}`}
    >
      <svg
        width={iconSize[size]}
        height={iconSize[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}
