import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "rf-z-50 rf-w-72 rf-rounded-md rf-border rf-border-zinc-200 rf-bg-white rf-p-4 rf-text-zinc-950 rf-shadow-md rf-outline-none data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[side=bottom]:rf-slide-in-from-top-2 data-[side=left]:rf-slide-in-from-right-2 data-[side=right]:rf-slide-in-from-left-2 data-[side=top]:rf-slide-in-from-bottom-2 rf-origin-[--radix-popover-content-transform-origin] dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:rf-text-zinc-50",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
