import { useState } from "react"
import type { RunFrameAiConfig } from "../../lib/ai/RunFrameAiProvider"
import { Button } from "../../lib/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../lib/components/ui/dialog"
import {
  type DatasheetPreviewProvider,
  createDatasheetPreviewAi,
  datasheetPreviewProviders,
} from "./create-datasheet-preview-ai"

/** Preview-host configuration. The production website supplies its own ai prop. */
export const DatasheetPreviewAiConnection = ({
  isConfigured,
  onChange,
}: {
  isConfigured: boolean
  onChange: (ai: RunFrameAiConfig | undefined) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [provider, setProvider] = useState<DatasheetPreviewProvider | "">("")
  const [proxyUrl, setProxyUrl] = useState("")
  const [modelId, setModelId] = useState("")
  const [sessionToken, setSessionToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const connect = () => {
    try {
      if (!provider) throw new Error("Choose an AI provider.")
      const ai = createDatasheetPreviewAi(
        { provider, proxyUrl, modelId, sessionToken },
        { origin: window.location.origin },
      )
      onChange(ai)
      setSessionToken("")
      setError(null)
      setIsOpen(false)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not configure AI.",
      )
    }
  }
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
      >
        {isConfigured ? "AI settings" : "Configure AI"}
      </Button>
      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open)
          if (!open) setSessionToken("")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Use your own AI model</DialogTitle>
            <DialogDescription>
              Choose your provider, model and authenticated endpoint. Your model
              receives the uploaded PDF and generates the component assets.
            </DialogDescription>
          </DialogHeader>
          <label className="rf-grid rf-gap-1 rf-text-sm">
            Provider
            <select
              className="rf-rounded rf-border rf-bg-white rf-p-2"
              value={provider}
              onChange={(event) =>
                setProvider(event.target.value as DatasheetPreviewProvider | "")
              }
            >
              <option value="">Choose a provider</option>
              {Object.entries(datasheetPreviewProviders).map(
                ([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="rf-grid rf-gap-1 rf-text-sm">
            AI endpoint URL
            <input
              className="rf-rounded rf-border rf-p-2"
              value={proxyUrl}
              placeholder={
                provider
                  ? datasheetPreviewProviders[provider].placeholder
                  : "Choose your provider first"
              }
              onChange={(event) => setProxyUrl(event.target.value)}
            />
          </label>
          <label className="rf-grid rf-gap-1 rf-text-sm">
            PDF-capable model ID
            <input
              className="rf-rounded rf-border rf-p-2"
              value={modelId}
              placeholder="Your model ID"
              onChange={(event) => setModelId(event.target.value)}
            />
          </label>
          <label className="rf-grid rf-gap-1 rf-text-sm">
            Website session token (if required)
            <input
              type="password"
              autoComplete="off"
              className="rf-rounded rf-border rf-p-2"
              value={sessionToken}
              onChange={(event) => setSessionToken(event.target.value)}
            />
          </label>
          <p className="rf-text-xs rf-text-zinc-500">
            Your model must support PDF input and structured JSON output. Use a
            host session token here, never a provider API key. The backend keeps
            the provider key and allows this preview origin. Settings stay in
            memory and are cleared on reload.
          </p>
          {error && (
            <p role="alert" className="rf-text-sm rf-text-red-600">
              {error}
            </p>
          )}
          <DialogFooter>
            {isConfigured && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onChange(undefined)
                  setIsOpen(false)
                  setSessionToken("")
                }}
              >
                Disconnect
              </Button>
            )}
            <Button type="button" onClick={connect}>
              Use AI connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
