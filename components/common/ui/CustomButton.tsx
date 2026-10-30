import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";

export type CustomButtonVariant = "primary" | "cancel" | "save";
export type CustomButtonType = "button" | "submit";
export type CustomButtonSize = "md" | "lg";

export interface CustomButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: CustomButtonVariant;
  type?: CustomButtonType;
  size?: CustomButtonSize;
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const PRIMARY_MD_CLASS =
  "flex items-center gap-2 px-4.5 py-2.75 rounded-[14px] bg-linear-to-b from-[#F4977E] to-[#EE8164] text-white font-extrabold text-[14.5px] shadow-[0_8px_18px_-8px_rgba(238,129,100,0.7)] transition duration-150 hover:cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-8px_rgba(238,129,100,0.85)] active:translate-y-0";

const PRIMARY_LG_CLASS =
  "w-full p-3.75 rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] text-white font-extrabold text-[16px] shadow-[0_10px_22px_-8px_rgba(238,129,100,0.7)] transition duration-150 hover:cursor-pointer hover:-translate-y-0.5";

const CANCEL_CLASS =
  "text-[15px] font-bold text-mute transition-colors duration-150 hover:cursor-pointer hover:text-tinta";

const SAVE_CLASS =
  "text-[15px] font-extrabold text-acento transition-colors duration-150 hover:cursor-pointer hover:text-acento-editar";

function variantClass(
  variant: CustomButtonVariant,
  size: CustomButtonSize,
): string {
  switch (variant) {
    case "cancel":
      return CANCEL_CLASS;
    case "save":
      return SAVE_CLASS;
    case "primary":
    default:
      return size === "lg" ? PRIMARY_LG_CLASS : PRIMARY_MD_CLASS;
  }
}

export function CustomButton({
  variant = "primary",
  type = "button",
  size = "md",
  className,
  children,
  ...buttonProps
}: CustomButtonProps) {
  return (
    <button
      type={type}
      className={[variantClass(variant, size), className]
        .filter(Boolean)
        .join(" ")}
      {...buttonProps}
    >
      {children}
    </button>
  );
}
