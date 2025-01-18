import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "lib/lib/utils"

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "rf-flex rf-cursor-default rf-gap-2 rf-select-none rf-items-center rf-rounded-sm rf-px-2 rf-py-1.5 rf-text-sm rf-outline-none focus:rf-bg-accent data-[state=open]:rf-bg-accent [&_svg]:rf-pointer-events-none [&_svg]:rf-size-4 [&_svg]:rf-shrink-0",
      inset && "rf-pl-8",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronRight className="rf-ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "rf-z-50 rf-min-w-[8rem] rf-overflow-hidden rf-rounded-md rf-border rf-bg-popover rf-p-1 rf-text-popover-foreground rf-shadow-lg data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[side=bottom]:rf-slide-in-from-top-2 data-[side=left]:rf-slide-in-from-right-2 data-[side=right]:rf-slide-in-from-left-2 data-[side=top]:rf-slide-in-from-bottom-2",
      className,
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "rf-z-50 rf-min-w-[8rem] rf-overflow-hidden rf-rounded-md rf-border rf-bg-popover rf-p-1 rf-text-popover-foreground rf-shadow-md data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[side=bottom]:rf-slide-in-from-top-2 data-[side=left]:rf-slide-in-from-right-2 data-[side=right]:rf-slide-in-from-left-2 data-[side=top]:rf-slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "rf-relative rf-flex rf-cursor-default rf-select-none rf-items-center rf-gap-2 rf-rounded-sm rf-px-2 rf-py-1.5 rf-text-sm rf-outline-none rf-transition-colors focus:rf-bg-accent focus:rf-text-accent-foreground data-[disabled]:rf-pointer-events-none data-[disabled]:rf-opacity-50 [&_svg]:rf-pointer-events-none [&_svg]:rf-size-4 [&_svg]:rf-shrink-0",
      inset && "rf-pl-8",
      className,
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "rf-relative rf-flex rf-cursor-default rf-select-none rf-items-center rf-rounded-sm rf-py-1.5 rf-pl-8 rf-pr-2 rf-text-sm rf-outline-none rf-transition-colors focus:rf-bg-accent focus:rf-text-accent-foreground data-[disabled]:rf-pointer-events-none data-[disabled]:rf-opacity-50",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="rf-absolute rf-left-2 rf-flex rf-h-3.5 rf-w-3.5 rf-items-center rf-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="rf-h-4 rf-w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "rf-relative rf-flex rf-cursor-default rf-select-none rf-items-center rf-rounded-sm rf-py-1.5 rf-pl-8 rf-pr-2 rf-text-sm rf-outline-none rf-transition-colors focus:rf-bg-accent focus:rf-text-accent-foreground data-[disabled]:rf-pointer-events-none data-[disabled]:rf-opacity-50",
      className,
    )}
    {...props}
  >
    <span className="rf-absolute rf-left-2 rf-flex rf-h-3.5 rf-w-3.5 rf-items-center rf-justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="rf-h-2 rf-w-2 rf-fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "rf-px-2 rf-py-1.5 rf-text-sm rf-font-semibold",
      inset && "rf-pl-8",
      className,
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("rf--mx-1 rf-my-1 rf-h-px rf-bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "rf-ml-auto rf-text-xs rf-tracking-widest rf-opacity-60",
        className,
      )}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
