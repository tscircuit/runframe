import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import * as React from "react"

import { cn } from "lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "rf-flex rf-h-10 rf-w-full rf-items-center rf-justify-between rf-rounded-md rf-border rf-border-input rf-bg-background rf-px-3 rf-py-2 rf-text-sm rf-ring-offset-background rf-placeholder:text-muted-foreground focus:rf-outline-none focus:rf-ring-2 focus:rf-ring-ring focus:rf-ring-offset-2 disabled:rf-cursor-not-allowed disabled:rf-opacity-50 [&>span]:rf-line-clamp-1",
      className,
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="rf-h-4 rf-w-4 rf-opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "rf-flex rf-cursor-default rf-items-center rf-justify-center rf-py-1",
      className,
    )}
    {...props}
  >
    <ChevronUp className="rf-h-4 rf-w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "rf-flex rf-cursor-default rf-items-center rf-justify-center rf-py-1",
      className,
    )}
    {...props}
  >
    <ChevronDown className="rf-h-4 rf-w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "rf-relative rf-z-[100] rf-max-h-96 rf-min-w-[8rem] rf-overflow-hidden rf-rounded-md rf-border rf-bg-white rf-text-black rf-shadow-md data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[side=bottom]:rf-slide-in-from-top-2 data-[side=left]:rf-slide-in-from-right-2 data-[side=right]:rf-slide-in-from-left-2 data-[side=top]:rf-slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:rf-translate-y-1 data-[side=left]:-rf-translate-x-1 data-[side=right]:rf-translate-x-1 data-[side=top]:-rf-translate-y-1",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "rf-p-1",
          position === "popper" &&
            "rf-h-[var(--radix-select-trigger-height)] rf-w-full rf-min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "rf-py-1.5 rf-pl-8 rf-pr-2 rf-text-sm rf-font-semibold",
      className,
    )}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "rf-relative rf-flex rf-w-full rf-cursor-default rf-select-none rf-items-center rf-rounded-sm rf-py-1.5 rf-pl-8 rf-pr-2 rf-text-sm rf-text-gray-800 rf-outline-none focus:rf-bg-gray-100 focus:rf-text-gray-900 data-[disabled]:rf-pointer-events-none data-[disabled]:rf-opacity-50",
      className,
    )}
    {...props}
  >
    <span className="rf-absolute rf-left-2 rf-flex rf-h-3.5 rf-w-3.5 rf-items-center rf-justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="rf-h-4 rf-w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-rf-mx-1 rf-my-1 rf-h-px rf-bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
