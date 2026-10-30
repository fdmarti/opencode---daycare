import type { InputHTMLAttributes, Ref } from "react";

export type CustomInputType = "text" | "email" | "password" | "number" | "date";
export type CustomInputVariant = "field" | "bare";

export interface CustomInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  type?: CustomInputType;
  variant?: CustomInputVariant;
  label?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
  ref?: Ref<HTMLInputElement>;
}

const FIELD_INPUT_CLASS =
  "w-full p-[13px_16px] rounded-[14px] border-[1.5px] bg-white text-[15px] text-tinta";

const BARE_INPUT_CLASS = "flex-1 border-none bg-none text-[15px] text-tinta";

const LABEL_CLASS = "block text-[12px] font-extrabold tracking-[0.7px] text-mute mb-2";
const ERROR_CLASS = "mt-1.5 mb-0 text-[13px] text-acento";

export function CustomInput({
  type = "text",
  variant = "field",
  label,
  error,
  className,
  inputClassName,
  id,
  ...inputProps
}: CustomInputProps) {
  if (variant === "bare") {
    return (
      <input
        id={id}
        type={type}
        className={[BARE_INPUT_CLASS, inputClassName]
          .filter(Boolean)
          .join(" ")}
        {...inputProps}
      />
    );
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={LABEL_CLASS}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        aria-invalid={error ? true : undefined}
        className={[FIELD_INPUT_CLASS, error ? "border-acento" : "border-[#EADFD0]", inputClassName]
          .filter(Boolean)
          .join(" ")}
        {...inputProps}
      />
      {error && <p className={ERROR_CLASS}>{error}</p>}
    </div>
  );
}
