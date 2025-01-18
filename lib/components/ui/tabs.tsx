"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "rf-inline-flex rf-h-9 rf-items-center rf-justify-center rf-rounded-lg rf-bg-neutral-100 rf-p-1 rf-text-neutral-500 dark:rf-bg-neutral-800 dark:rf-text-neutral-400",
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "rf-inline-flex rf-items-center rf-justify-center rf-whitespace-nowrap rf-rounded-md rf-px-3 rf-py-1 rf-text-sm rf-font-medium rf-ring-offset-white rf-transition-all focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-neutral-950 focus-visible:rf-ring-offset-2 disabled:rf-pointer-events-none disabled:rf-opacity-50 data-[state=active]:rf-bg-white data-[state=active]:rf-text-neutral-950 data-[state=active]:rf-shadow dark:rf-ring-offset-neutral-950 dark:focus-visible:rf-ring-neutral-300 dark:data-[state=active]:rf-bg-neutral-950 dark:data-[state=active]:rf-text-neutral-50",
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "rf-mt-2 rf-ring-offset-white focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-neutral-950 focus-visible:rf-ring-offset-2 dark:rf-ring-offset-neutral-950 dark:focus-visible:rf-ring-neutral-300",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
