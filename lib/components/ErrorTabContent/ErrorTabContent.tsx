import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { ClipboardIcon, ChevronRight, XCircle, AlertCircle } from "lucide-react"
import { Button } from "lib/components/ui/button"
import { createSnippetUrl } from "@tscircuit/create-snippet-url"
import { encodeFsMapToUrlHash } from "lib/utils"
import { AutoroutingLogOptions } from "./AutoroutingLogOptions"
import { useState, useMemo, useEffect } from "react"
import type { CircuitJsonError } from "circuit-json"
import { toast } from "lib/utils/toast"

declare global {
  interface Window {
    __TSCIRCUIT_LAST_EXECUTION_ERROR?: string
  }
}

interface UnifiedError {
  type: string
  message: string
  stack?: string
  source: "execution" | "circuitJson"
}

export const ErrorTabContent = ({
  code,
  fsMap,
  autoroutingLog,
  circuitJsonErrors,
  circuitJsonWarnings,
  onReportAutoroutingLog,
  errorMessage,
  errorStack,
  circuitJson,
  evalVersion,
}: {
  code?: string
  fsMap?: Map<string, string> | Record<string, string>
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

  const packageUrl = () => {
    if (fsMap) {
      try {
        return encodeFsMapToUrlHash(
          fsMap instanceof Map ? Object.fromEntries(fsMap.entries()) : fsMap,
        )
      } catch {}
    }
    return createSnippetUrl(code ?? "")
  }

  const openIssue = (title: string, body: string) => {
    const issueUrl = `https://github.com/tscircuit/tscircuit.com/issues/new?title=${encodeURIComponent(
      title,
    )}&body=${encodeURIComponent(body)}`
    window.open(issueUrl, "_blank")
  }

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
        <div className="rf-flex rf-gap-2 rf-mt-4 rf-justify-end">
          <AutoroutingLogOptions
            autoroutingLog={autoroutingLog}
            onReportAutoroutingLog={onReportAutoroutingLog}
          />
          <Button
            variant="outline"
            className="rf-p-1"
            onClick={() => {
              const url = packageUrl()
              openIssue("Issue Report", `[Package code to reproduce](${url})`)
            }}
          >
            <GitHubLogoIcon className="rf-w-4 rf-h-4" />
            Report Issue
          </Button>
        </div>
      </div>
    )
  }

  // Store execution error globally so bug report dialog can access it
  useEffect(() => {
    if (errorMessage) {
      let errorText = errorMessage
      if (errorStack) {
        errorText += `\n\n${errorStack}`
      }
      if (typeof window !== "undefined") {
        window.__TSCIRCUIT_LAST_EXECUTION_ERROR = errorText
      }
    }
  }, [errorMessage, errorStack])

  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(() => {
    const allIndexes = new Set<number>()
    unifiedErrors.forEach((_, i) => allIndexes.add(i))
    return allIndexes
  })
  const [expandedWarnings, setExpandedWarnings] = useState<Set<number>>(() => {
    const allIndexes = new Set<number>()
    unifiedWarnings.forEach((_, i) => allIndexes.add(i))
    return allIndexes
  })

  const toggleError = (index: number) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleWarning = (index: number) => {
    setExpandedWarnings((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <>
      <div className="rf-w-full">
        {unifiedErrors.length > 0 && (
          <div className="rf-mt-2">
            <div className="rf-text-xs rf-text-red-700 rf-font-semibold rf-px-2 rf-py-1 rf-bg-red-50 rf-border-b rf-border-red-200">
              {unifiedErrors.length}{" "}
              {unifiedErrors.length === 1 ? "error" : "errors"}
            </div>
            {unifiedErrors.map((error, index) => {
              const isExpanded = expandedErrors.has(index)
              const previewMessage = error.message
              const hasDetails =
                error.stack || evalVersion || softwareUsedString

              return (
                <div key={index} className="rf-bg-white hover:rf-bg-red-100">
                  <div
                    className="rf-flex rf-items-start rf-gap-1 rf-px-2 rf-pb-1 rf-cursor-pointer rf-bg-red-50/50"
                    onClick={() => hasDetails && toggleError(index)}
                  >
                    <div
                      className="rf-flex rf-items-center rf-gap-2"
                      style={{ marginTop: "3px" }}
                    >
                      <XCircle className="rf-h-4 rf-w-4 rf-text-red-500 rf-flex-shrink-0" />
                      {hasDetails && (
                        <ChevronRight
                          className={`rf-h-3 rf-w-3 rf-text-red-500 rf-flex-shrink-0 rf-transition-transform ${isExpanded ? "rf-rotate-90" : ""}`}
                        />
                      )}
                    </div>
                    <div className="rf-flex-1 rf-min-w-0 rf-leading-[1rem]">
                      <span className="rf-text-xs rf-font-mono rf-text-red-700 rf-leading-[0.95rem]">
                        {error.type}:
                      </span>
                      <span className="rf-text-xs rf-font-mono rf-text-red-600 rf-ml-1 rf-leading-[0.95rem]">
                        {error.message}
                      </span>
                    </div>
                  </div>
                  {isExpanded && hasDetails && (
                    <div className="rf-bg-red-50/50 rf-pl-12">
                      {error.stack
                        ?.split("\n")
                        .filter((line) => line.trim())
                        .slice(1)
                        .map((line, i) => (
                          <div key={i} className="rf-px-2 rf-leading-tight">
                            <span className="rf-text-xs rf-font-mono rf-text-red-500">
                              {line}
                            </span>
                          </div>
                        ))}
                      {(evalVersion || softwareUsedString) && (
                        <div className="rf-px-2">
                          <span className="rf-text-xs rf-font-mono rf-text-red-400">
                            {evalVersion && `@tscircuit/eval@${evalVersion}`}
                            {evalVersion && softwareUsedString && " • "}
                            {softwareUsedString}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {unifiedWarnings.length > 0 && (
          <div className="rf-mt-2">
            <div className="rf-text-xs rf-text-orange-700 rf-font-semibold rf-px-2 rf-py-1 rf-bg-orange-50 rf-border-b rf-border-orange-200">
              {unifiedWarnings.length}{" "}
              {unifiedWarnings.length === 1 ? "warning" : "warnings"}
            </div>
            {unifiedWarnings.map((warning, index) => {
              const isExpanded = expandedWarnings.has(index)
              const previewMessage = warning.message
              const hasDetails = !!warning.stack

              return (
                <div key={index} className="rf-bg-white hover:rf-bg-orange-100">
                  <div
                    className="rf-flex rf-items-center rf-gap-2 rf-px-2 rf-py-1 rf-cursor-pointer rf-bg-orange-50/50"
                    onClick={() => hasDetails && toggleWarning(index)}
                  >
                    <AlertCircle className="rf-h-4 rf-w-4 rf-text-orange-500 rf-flex-shrink-0" />
                    {hasDetails && (
                      <ChevronRight
                        className={`rf-h-3 rf-w-3 rf-text-orange-500 rf-flex-shrink-0 rf-transition-transform ${isExpanded ? "rf-rotate-90" : ""}`}
                      />
                    )}
                    <div className="rf-flex-1 rf-min-w-0 rf-flex rf-items-center rf-flex-wrap">
                      <span className="rf-text-xs rf-font-mono rf-text-orange-700 rf-break-words">
                        {warning.type}:
                      </span>
                      <span className="rf-text-xs rf-font-mono rf-text-orange-600 rf-ml-1 rf-break-words">
                        {warning.message}
                      </span>
                    </div>
                  </div>
                  {isExpanded && hasDetails && (
                    <div className="rf-bg-orange-50/50 rf-pl-12">
                      {warning.stack
                        ?.split("\n")
                        .filter((line) => line.trim())
                        .slice(1)
                        .map((line, i) => (
                          <div key={i} className="rf-px-2 rf-leading-tight">
                            <span className="rf-text-xs rf-font-mono rf-text-orange-500">
                              {line}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="rf-flex rf-gap-2 rf-mt-4 rf-justify-end">
          <AutoroutingLogOptions
            autoroutingLog={autoroutingLog}
            onReportAutoroutingLog={onReportAutoroutingLog}
          />
          <Button
            variant="outline"
            className="rf-p-1"
            onClick={() => {
              const firstError = unifiedErrors[0]
              let errorText = `${firstError.type}: ${firstError.message}`
              if (evalVersion) errorText += `\n@tscircuit/eval@${evalVersion}`
              if (softwareUsedString) errorText += `\n${softwareUsedString}`
              if (firstError.stack) errorText += `\n${firstError.stack}`
              navigator.clipboard.writeText(errorText)
              toast.success("Error copied to clipboard!")
            }}
          >
            <ClipboardIcon className="rf-w-4 rf-h-4" />
            Copy Error
          </Button>
          <Button
            variant="outline"
            className="rf-p-1"
            onClick={() => {
              const firstError = unifiedErrors[0]
              const title = `Error ${firstError.type}`
                .replace(/[^a-zA-Z0-9 ]/g, " ")
                .replace(/\s+/g, " ")
                .slice(0, 100)

              let errorDetails = `${firstError.type}: ${firstError.message}`
              if (evalVersion)
                errorDetails += `\n@tscircuit/eval@${evalVersion}`
              if (softwareUsedString) errorDetails += `\n${softwareUsedString}`
              if (firstError.stack) errorDetails += `\n${firstError.stack}`

              let body = `[Package code to reproduce](${packageUrl()})\n\n### Error\n\`\`\`\n${errorDetails}\n\`\`\`\n`
              if (body.length > 35000) {
                const truncatedMessage =
                  firstError.message.length > 500
                    ? `${firstError.message.slice(0, 500)}...`
                    : firstError.message
                body = `[Package code to reproduce](${packageUrl()})\n\n### Error\n\`\`\`\n${firstError.type}: ${truncatedMessage}\n\`\`\``
              }

              openIssue(title, body)
            }}
          >
            <GitHubLogoIcon className="rf-w-4 rf-h-4" />
            Report Issue
          </Button>
        </div>
      </div>
    </>
  )
}
