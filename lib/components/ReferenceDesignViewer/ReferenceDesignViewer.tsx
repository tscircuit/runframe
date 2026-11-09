import { useEffect, useId, useState } from "react"
import type { CircuitJson } from "circuit-json"
import type {
  ReferenceDesign,
  ReferenceDesignConfiguration,
} from "../../reference-designs"
import { CircuitJsonPreview } from "../CircuitJsonPreview/CircuitJsonPreview"
import type { TabId } from "../CircuitJsonPreview/PreviewContentProps"
import { useStyles } from "../../hooks/use-styles"

export type ReferenceDesignArtifacts = {
  circuitJson: CircuitJson
  glbData: ArrayBuffer
}

export interface ReferenceDesignViewerProps {
  referenceDesign: ReferenceDesign
  loadConfiguration: (request: {
    configuration: ReferenceDesignConfiguration
    signal: AbortSignal
  }) => Promise<ReferenceDesignArtifacts>
}

export function ReferenceDesignViewer({
  referenceDesign,
  loadConfiguration,
}: ReferenceDesignViewerProps) {
  useStyles()
  const [activeTab, setActiveTab] = useState<TabId>("cad")
  const selectId = useId()
  const [configurationName, setConfigurationName] = useState(
    referenceDesign.configurations[0].name,
  )
  const [retryIndex, setRetryIndex] = useState(0)
  const configuration =
    referenceDesign.configurations.find(
      ({ name }) => name === configurationName,
    ) ?? referenceDesign.configurations[0]
  const [loaded, setLoaded] = useState<{
    configuration: ReferenceDesignConfiguration
    artifacts: ReferenceDesignArtifacts
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setError(null)
    void loadConfiguration({ configuration, signal: controller.signal }).then(
      (artifacts) => {
        if (!controller.signal.aborted) setLoaded({ configuration, artifacts })
      },
      (reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to load configuration",
          )
      },
    )
    return () => controller.abort()
  }, [configuration, loadConfiguration, retryIndex])

  const artifacts =
    loaded?.configuration === configuration ? loaded.artifacts : null
  const selector = (
    <div className="rf-flex rf-min-w-0 rf-items-center rf-gap-2">
      <label htmlFor={selectId} className="rf-text-xs rf-text-gray-500">
        Configuration
      </label>
      <select
        id={selectId}
        value={configuration.name}
        onChange={(event) => setConfigurationName(event.target.value)}
        className="rf-min-w-0 rf-max-w-48 rf-rounded-md rf-border rf-border-gray-200 rf-bg-white rf-px-2 rf-py-1.5 rf-text-sm"
      >
        {referenceDesign.configurations.map(({ name, display_name }) => (
          <option key={name} value={name}>
            {display_name}
          </option>
        ))}
      </select>
    </div>
  )

  if (!artifacts || error)
    return (
      <div className="rf-overflow-hidden rf-rounded-md rf-border rf-border-gray-200">
        <div className="rf-flex rf-min-h-12 rf-items-center rf-border-b rf-px-3">
          {selector}
        </div>
        <div
          className="rf-flex rf-h-[480px] rf-items-center rf-justify-center rf-gap-3 rf-text-sm rf-text-gray-500"
          role={error ? "alert" : "status"}
        >
          {error ?? "Loading configuration…"}
          {error && (
            <button
              type="button"
              className="rf-underline"
              onClick={() => setRetryIndex((index) => index + 1)}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    )

  return (
    <div
      className="rf-h-[540px] rf-min-w-0"
      aria-label={referenceDesign.display_name}
    >
      <CircuitJsonPreview
        circuitJson={artifacts.circuitJson}
        prebuiltGlb={artifacts.glbData}
        availableTabs={["cad", "pcb", "schematic"]}
        defaultActiveTab={activeTab}
        onActiveTabChange={setActiveTab}
        leftHeaderContent={selector}
        showFileMenu={false}
        showCodeTab={false}
        showToggleFullScreen={false}
        isWebEmbedded
        allowSelectingVersion={false}
      />
    </div>
  )
}
