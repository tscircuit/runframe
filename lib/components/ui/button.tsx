import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "lib/utils"

const buttonVariants = cva(
  "rf-inline-flex rf-items-center rf-justify-center rf-gap-2 rf-whitespace-nowrap rf-rounded-md rf-text-sm rf-font-medium rf-transition-colors focus-visible:rf-outline-none focus-visible:rf-ring-1 focus-visible:rf-ring-zinc-950 disabled:rf-pointer-events-none disabled:rf-opacity-50 [&_svg]:rf-pointer-events-none [&_svg]:rf-size-4 [&_svg]:rf-shrink-0 dark:focus-visible:rf-ring-zinc-300",
  {
    variants: {
      variant: {
        default:
          "rf-bg-zinc-900 rf-text-zinc-50 rf-shadow hover:rf-bg-zinc-900/90 dark:rf-bg-zinc-50 dark:rf-text-zinc-900 dark:hover:rf-bg-zinc-50/90",
        destructive:
          "rf-bg-red-500 rf-text-zinc-50 rf-shadow-sm hover:rf-bg-red-500/90 dark:rf-bg-red-900 dark:rf-text-zinc-50 dark:hover:rf-bg-red-900/90",
        outline:
          "rf-border rf-border-zinc-200 rf-bg-white rf-shadow-sm hover:rf-bg-zinc-100 hover:rf-text-zinc-900 dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:hover:rf-bg-zinc-800 dark:hover:rf-text-zinc-50",
        secondary:
          "rf-bg-zinc-100 rf-text-zinc-900 rf-shadow-sm hover:rf-bg-zinc-100/80 dark:rf-bg-zinc-800 dark:rf-text-zinc-50 dark:hover:rf-bg-zinc-800/80",
        ghost:
          "hover:rf-bg-zinc-100 hover:rf-text-zinc-900 dark:hover:rf-bg-zinc-800 dark:hover:rf-text-zinc-50",
        link: "rf-text-zinc-900 rf-underline-offset-4 hover:rf-underline dark:rf-text-zinc-50",
      },
      size: {
        default: "rf-h-9 rf-px-4 rf-py-2",
        sm: "rf-h-8 rf-rounded-md rf-px-3 rf-text-xs",
        lg: "rf-h-10 rf-rounded-md rf-px-8",
        icon: "rf-h-9 rf-w-9",
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
