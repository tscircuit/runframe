import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"

import { cn } from "lib/utils/index"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      "rf-fixed rf-inset-0 rf-z-50 rf-bg-black/80 data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0",
      className,
    )}
    {...props}
    ref={ref}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showOverlay?: boolean
  }
>(({ className, children, showOverlay = true, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay className={cn(showOverlay ? "" : "rf-hidden")} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "rf-fixed rf-left-[50%] rf-top-[50%] rf-z-50 rf-grid rf-w-full rf-max-w-lg rf-translate-x-[-50%] rf-translate-y-[-50%] rf-gap-4 rf-border rf-border-zinc-200 rf-bg-white rf-p-6 rf-shadow-lg rf-duration-200 data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[state=closed]:rf-slide-out-to-left-1/2 data-[state=closed]:rf-slide-out-to-top-[48%] data-[state=open]:rf-slide-in-from-left-1/2 data-[state=open]:rf-slide-in-from-top-[48%] sm:rf-rounded-lg dark:rf-border-zinc-800 dark:rf-bg-zinc-950",
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rf-flex rf-flex-col rf-space-y-2 rf-text-center sm:rf-text-left",
      className,
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "rf-flex rf-flex-col-reverse sm:rf-flex-row sm:rf-justify-end sm:rf-space-x-2",
      className,
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("rf-text-lg rf-font-semibold", className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn(
      "rf-text-sm rf-text-zinc-500 dark:rf-text-zinc-400",
      className,
    )}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
