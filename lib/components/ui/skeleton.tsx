import { cn } from "lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rf-animate-pulse rf-rounded-md rf-bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
