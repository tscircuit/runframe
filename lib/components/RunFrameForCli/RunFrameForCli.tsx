import { useLocalStorageState } from "lib/hooks/use-local-storage-state"
import { RunFrameWithApi } from "../RunFrameWithApi/RunFrameWithApi"
import { FileMenuLeftHeader } from "../FileMenuLeftHeader"

export const RunFrameForCli = (props: {
  debug?: boolean
  scenarioSelectorContent?: React.ReactNode
  workerBlobUrl?: string
}) => {
  const [shouldLoadLatestEval, setLoadLatestEval] = useLocalStorageState(
    "load-latest-eval",
    true,
  )
  return (
    <RunFrameWithApi
      debug={props.debug}
      forceLatestEvalVersion={!props.workerBlobUrl && shouldLoadLatestEval}
      defaultToFullScreen={true}
      showToggleFullScreen={false}
      workerBlobUrl={props.workerBlobUrl}
      showFilesSwitch
      showFileMenu={false}
      leftHeaderContent={
        <div className="rf-flex rf-items-center rf-justify-between">
          <FileMenuLeftHeader
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
