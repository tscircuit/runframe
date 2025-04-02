import { useLocalStorageState } from "lib/hooks/use-local-storage-state"
import { RunFrameWithApi } from "../RunFrameWithApi/RunFrameWithApi"
import { CliLeftHeader } from "./CliLeftHeader"

export const RunFrameForCli = (props: {
  debug?: boolean
  scenarioSelectorContent?: React.ReactNode
}) => {
  const [shouldLoadLatestEval, setLoadLatestEval] = useLocalStorageState(
    "load-latest-eval",
    true,
  )
  return (
    <RunFrameWithApi
      debug={props.debug}
      forceLatestEvalVersion={shouldLoadLatestEval}
      defaultToFullScreen={true}
      showToggleFullScreen={false}
      leftHeaderContent={
        <div className="rf-flex rf-items-center rf-justify-between">
          <CliLeftHeader
            shouldLoadLatestEval={shouldLoadLatestEval}
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
