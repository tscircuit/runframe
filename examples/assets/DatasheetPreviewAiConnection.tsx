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
import { createDatasheetPreviewAi } from "./create-datasheet-preview-ai"

/** Preview-host configuration. The production website supplies its own ai prop. */
export const DatasheetPreviewAiConnection = ({
  isConfigured,
  onChange,
}: {
  isConfigured: boolean
  onChange: (ai: RunFrameAiConfig | undefined) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [proxyUrl, setProxyUrl] = useState("")
  const [modelId, setModelId] = useState("")
  const [sessionToken, setSessionToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const connect = () => {
    try {
      const ai = createDatasheetPreviewAi(
        { proxyUrl, modelId, sessionToken },
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
            <DialogTitle>Connect a real AI model</DialogTitle>
            <DialogDescription>
              This preview requires an authenticated Anthropic-compatible
              backend. The uploaded PDF goes to that model. No sample component
              is returned.
            </DialogDescription>
          </DialogHeader>
          <label className="rf-grid rf-gap-1 rf-text-sm">
            AI proxy URL (including /v1)
            <input
              className="rf-rounded rf-border rf-p-2"
              value={proxyUrl}
              placeholder="https://your-backend/api/anthropic/v1"
              onChange={(event) => setProxyUrl(event.target.value)}
            />
          </label>
          <label className="rf-grid rf-gap-1 rf-text-sm">
            PDF-capable model ID
            <input
              className="rf-rounded rf-border rf-p-2"
              value={modelId}
              placeholder="Model enabled by your backend"
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
            Use a host session token here, never a provider API key. The token
            stays in memory and is cleared on reload. The backend must supply
            its provider key and allow requests from this preview origin.
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
