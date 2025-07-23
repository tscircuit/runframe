import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { ClipboardIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "lib/components/ui/button"
import { createSnippetUrl } from "@tscircuit/create-snippet-url"
import { AutoroutingLogOptions } from "./AutoroutingLogOptions"
import { useState, useMemo } from "react"
import type { CircuitJsonError } from "circuit-json"
import { encodeFsMapToUrlHash } from "lib/utils"

interface UnifiedError {
  type: string
  message: string
  stack?: string
  source: "execution" | "circuitJson"
}

export const ErrorTabContent = ({
  code,
  autoroutingLog,
  circuitJsonErrors,
  circuitJsonWarnings,
  fsMap,
  onReportAutoroutingLog,
  errorMessage,
  errorStack,
  circuitJson,
  evalVersion,
}: {
  code?: string
  fsMap?: Map<string, string>
  autoroutingLog?: Record<string, { simpleRouteJson: any }>
  isStreaming?: boolean
  circuitJsonErrors?: CircuitJsonError[] | null
  circuitJsonWarnings?: CircuitJsonError[] | null
  errorMessage?: string | null
  errorStack?: string | null
  circuitJson?: any
  evalVersion?: string | undefined
  onReportAutoroutingLog?: (
    name: string,
    data: { simpleRouteJson: any },
  ) => void
}) => {
  const unifiedErrors = useMemo<UnifiedError[]>(() => {
    const errors: UnifiedError[] = []

    if (errorMessage) {
      errors.push({
        type: "Execution Error",
        message: errorMessage,
        stack: errorStack || undefined,
        source: "execution",
      })
    }

    if (circuitJsonErrors && circuitJsonErrors.length > 0) {
      for (const error of circuitJsonErrors) {
        errors.push({
          type: error.type || "Circuit JSON Error",
          message: error.message || "No error message available",
          stack: (error as any).stack || "",
          source: "circuitJson",
        })
      }
    }

    return errors
  }, [errorMessage, errorStack, circuitJsonErrors])

  const softwareUsedString = useMemo(() => {
    if (!circuitJson || !Array.isArray(circuitJson)) return undefined
    const metadata = (circuitJson as any[]).find(
      (el) => el.type === "source_project_metadata",
    ) as { software_used_string?: string } | undefined
    return metadata?.software_used_string
  }, [circuitJson])

  const unifiedWarnings = useMemo<UnifiedError[]>(() => {
    const warnings: UnifiedError[] = []

    if (circuitJsonWarnings && circuitJsonWarnings.length > 0) {
      for (const warning of circuitJsonWarnings) {
        warnings.push({
          type: warning.type || "Circuit JSON Warning",
          message: warning.message || "No warning message available",
          stack: (warning as any).stack || "",
          source: "circuitJson",
        })
      }
    }

    return warnings
  }, [circuitJsonWarnings])

  const [currentErrorIndex, setCurrentErrorIndex] = useState(0)
  const [currentWarningIndex, setCurrentWarningIndex] = useState(0)

  if (unifiedErrors.length === 0 && unifiedWarnings.length === 0) {
    return (
      <div className="px-2">
        <div className="rf-mt-4 rf-bg-green-50 rf-rounded-md rf-border rf-border-green-200">
          <div className="rf-p-4">
            <h3 className="rf-text-lg rf-font-semibold rf-text-green-800 rf-mb-3">
              No errors or warnings!
            </h3>
            <p className="rf-text-sm rf-text-green-700">
              Your code is running without any errors or warnings.
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

  const handlePrevError = () => {
    setCurrentErrorIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNextError = () => {
    setCurrentErrorIndex((prev) => Math.min(prev + 1, unifiedErrors.length - 1))
  }

  const handlePrevWarning = () => {
    setCurrentWarningIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleNextWarning = () => {
    setCurrentWarningIndex((prev) =>
      Math.min(prev + 1, unifiedWarnings.length - 1),
    )
  }

  const currentError = unifiedErrors[currentErrorIndex]
  const currentWarning = unifiedWarnings[currentWarningIndex]

  return (
    <>
      <div className="rf-w-[95%] rf-mx-auto">
        {unifiedErrors.length > 1 && (
          <div className="rf-flex rf-items-center rf-gap-2 rf-mb-2">
            <button
              type="button"
              className="rf-p-1 rf-rounded-sm rf-transition-colors"
              onClick={handlePrevError}
              disabled={currentErrorIndex === 0}
            >
              <ChevronLeft className="rf-h-4 rf-w-4 rf-text-red-500" />
            </button>
            <button
              type="button"
              className="rf-p-1 rf-rounded-sm rf-transition-colors"
              onClick={handleNextError}
              disabled={currentErrorIndex === unifiedErrors.length - 1}
            >
              <ChevronRight className="rf-h-4 rf-w-4 rf-text-red-500" />
            </button>
            <span className="rf-text-sm rf-text-red-600">
              {currentErrorIndex + 1} of {unifiedErrors.length} errors
            </span>
          </div>
        )}

        {currentError && (
          <div className="rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200 rf-max-h-[500px] rf-overflow-y-auto rf-px-2">
            <div className="rf-p-4">
              <h3 className="rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-1">
                {currentError.type}
              </h3>
              <p className="rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600">
                {currentError.message}
              </p>
              {(currentError.stack || evalVersion || softwareUsedString) && (
                <details
                  style={{ whiteSpace: "pre-wrap" }}
                  className="rf-text-xs rf-font-mono rf-text-red-600 rf-mt-2"
                >
                  {evalVersion && `@tscircuit/eval@${evalVersion}\n`}
                  {softwareUsedString && `${softwareUsedString}\n`}
                  {currentError.stack}
                </details>
              )}
            </div>
          </div>
        )}

        {unifiedWarnings.length > 0 && (
          <>
            {unifiedWarnings.length > 1 && (
              <div className="rf-flex rf-items-center rf-gap-2 rf-mb-2 rf-mt-4">
                <button
                  type="button"
                  className="rf-p-1 rf-rounded-sm rf-transition-colors"
                  onClick={handlePrevWarning}
                  disabled={currentWarningIndex === 0}
                >
                  <ChevronLeft className="rf-h-4 rf-w-4 rf-text-orange-500" />
                </button>
                <button
                  type="button"
                  className="rf-p-1 rf-rounded-sm rf-transition-colors"
                  onClick={handleNextWarning}
                  disabled={currentWarningIndex === unifiedWarnings.length - 1}
                >
                  <ChevronRight className="rf-h-4 rf-w-4 rf-text-orange-500" />
                </button>
                <span className="rf-text-sm rf-text-orange-600">
                  {currentWarningIndex + 1} of {unifiedWarnings.length} warnings
                </span>
              </div>
            )}
            {currentWarning && (
              <div className="rf-mt-4 rf-bg-orange-50 rf-rounded-md rf-border rf-border-orange-200 rf-max-h-[500px] rf-overflow-y-auto rf-px-2">
                <div className="rf-p-4">
                  <h3 className="rf-text-lg rf-font-semibold rf-text-orange-800 rf-mb-1">
                    {currentWarning.type}
                  </h3>
                  <p className="rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-orange-600">
                    {currentWarning.message}
                  </p>
                  {currentWarning.stack && (
                    <details
                      style={{ whiteSpace: "pre-wrap" }}
                      className="rf-text-xs rf-font-mono rf-text-orange-600 rf-mt-2"
                    >
                      {currentWarning.stack}
                    </details>
                  )}
                </div>
              </div>
            )}
          </>
        )}
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
            let errorText = `${currentError.type}: ${currentError.message}`
            if (evalVersion) errorText += `\n@tscircuit/eval@${evalVersion}`
            if (softwareUsedString) errorText += `\n${softwareUsedString}`
            if (currentError.stack) errorText += `\n${currentError.stack}`
            navigator.clipboard.writeText(errorText)
            alert("Error copied to clipboard!")
          }}
        >
          <ClipboardIcon className="rf-w-4 rf-h-4" />
          Copy Error
        </Button>
        <Button
          variant="outline"
          className="rf-p-1"
          onClick={() => {
            const title = `Error ${currentError.type}`
              .replace(/[^a-zA-Z0-9 ]/g, " ")
              .replace(/\s+/g, " ")
              .slice(0, 100)

            const url = fsMap
              ? encodeFsMapToUrlHash(Object.fromEntries(fsMap))
              : createSnippetUrl(code ?? "")
            let errorDetails = `${currentError.type}: ${currentError.message}`
            if (evalVersion) errorDetails += `\n@tscircuit/eval@${evalVersion}`
            if (softwareUsedString) errorDetails += `\n${softwareUsedString}`
            if (currentError.stack) errorDetails += `\n${currentError.stack}`

            let body = `[Package code to reproduce](${url})\n\n### Error\n\`\`\`\n${errorDetails}\n\`\`\`\n`
            if (body.length > 35000) {
              const truncatedMessage =
                currentError.message.length > 500
                  ? `${currentError.message.slice(0, 500)}...`
                  : currentError.message
              body = `[Package code to reproduce](${url})\n\n### Error\n\`\`\`\n${currentError.type}: ${truncatedMessage}\n\`\`\``
            }

            const issueUrl = `https://github.com/tscircuit/tscircuit.com/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`
            window.open(issueUrl, "_blank")
          }}
        >
          <GitHubLogoIcon className="rf-w-4 rf-h-4" />
          Report Issue
        </Button>
      </div>
    </>
  )
}
