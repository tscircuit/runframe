import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "rf-relative rf-h-2 rf-w-full rf-overflow-hidden rf-rounded-full rf-bg-zinc-100 dark:rf-bg-zinc-800",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="rf-h-full rf-w-full rf-flex-1 rf-bg-zinc-900 rf-transition-all dark:rf-bg-zinc-50"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = "Progress"

export { Progress }