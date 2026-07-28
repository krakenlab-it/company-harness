import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva("btn", {
  variants: {
    variant: {
      primary: "btn-primary",
      ghost: "btn-ghost",
      danger: "btn-danger",
      outline:
        "bg-transparent border border-[var(--border)] text-foam hover:bg-[var(--surface-muted)]",
    },
    size: {
      sm: "btn-sm",
      md: "",
      lg: "btn-lg",
      icon: "h-9 w-9 p-0",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export { Button, buttonVariants };
