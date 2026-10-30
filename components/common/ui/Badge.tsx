import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

export type BadgeSize = "sm" | "md";
export type BadgeType = "button" | "submit";

export interface BadgeProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Active state: accent background with white text. Default false. */
  active?: boolean;
  /** "sm" for avatar chips, "md" for pills. Default "md". */
  size?: BadgeSize;
  type?: BadgeType;
  /** Optional leading element, e.g. the recipient avatar. */
  leading?: ReactNode;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const BASE_CLASS =
  "inline-flex items-center rounded-full border-[1.5px] transition-colors duration-150 hover:cursor-pointer";

const ACTIVE_CLASS = "bg-acento border-acento text-white";
const INACTIVE_CLASS = "bg-card border-borde text-nav";

const MD_CLASS = "gap-2 px-4 py-2 text-[13.5px] font-extrabold";

function smClass(hasLeading: boolean): string {
  return hasLeading
    ? "gap-2 py-1.5 pl-1.5 pr-3.5 text-[14px] font-bold"
    : "gap-2 px-3.5 py-1.5 text-[14px] font-bold";
}

export function Badge({
  active = false,
  size = "md",
  type = "button",
  leading,
  className,
  children,
  ...buttonProps
}: BadgeProps) {
  const sizeClass = size === "sm" ? smClass(leading !== undefined) : MD_CLASS;

  return (
    <button
      type={type}
      aria-pressed={active}
      className={[BASE_CLASS, sizeClass, active ? ACTIVE_CLASS : INACTIVE_CLASS, className]
        .filter(Boolean)
        .join(" ")}
      {...buttonProps}
    >
      {leading}
      {children}
    </button>
  );
}
