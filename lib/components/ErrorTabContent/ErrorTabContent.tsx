import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { ClipboardIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "lib/components/ui/button"
import { createSnippetUrl } from "@tscircuit/create-snippet-url"
import { AutoroutingLogOptions } from "./AutoroutingLogOptions"
import { useMemo, useState } from "react"

export const ErrorTabContent = ({
  code,
  autoroutingLog,
  isStreaming,
  errorMessages,
  onReportAutoroutingLog,
}: {
  code?: string
  autoroutingLog?: Record<string, { simpleRouteJson: any }>
  isStreaming?: boolean
  errorMessages?:
    | {
        phase?: string
        componentDisplayName?: string
        error?: string
        stack?: string
        errorType?: string
      }[]
    | null
  onReportAutoroutingLog?: (
    name: string,
    data: { simpleRouteJson: any },
  ) => void
}) => {
  // Compute formatted errors list: heading is formatted from errorType, message from error
  const errorsList = useMemo(() => {
    if (!errorMessages) return []
    return errorMessages.map((em) => {
      const rawType = em.errorType || ""
      const heading = rawType
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
      const message = em.error || ""
      return { heading, message }
    })
  }, [errorMessages])

  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, errorsList.length - 1))
  }

  if (errorsList.length === 0) {
    return (
      <div className="px-2">
        <div className="rf-mt-4 rf-bg-green-50 rf-rounded-md rf-border rf-border-green-200">
          <div className="rf-p-4">
            <h3 className="rf-text-lg rf-font-semibold rf-text-green-800 rf-mb-3">
              No Errors 👌
            </h3>
            <p className="rf-text-sm rf-text-green-700">
              Your code is running without any errors.
            </p>
          </div>
        </div>
        <div className="rf-mt-4">
          <AutoroutingLogOptions
            autoroutingLog={autoroutingLog}
            onReportAutoroutingLog={onReportAutoroutingLog}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rf-w-[95%] rf-mx-auto">
        {/* Navigation positioned above the border */}
        <div className="rf-flex rf-items-center rf-gap-2 rf-mb-2">
          <button
            className="rf-p-1  rf-rounded-sm rf-transition-colors"
            onClick={handlePrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="rf-h-4 rf-w-4 rf-text-red-500" />
          </button>
          <button
            className="rf-p-1  rf-rounded-sm rf-transition-colors"
            onClick={handleNext}
            disabled={currentIndex === errorsList.length - 1}
          >
            <ChevronRight className="rf-h-4 rf-w-4 rf-text-red-500" />
          </button>
          <span>
            {currentIndex + 1} of {errorsList.length} error
          </span>
        </div>

        {/* Error details */}
        <div className="rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200 rf-max-h-[500px] rf-overflow-y-auto rf-px-2">
          <div className="rf-p-4">
            <h3 className="rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-1">
              {errorsList[currentIndex].heading}
            </h3>
            <p className="rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600">
              {errorsList[currentIndex].message}
            </p>
          </div>
        </div>
      </div>
      <div className="rf-flex rf-gap-2 rf-mt-4 rf-justify-end">
        <AutoroutingLogOptions
          autoroutingLog={autoroutingLog}
          onReportAutoroutingLog={onReportAutoroutingLog}
        />
        <Button
          variant="outline"
          className="rf-p-1"
          onClick={() => {
            const combined = errorsList
              .map((e) => `${e.heading}: ${e.message}`)
              .join("\n")
            navigator.clipboard.writeText(combined)
            alert("Errors copied to clipboard!")
          }}
        >
          <ClipboardIcon className="rf-w-4 rf-h-4" />
          Copy Errors
        </Button>
        <Button
          variant="outline"
          className="rf-p-1"
          onClick={() => {
            const title = `Error: ${errorsList
              .map((e) => e.heading)
              .join(" ")
              .replace(/[^a-zA-Z0-9 ]/g, " ")
              .replace(/\s+/g, " ")
              .slice(0, 100)}`
            const url = createSnippetUrl(code ?? "")
            let body = `[Snippet code to reproduce](${url})

### Error
\`\`\`
${errorsList
  .map((e) => `${e.heading}: ${e.message}`)
  .join("\n")
  .slice(0, 600)}
\`\`\``
            if (body.length > 4000) {
              body = `\`\`\`tsx\n// Please paste the code here\`\`\`\n\n### Error\n\`\`\`\n${errorsList
                .map((e) => `${e.heading}: ${e.message}`)
                .join("\n")
                .slice(0, 2000)}\n\`\`\``
            }
            window.open(
              `https://github.com/tscircuit/tscircuit.com/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`,
              "_blank",
            )
          }}
        >
          <GitHubLogoIcon className="rf-w-4 rf-h-4" />
          Report Issue
        </Button>
      </div>
    </>
  )
}
