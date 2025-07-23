import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "lib/utils"
import { Dialog, DialogContent } from "lib/components/ui/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "rf-flex rf-h-full rf-w-full rf-flex-col rf-overflow-hidden rf-rounded-md rf-bg-white rf-text-zinc-950 dark:rf-bg-zinc-950 dark:rf-text-zinc-50",
      className,
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="rf-overflow-hidden rf-p-0">
        <Command className="[&_[cmdk-group-heading]]:rf-px-2 [&_[cmdk-group-heading]]:rf-font-medium [&_[cmdk-group-heading]]:rf-text-zinc-500 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:rf-pt-0 [&_[cmdk-group]]:rf-px-2 [&_[cmdk-input-wrapper]_svg]:rf-h-5 [&_[cmdk-input-wrapper]_svg]:rf-w-5 [&_[cmdk-input]]:rf-h-12 [&_[cmdk-item]]:rf-px-2 [&_[cmdk-item]]:rf-py-3 [&_[cmdk-item]_svg]:rf-h-5 [&_[cmdk-item]_svg]:rf-w-5 dark:[&_[cmdk-group-heading]]:rf-text-zinc-400">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div
    className="rf-flex rf-items-center rf-border-b rf-px-3"
    cmdk-input-wrapper=""
  >
    <Search className="rf-mr-2 rf-h-4 rf-w-4 rf-shrink-0 rf-opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "rf-flex rf-h-10 rf-w-full rf-rounded-md rf-bg-transparent rf-py-3 rf-text-sm rf-outline-none placeholder:rf-text-zinc-500 disabled:rf-cursor-not-allowed disabled:rf-opacity-50 dark:placeholder:rf-text-zinc-400",
        className,
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn(
      "rf-max-h-[300px] rf-overflow-y-auto rf-overflow-x-hidden",
      className,
    )}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="rf-py-6 rf-text-center rf-text-sm"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "rf-overflow-hidden rf-p-1 rf-text-zinc-950 [&_[cmdk-group-heading]]:rf-px-2 [&_[cmdk-group-heading]]:rf-py-1.5 [&_[cmdk-group-heading]]:rf-text-xs [&_[cmdk-group-heading]]:rf-font-medium [&_[cmdk-group-heading]]:rf-text-zinc-500 dark:rf-text-zinc-50 dark:[&_[cmdk-group-heading]]:rf-text-zinc-400",
      className,
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn(
      "rf--mx-1 rf-h-px rf-bg-zinc-200 dark:rf-bg-zinc-800",
      className,
    )}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "rf-relative rf-flex rf-cursor-default rf-gap-2 rf-select-none rf-items-center rf-rounded-sm rf-px-2 rf-py-1.5 rf-text-sm rf-outline-none data-[disabled=true]:rf-pointer-events-none data-[selected=true]:rf-bg-zinc-100 data-[selected=true]:rf-text-zinc-900 data-[disabled=true]:rf-opacity-50 [&_svg]:rf-pointer-events-none [&_svg]:rf-size-4 [&_svg]:rf-shrink-0 dark:data-[selected=true]:rf-bg-zinc-800 dark:data-[selected=true]:rf-text-zinc-50",
      className,
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "rf-ml-auto rf-text-xs rf-tracking-widest rf-text-zinc-500 dark:rf-text-zinc-400",
        className,
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
