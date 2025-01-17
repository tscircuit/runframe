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
      "rf-inline-flex rf-h-10 rf-items-center rf-justify-center rf-rounded-md rf-bg-slate-100 rf-p-1 rf-text-slate-500 dark:rf-bg-slate-800 dark:rf-text-slate-400",
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
      "rf-inline-flex rf-items-center rf-justify-center rf-whitespace-nowrap rf-rounded-sm rf-px-3 rf-py-1.5 rf-text-sm rf-font-medium rf-ring-offset-white rf-transition-all focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-slate-950 focus-visible:rf-ring-offset-2 disabled:rf-pointer-events-none disabled:rf-opacity-50 data-[state=active]:rf-bg-white data-[state=active]:rf-text-slate-950 data-[state=active]:rf-shadow-sm dark:rf-ring-offset-slate-950 dark:focus-visible:rf-ring-slate-300 dark:data-[state=active]:rf-bg-slate-950 dark:data-[state=active]:rf-text-slate-50",
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
      "rf-mt-2 rf-ring-offset-white focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-slate-950 focus-visible:rf-ring-offset-2 dark:rf-ring-offset-slate-950 dark:focus-visible:rf-ring-slate-300",
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
