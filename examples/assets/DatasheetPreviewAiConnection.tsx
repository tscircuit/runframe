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
  OPENAI_DATASHEET_MODEL_ID,
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
  const [provider, setProvider] = useState<DatasheetPreviewProvider>("openai")
  const [proxyUrl, setProxyUrl] = useState("")
  const [modelId, setModelId] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [useCustomEndpoint, setUseCustomEndpoint] = useState(false)
  const [sessionToken, setSessionToken] = useState("")
  const [error, setError] = useState<string | null>(null)
  const providerInfo = provider ? datasheetPreviewProviders[provider] : null
  const isCustom = useCustomEndpoint || provider === "openai-compatible"
  const clearSecrets = () => {
    setApiKey("")
    setSessionToken("")
  }
  const connect = () => {
    try {
      if (!provider) throw new Error("Choose an AI provider.")
      const ai = createDatasheetPreviewAi(
        {
          provider,
          proxyUrl,
          modelId: provider === "openai" ? OPENAI_DATASHEET_MODEL_ID : modelId,
          apiKey,
          useCustomEndpoint,
          sessionToken,
        },
        { origin: window.location.origin },
      )
      onChange(ai)
      clearSecrets()
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
          if (!open) clearSecrets()
        }}
      >
        <DialogContent className="!rf-w-[calc(100vw-2rem)] rf-max-h-[90vh] rf-overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Connect your AI</DialogTitle>
            <DialogDescription>
              Connect your AI provider to generate component assets from a
              datasheet. OpenAI uses GPT-6 Astra automatically.
            </DialogDescription>
          </DialogHeader>
          <label className="rf-grid rf-gap-1 rf-text-sm">
            Provider
            <select
              className="rf-rounded rf-border rf-bg-white rf-p-2"
              value={provider}
              onChange={(event) => {
                setProvider(event.target.value as DatasheetPreviewProvider)
                clearSecrets()
                setProxyUrl("")
                setModelId("")
                setUseCustomEndpoint(false)
                setError(null)
              }}
            >
              {Object.entries(datasheetPreviewProviders).map(
                ([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ),
              )}
            </select>
          </label>
          {providerInfo?.signInUrl && (
            <div className="rf-grid rf-gap-2 rf-rounded rf-border rf-p-3">
              <Button asChild variant="outline">
                <a
                  href={providerInfo.signInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Sign in to {providerInfo.label} ↗
                </a>
              </Button>
              <p className="rf-text-xs rf-text-zinc-500">
                Opens the official provider site in a new tab. Sign in there to
                get an API key, then return here. This link does not connect
                your account to Runframe automatically.
              </p>
            </div>
          )}
          {providerInfo && (
            <>
              {provider !== "openai-compatible" && (
                <label className="rf-flex rf-items-center rf-gap-2 rf-text-sm">
                  <input
                    type="checkbox"
                    checked={useCustomEndpoint}
                    onChange={(event) => {
                      setUseCustomEndpoint(event.target.checked)
                      clearSecrets()
                    }}
                  />
                  Use my own server
                </label>
              )}
              {isCustom ? (
                <>
                  <label className="rf-grid rf-gap-1 rf-text-sm">
                    Server address
                    <input
                      className="rf-rounded rf-border rf-p-2"
                      value={proxyUrl}
                      placeholder={providerInfo.placeholder}
                      onChange={(event) => setProxyUrl(event.target.value)}
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
                </>
              ) : (
                <label className="rf-grid rf-gap-1 rf-text-sm">
                  Provider API key
                  <input
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    className="rf-rounded rf-border rf-p-2"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                  />
                </label>
              )}
              {provider === "openai" ? (
                <p className="rf-text-sm">
                  Model: <strong>GPT-6 Astra</strong>
                </p>
              ) : (
                <label className="rf-grid rf-gap-1 rf-text-sm">
                  PDF-capable model ID
                  <input
                    className="rf-rounded rf-border rf-p-2"
                    value={modelId}
                    placeholder="Your model ID"
                    onChange={(event) => setModelId(event.target.value)}
                  />
                </label>
              )}
              <p className="rf-text-xs rf-text-zinc-500">
                {isCustom
                  ? "Your server manages provider credentials and must allow this preview origin."
                  : "The provider address is automatic. Your key stays in this tab's memory and is sent only to the selected provider."}{" "}
                Settings clear on reload. Your model must support PDFs and
                structured JSON output.
              </p>
            </>
          )}
          {error && (
            <p role="alert" className="rf-text-sm rf-text-red-600">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false)
                clearSecrets()
              }}
            >
              Cancel
            </Button>
            {isConfigured && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onChange(undefined)
                  setIsOpen(false)
                  clearSecrets()
                }}
              >
                Disconnect
              </Button>
            )}
            <Button type="button" onClick={connect} disabled={!provider}>
              Use this model
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
