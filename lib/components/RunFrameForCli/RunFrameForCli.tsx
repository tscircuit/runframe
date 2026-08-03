import { useLocalStorageState } from "lib/hooks/use-local-storage-state"
import { useCallback, useMemo, useState } from "react"
import { FileMenuLeftHeader } from "../FileMenuLeftHeader"
import {
  RunFrameWithApi,
  type RunFrameWithApiProps,
} from "../RunFrameWithApi/RunFrameWithApi"
import { API_BASE } from "../RunFrameWithApi/api-base"
import { useLoginDialog } from "./LoginDialog"
import { createCliLocalCacheEngine } from "./create-cli-local-cache-engine"

export interface RunFrameForCliProps {
  debug?: boolean
  scenarioSelectorContent?: React.ReactNode
  workerBlobUrl?: string
  evalWebWorkerBlobUrl?: string
  enableFetchProxy?: boolean
  apiBaseUrl?: string
  platformConfig?: RunFrameWithApiProps["platformConfig"]
}

export const RunFrameForCli = (props: RunFrameForCliProps) => {
  const [shouldLoadLatestEval, setLoadLatestEval] = useLocalStorageState(
    "load-latest-eval",
    true,
  )
  const evalWebWorkerBlobUrl = props.evalWebWorkerBlobUrl ?? props.workerBlobUrl
  const cacheApiBaseUrl = props.apiBaseUrl ?? API_BASE
  const platformConfig = useMemo(
    () => ({
      ...props.platformConfig,
      localCacheEngine:
        props.platformConfig?.localCacheEngine ??
        createCliLocalCacheEngine({ apiBaseUrl: cacheApiBaseUrl }),
    }),
    [cacheApiBaseUrl, props.platformConfig],
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
    const newUrl = `${window.location.pathname}${window.location.search}${
      newHash.length > 0 ? `#${newHash}` : ""
    }`
    window.history.replaceState(null, "", newUrl)
  }, [])

  const { LoginDialog, openLoginDialog } = useLoginDialog()

  return (
    <>
      {LoginDialog}
      <RunFrameWithApi
        debug={props.debug}
        forceLatestEvalVersion={!evalWebWorkerBlobUrl && shouldLoadLatestEval}
        defaultToFullScreen={true}
        showToggleFullScreen={false}
        evalWebWorkerBlobUrl={evalWebWorkerBlobUrl}
        apiBaseUrl={props.apiBaseUrl}
        platformConfig={platformConfig}
        isCli={true}
        showFilesSwitch
        showFileMenu={false}
        enableFetchProxy={props.enableFetchProxy}
        initialMainComponentPath={initialMainComponentPath}
        onLoginRequired={openLoginDialog}
        onMainComponentPathChange={updateMainComponentHash}
        leftHeaderContent={
          <div className="rf-flex rf-items-center rf-justify-between">
            <FileMenuLeftHeader
              isWebEmbedded={false}
              shouldLoadLatestEval={
                !evalWebWorkerBlobUrl && shouldLoadLatestEval
              }
              onChangeShouldLoadLatestEval={(newShouldLoadLatestEval) => {
                setLoadLatestEval(newShouldLoadLatestEval)
                globalThis.runFrameWorker = null
              }}
              onLoginRequired={openLoginDialog}
            />
            {props.scenarioSelectorContent}
          </div>
        }
      />
    </>
  )
}
