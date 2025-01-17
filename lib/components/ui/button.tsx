import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "lib/utils"

const buttonVariants = cva(
  "rf-inline-flex rf-items-center rf-justify-center rf-gap-2 rf-whitespace-nowrap rf-rounded-md rf-text-sm rf-font-medium rf-ring-offset-white rf-transition-colors focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-slate-950 focus-visible:rf-ring-offset-2 disabled:rf-pointer-events-none disabled:rf-opacity-50 [&_svg]:rf-pointer-events-none [&_svg]:rf-size-4 [&_svg]:rf-shrink-0 dark:rf-ring-offset-slate-950 dark:focus-visible:rf-ring-slate-300",
  {
    variants: {
      variant: {
        default:
          "rf-bg-slate-900 rf-text-slate-50 hover:rf-bg-slate-900/90 dark:rf-bg-slate-50 dark:rf-text-slate-900 dark:hover:rf-bg-slate-50/90",
        destructive:
          "rf-bg-red-500 rf-text-slate-50 hover:rf-bg-red-500/90 dark:rf-bg-red-900 dark:rf-text-slate-50 dark:hover:rf-bg-red-900/90",
        outline:
          "rf-border rf-border-slate-200 rf-bg-white hover:rf-bg-slate-100 hover:rf-text-slate-900 dark:rf-border-slate-800 dark:rf-bg-slate-950 dark:hover:rf-bg-slate-800 dark:hover:rf-text-slate-50",
        secondary:
          "rf-bg-slate-100 rf-text-slate-900 hover:rf-bg-slate-100/80 dark:rf-bg-slate-800 dark:rf-text-slate-50 dark:hover:rf-bg-slate-800/80",
        ghost:
          "hover:rf-bg-slate-100 hover:rf-text-slate-900 dark:hover:rf-bg-slate-800 dark:hover:rf-text-slate-50",
        link: "rf-text-slate-900 rf-underline-offset-4 hover:rf-underline dark:rf-text-slate-50",
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
