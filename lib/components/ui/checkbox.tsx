import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "rf-peer rf-h-4 rf-w-4 rf-shrink-0 rf-rounded-sm rf-border rf-border-zinc-200 rf-border-zinc-900 rf-shadow focus-visible:rf-outline-none focus-visible:rf-ring-1 focus-visible:rf-ring-zinc-950 disabled:rf-cursor-not-allowed disabled:rf-opacity-50 data-[state=checked]:rf-bg-zinc-900 data-[state=checked]:rf-text-zinc-50 dark:rf-border-zinc-800 dark:rf-border-zinc-50 dark:focus-visible:rf-ring-zinc-300 dark:data-[state=checked]:rf-bg-zinc-50 dark:data-[state=checked]:rf-text-zinc-900",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "rf-flex rf-items-center rf-justify-center rf-text-current",
      )}
    >
      <Check className="rf-h-4 rf-w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
