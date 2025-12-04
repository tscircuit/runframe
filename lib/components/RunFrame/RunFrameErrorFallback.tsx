import { AlertTriangle } from "lucide-react"
import { Button } from "../ui/button"

interface RunFrameErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export const RunFrameErrorFallback = ({
  error,
  resetErrorBoundary,
}: RunFrameErrorFallbackProps) => {
  return (
    <section className="rf-h-full rf-w-full rf-grid rf-place-items-center">
      <div className="rf-min-h-full rf-flex rf-items-center rf-justify-center rf-px-4">
        <div className="rf-max-w-lg rf-w-full rf-text-center">
          <div className="rf-mb-8">
            <div className="rf-inline-flex rf-items-center rf-justify-center rf-w-20 rf-h-20 rf-bg-red-100 rf-rounded-full rf-mb-6">
              <AlertTriangle className="rf-w-10 rf-h-10 rf-text-red-600" />
            </div>
            <h1 className="rf-text-2xl rf-font-bold rf-text-gray-900 rf-mb-3">
              Oops! Something went wrong
            </h1>
            <p className="rf-text-gray-600 rf-mb-4">
              RunFrame encountered an unexpected error.
            </p>
            <pre className="rf-text-xs no-scrollbar rf-font-mono rf-text-left rf-whitespace-pre-wrap rf-text-red-600 rf-bg-red-50 rf-border rf-border-red-200 rf-p-3 rf-rounded-lg rf-mb-4 rf-overflow-auto rf-max-h-[120px]">
              {error.message}
            </pre>
            {error.stack && (
              <details className="rf-text-center rf-mb-6">
                <summary className="rf-text-xs rf-text-gray-500 rf-cursor-pointer hover:rf-text-gray-700">
                  View stack trace
                </summary>
                <pre className="rf-text-xs rf-font-mono no-scrollbar rf-whitespace-pre-wrap rf-text-gray-500 rf-bg-gray-100 rf-p-3 rf-rounded-lg rf-mt-2 rf-overflow-auto rf-text-left rf-max-h-[150px]">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
          <div className="rf-flex rf-flex-col rf-gap-2 rf-justify-center">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => window.location.reload()}
            >
              Refresh Dev Server
            </Button>
            <Button variant="outline" size="lg" onClick={resetErrorBoundary}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
