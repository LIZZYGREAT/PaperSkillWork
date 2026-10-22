import type { ButtonHTMLAttributes, ReactNode } from "react";

type NativeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

export type ButtonProps = NativeButtonProps & {
  variant?: "primary" | "secondary" | "quiet" | "danger";
  size?: "small" | "medium";
} & (
  | { iconOnly: true; "aria-label": string; children: ReactNode }
  | { iconOnly?: false; children: ReactNode }
);

export function Button({ variant = "primary", size = "medium", iconOnly = false, className = "", type = "button", children, ...props }: ButtonProps) {
  return (
    <button type={type} className={`rk-button rk-button--${variant} rk-button--${size} ${iconOnly ? "rk-button--icon-only" : ""} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
