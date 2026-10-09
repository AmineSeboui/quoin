import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./cn";
import { SQUARE_TAP_TARGET_FLOOR, TAP_TARGET_FLOOR } from "./touch-target";

/** Class variants for the button primitive, reusable on other elements. */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,border-color,box-shadow,opacity] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 shrink-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 dark:bg-destructive/60 dark:hover:bg-destructive/75",
        outline:
          "border border-input bg-transparent shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: `h-9 px-4 py-2 has-[>svg]:px-3 ${TAP_TARGET_FLOOR}`,
        xs: `h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3 ${TAP_TARGET_FLOOR}`,
        sm: `h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5 ${TAP_TARGET_FLOOR}`,
        lg: `h-10 rounded-md px-6 has-[>svg]:px-4 ${TAP_TARGET_FLOOR}`,
        icon: `size-9 ${SQUARE_TAP_TARGET_FLOOR}`,
        "icon-xs": `size-6 rounded-md [&_svg:not([class*='size-'])]:size-3 ${SQUARE_TAP_TARGET_FLOOR}`,
        "icon-sm": `size-8 ${SQUARE_TAP_TARGET_FLOOR}`,
        "icon-lg": `size-10 ${SQUARE_TAP_TARGET_FLOOR}`,
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
