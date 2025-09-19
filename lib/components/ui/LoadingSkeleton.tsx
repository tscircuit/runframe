interface LoadingSkeletonProps {
  message?: string
}

export const LoadingSkeleton = ({
  message = "Loading files...",
}: LoadingSkeletonProps) => {
  return (
    <div className="rf-flex rf-flex-col rf-w-full rf-h-full">
      <div className="rf-flex rf-items-center rf-gap-4 rf-p-2 rf-border-b">
        <div className="rf-w-20 rf-h-9 rf-bg-gray-200 dark:rf-bg-gray-700 rf-rounded-md rf-animate-pulse" />
        <div className="rf-flex rf-gap-6 rf-ml-auto">
          {["PCB", "Schematic", "3D"].map((_, i) => (
            <div
              key={i}
              className="rf-h-6 rf-w-20 rf-bg-gray-200 dark:rf-bg-gray-700 rf-rounded rf-animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="rf-flex-1 rf-p-4">
        <div className="rf-w-full rf-h-full rf-rounded-lg rf-bg-gray-100 dark:rf-bg-gray-800 rf-animate-pulse rf-flex rf-items-center rf-justify-center">
          <div className="rf-flex rf-flex-col rf-items-center rf-gap-4">
            <div className="rf-text-sm rf-text-gray-400 dark:rf-text-gray-500">
              {message}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
