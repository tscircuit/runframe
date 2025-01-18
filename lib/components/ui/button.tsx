import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "lib/lib/utils"

const buttonVariants = cva(
  "rf-inline-flex rf-items-center rf-justify-center rf-gap-2 rf-whitespace-nowrap rf-rounded-md rf-text-sm rf-font-medium rf-ring-offset-background rf-transition-colors focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-ring focus-visible:rf-ring-offset-2 disabled:rf-pointer-events-none disabled:rf-opacity-50 [&_svg]:rf-pointer-events-none [&_svg]:rf-size-4 [&_svg]:rf-shrink-0",
  {
    variants: {
      variant: {
        default:
          "rf-bg-primary rf-text-primary-foreground hover:rf-bg-primary/90",
        destructive:
          "rf-bg-destructive rf-text-destructive-foreground hover:rf-bg-destructive/90",
        outline:
          "rf-border rf-border-input rf-bg-background hover:rf-bg-accent hover:rf-text-accent-foreground",
        secondary:
          "rf-bg-secondary rf-text-secondary-foreground hover:rf-bg-secondary/80",
        ghost: "hover:rf-bg-accent hover:rf-text-accent-foreground",
        link: "rf-text-primary rf-underline-offset-4 hover:rf-underline",
      },
      size: {
        default: "rf-h-10 rf-px-4 rf-py-2",
        sm: "rf-h-9 rf-rounded-md rf-px-3",
        lg: "rf-h-11 rf-rounded-md rf-px-8",
        icon: "rf-h-10 rf-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
