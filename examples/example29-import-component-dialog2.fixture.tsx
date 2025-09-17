import { useMemo, useState } from "react"
import {
  ImportComponentDialog2,
  type ImportComponentDialog2Props,
} from "lib/components/ImportComponentDialog2"
import { useStyles } from "lib/hooks/use-styles"

const MAX_LOG_LINES = 6

type HandlerBundle = Pick<
  ImportComponentDialog2Props,
  | "onTscircuitPackageSelected"
  | "onJlcpcbComponentTsxLoaded"
  | "onKicadStringSelected"
>

export default function ImportComponentDialog2Fixture() {
  useStyles()
  const [isOpen, setIsOpen] = useState(true)
  const [enableTscircuit, setEnableTscircuit] = useState(true)
  const [enableJlcpcb, setEnableJlcpcb] = useState(true)
  const [enableKicad, setEnableKicad] = useState(true)
  const [logMessages, setLogMessages] = useState<string[]>([])

  const appendLog = (message: string) => {
    setLogMessages((prev) => [message, ...prev].slice(0, MAX_LOG_LINES))
  }

  const handlers = useMemo<HandlerBundle>(() => {
    const maybeHandlers: HandlerBundle = {}

    if (enableTscircuit) {
      maybeHandlers.onTscircuitPackageSelected = async ({
        component,
        fullPackageName,
      }) => {
        appendLog(`tscircuit → ${component.name} (${fullPackageName})`)
      }
    }

    if (enableJlcpcb) {
      maybeHandlers.onJlcpcbComponentTsxLoaded = async ({ component, tsx }) => {
        appendLog(
          `jlcpcb → ${component.partNumber ?? component.name} (tsx: ${tsx.length} chars)`,
        )
      }
    }

    if (enableKicad) {
      maybeHandlers.onKicadStringSelected = async ({
        component,
        footprint,
      }) => {
        appendLog(`kicad → ${component.name} (${footprint})`)
      }
    }

    return maybeHandlers
  }, [enableJlcpcb, enableKicad, enableTscircuit])

  return (
    <div className="rf-space-y-6 rf-p-6 rf-max-w-xl">
      <div className="rf-space-y-2">
        <h1 className="rf-text-xl rf-font-semibold">
          Import Component Dialog 2
        </h1>
        <p className="rf-text-sm rf-text-muted-foreground">
          Toggle the available sources and open the dialog to exercise its
          behaviour.
        </p>
      </div>

      <div className="rf-grid rf-gap-2 rf-sm:grid-cols-3">
        <label className="rf-flex rf-items-center rf-gap-2 rf-text-sm">
          <input
            type="checkbox"
            checked={enableTscircuit}
            onChange={(event) => setEnableTscircuit(event.target.checked)}
          />
          tscircuit packages
        </label>
        <label className="rf-flex rf-items-center rf-gap-2 rf-text-sm">
          <input
            type="checkbox"
            checked={enableJlcpcb}
            onChange={(event) => setEnableJlcpcb(event.target.checked)}
          />
          JLCPCB parts
        </label>
        <label className="rf-flex rf-items-center rf-gap-2 rf-text-sm">
          <input
            type="checkbox"
            checked={enableKicad}
            onChange={(event) => setEnableKicad(event.target.checked)}
          />
          KiCad footprints
        </label>
      </div>

      <button
        className="rf-inline-flex rf-items-center rf-justify-center rf-rounded rf-bg-blue-600 rf-px-4 rf-py-2 rf-text-sm rf-font-medium rf-text-white hover:rf-bg-blue-700"
        onClick={() => setIsOpen(true)}
      >
        {isOpen ? "Dialog open" : "Open import dialog"}
      </button>

      {logMessages.length > 0 ? (
        <div className="rf-rounded rf-border rf-border-muted rf-bg-muted/20 rf-p-4 rf-space-y-2">
          <h2 className="rf-text-sm rf-font-semibold">Callback log</h2>
          <ul className="rf-text-xs rf-space-y-1 rf-font-mono">
            {logMessages.map((message, index) => (
              <li key={index}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <ImportComponentDialog2
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        {...handlers}
      />
    </div>
  )
}
