import * as React from "react"

import { cn } from "lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "rf-flex rf-h-9 rf-w-full rf-rounded-md rf-border rf-border-zinc-200 rf-bg-white rf-px-3 rf-py-1 rf-text-sm rf-shadow-sm rf-transition-colors file:rf-border-0 file:rf-bg-transparent file:rf-text-sm file:rf-font-medium placeholder:rf-text-zinc-500 focus-visible:rf-outline-none focus-visible:rf-ring-1 focus-visible:rf-ring-zinc-950 disabled:rf-cursor-not-allowed disabled:rf-opacity-50 dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:rf-placeholder-zinc-400 dark:focus-visible:rf-ring-zinc-300",
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = "Input"

export { Input }
