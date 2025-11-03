import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { ClipboardIcon, ChevronRight, XCircle, AlertCircle } from "lucide-react"
import { Button } from "lib/components/ui/button"
import { createSnippetUrl } from "@tscircuit/create-snippet-url"
import { encodeFsMapToUrlHash } from "lib/utils"
import { AutoroutingLogOptions } from "./AutoroutingLogOptions"
import { useState, useMemo, useEffect } from "react"
import type { CircuitJsonError } from "circuit-json"

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

  return (
    <>
      <div className="rf-w-[95%] rf-mx-auto">
        {unifiedErrors.length > 0 && (
          <div className="rf-space-y-2 rf-mt-4">
            {unifiedErrors.length > 1 && (
              <div className="rf-text-sm rf-text-red-600 rf-font-semibold rf-mb-2">
                {unifiedErrors.length} {unifiedErrors.length === 1 ? "error" : "errors"}
              </div>
            )}
            {unifiedErrors.map((error, index) => (
              <div
                key={index}
                className="rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200 rf-p-3"
              >
                <div className="rf-flex rf-items-start rf-gap-3">
                  <XCircle className="rf-h-5 rf-w-5 rf-text-red-500 rf-mt-0.5 rf-flex-shrink-0" />
                  <div className="rf-flex-1 rf-min-w-0">
                    <h3 className="rf-text-sm rf-font-semibold rf-text-red-800">
                      {error.type}
                    </h3>
                    <p className="rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600 rf-mt-1">
                      {error.message}
                    </p>
                    {(error.stack || evalVersion || softwareUsedString) && (
                      <details
                        open
                        style={{ whiteSpace: "pre-wrap" }}
                        className="rf-text-xs rf-font-mono rf-text-red-600 rf-mt-2"
                      >
                        <summary className="rf-cursor-pointer rf-text-red-700 rf-font-semibold">Stack trace</summary>
                        {evalVersion && `@tscircuit/eval@${evalVersion}\n`}
                        {softwareUsedString && `${softwareUsedString}\n`}
                        {error.stack}
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {unifiedWarnings.length > 0 && (
          <div className="rf-space-y-2 rf-mt-4">
            {unifiedWarnings.length > 1 && (
              <div className="rf-text-sm rf-text-orange-600 rf-font-semibold rf-mb-2">
                {unifiedWarnings.length} {unifiedWarnings.length === 1 ? "warning" : "warnings"}
              </div>
            )}
            {unifiedWarnings.map((warning, index) => (
              <div
                key={index}
                className="rf-bg-orange-50 rf-rounded-md rf-border rf-border-orange-200 rf-p-3"
              >
                <div className="rf-flex rf-items-start rf-gap-3">
                  <AlertCircle className="rf-h-5 rf-w-5 rf-text-orange-500 rf-mt-0.5 rf-flex-shrink-0" />
                  <div className="rf-flex-1 rf-min-w-0">
                    <h3 className="rf-text-sm rf-font-semibold rf-text-orange-800">
                      {warning.type}
                    </h3>
                    <p className="rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-orange-600 rf-mt-1">
                      {warning.message}
                    </p>
                    {warning.stack && (
                      <details
                        open
                        style={{ whiteSpace: "pre-wrap" }}
                        className="rf-text-xs rf-font-mono rf-text-orange-600 rf-mt-2"
                      >
                        <summary className="rf-cursor-pointer rf-text-orange-700 rf-font-semibold">Stack trace</summary>
                        {warning.stack}
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

              let body = `[Package code to reproduce](${packageUrl})\n\n### Error\n\`\`\`\n${errorDetails}\n\`\`\`\n`
              if (body.length > 35000) {
                const truncatedMessage =
                  firstError.message.length > 500
                    ? `${firstError.message.slice(0, 500)}...`
                    : firstError.message
                body = `[Package code to reproduce](${packageUrl})\n\n### Error\n\`\`\`\n${firstError.type}: ${truncatedMessage}\n\`\`\``
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
