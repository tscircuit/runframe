import { useLocalStorageState } from "lib/hooks/use-local-storage-state"
import { RunFrameWithApi } from "../RunFrameWithApi/RunFrameWithApi"
import { RunframeCliLeftHeader } from "./LeftHeader"
import { Toaster } from "react-hot-toast"

export const RunFrameForCli = (props: { debug?: boolean }) => {
  const [shouldLoadLatestEval, setLoadLatestEval] = useLocalStorageState(
    "load-latest-eval",
    true,
  )
  return (
    <RunFrameWithApi
      debug={props.debug}
      forceLatestEvalVersion={shouldLoadLatestEval}
      defaultToFullScreen={true}
      showToggleFullScreen={false} // Hide the fullscreen toggle button in CLI
      leftHeaderContent={
        <div className="rf-flex">
          <Toaster position="top-center" reverseOrder={false} />
          <RunframeCliLeftHeader
            shouldLoadLatestEval={shouldLoadLatestEval}
            onChangeShouldLoadLatestEval={(newShouldLoadLatestEval) => {
              setLoadLatestEval(newShouldLoadLatestEval)
              globalThis.runFrameWorker = null
            }}
          />
        </div>
      }
    />
  )
}
