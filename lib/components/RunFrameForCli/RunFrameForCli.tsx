import { useLocalStorageState } from "lib/hooks/use-local-storage-state"
import { useCallback, useState } from "react"
import { RunFrameWithApi } from "../RunFrameWithApi/RunFrameWithApi"
import { FileMenuLeftHeaderWithBugReport } from "../FileMenuLeftHeaderWithBugReport"

export const RunFrameForCli = (props: {
  debug?: boolean
  scenarioSelectorContent?: React.ReactNode
  workerBlobUrl?: string
  enableFetchProxy?: boolean
}) => {
  const [shouldLoadLatestEval, setLoadLatestEval] = useLocalStorageState(
    "load-latest-eval",
    true,
  )
  const [initialMainComponentPath] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined
    const params = new URLSearchParams(window.location.hash.slice(1))
    return params.get("main_component") ?? undefined
  })

  const updateMainComponentHash = useCallback((mainComponentPath: string) => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.hash.slice(1))
    if (params.get("main_component") === mainComponentPath) return
    params.set("main_component", mainComponentPath)
    const newHash = params.toString()
    const newUrl =
      `${window.location.pathname}${window.location.search}` +
      (newHash.length > 0 ? `#${newHash}` : "")
    window.history.replaceState(null, "", newUrl)
  }, [])

  return (
    <RunFrameWithApi
      debug={props.debug}
      forceLatestEvalVersion={!props.workerBlobUrl && shouldLoadLatestEval}
      defaultToFullScreen={true}
      showToggleFullScreen={false}
      workerBlobUrl={props.workerBlobUrl}
      showFilesSwitch
      showFileMenu={false}
      enableFetchProxy={props.enableFetchProxy}
      initialMainComponentPath={initialMainComponentPath}
      onMainComponentPathChange={updateMainComponentHash}
      leftHeaderContent={
        <div className="rf-flex rf-items-center rf-justify-between">
          <FileMenuLeftHeaderWithBugReport
            isWebEmbedded={false}
            shouldLoadLatestEval={!props.workerBlobUrl && shouldLoadLatestEval}
            onChangeShouldLoadLatestEval={(newShouldLoadLatestEval) => {
              setLoadLatestEval(newShouldLoadLatestEval)
              globalThis.runFrameWorker = null
            }}
          />
          {props.scenarioSelectorContent}
        </div>
      }
    />
  )
}
