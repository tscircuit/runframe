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
  errorsList,
  onReportAutoroutingLog,
}: {
  code?: string
  autoroutingLog?: Record<string, { simpleRouteJson: any }>
  isStreaming?: boolean
  errorsList:
    | {
        errorTitle: string
        errorMessage: string
      }[]
    | null
  onReportAutoroutingLog?: (
    name: string,
    data: { simpleRouteJson: any },
  ) => void
}) => {
  if (!errorsList) {
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

  const [currentErrorIndex, setCurrentErrorIndex] = useState(0)

  const handlePrev = () => {
    setCurrentErrorIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNext = () => {
    setCurrentErrorIndex((prev) => Math.min(prev + 1, errorsList.length - 1))
  }
  return (
    <>
      <div className="rf-w-[95%] rf-mx-auto">
        {/* Navigation positioned above the border */}
        <div className="rf-flex rf-items-center rf-gap-2 rf-mb-2">
          <button
            className="rf-p-1 rf-rounded-sm rf-transition-colors"
            onClick={handlePrev}
            disabled={currentErrorIndex === 0}
          >
            <ChevronLeft className="rf-h-4 rf-w-4 rf-text-red-500" />
          </button>
          <button
            className="rf-p-1 rf-rounded-sm rf-transition-colors"
            onClick={handleNext}
            disabled={currentErrorIndex === errorsList.length - 1}
          >
            <ChevronRight className="rf-h-4 rf-w-4 rf-text-red-500" />
          </button>
          <span>
            {currentErrorIndex + 1} of {errorsList.length} error
          </span>
        </div>

        {/* Error details */}
        <div className="rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200 rf-max-h-[500px] rf-overflow-y-auto rf-px-2">
          <div className="rf-p-4">
            <h3 className="rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-1">
              {errorsList[currentErrorIndex].errorTitle}
            </h3>
            <p className="rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600">
              {errorsList[currentErrorIndex].errorMessage}
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
              .map((e) => `${e.errorTitle}: ${e.errorMessage}`)
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
              .map((e) => e.errorTitle)
              .join(" ")
              .replace(/[^a-zA-Z0-9 ]/g, " ")
              .replace(/\s+/g, " ")
              .slice(0, 100)}`
            const url = createSnippetUrl(code ?? "")
            let body = `[Snippet code to reproduce](${url})

### Error
\`\`\`
${errorsList
  .map((e) => `${e.errorTitle}: ${e.errorMessage}`)
  .join("\n")
  .slice(0, 600)}
\`\`\``
            if (body.length > 4000) {
              body = `\`\`\`tsx\n// Please paste the code here\`\`\`\n\n### Error\n\`\`\`\n${errorsList
                .map((e) => `${e.errorTitle}: ${e.errorMessage}`)
                .join("\n")
                .slice(0, 2000)}\n\`\`\``
            }
            window.open(
              `https://github.com/tscircuit/tscircuit.com/issues/new?title=${encodeURIComponent(
                title,
              )}&body=${encodeURIComponent(body)}`,
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
