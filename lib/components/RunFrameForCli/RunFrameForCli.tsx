import {
  guessEntrypoint,
  RunFrameWithApi,
} from "../RunFrameWithApi/RunFrameWithApi"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { RunframeCliLeftHeader } from "./LeftHeader"

export const RunFrameForCli = (props: { debug?: boolean }) => {
  const fsMap = useRunFrameStore((s) => s.fsMap)
  const entrypoint =
    guessEntrypoint(Array.from(fsMap.keys())) ?? "entrypoint.tsx"

  return (
    <RunFrameWithApi
      debug={props.debug}
      leftHeaderContent={
        <>
          <div className="rf-flex">
            <RunframeCliLeftHeader />
          </div>
          <div className="rf-absolute rf-top-3 rf-left-1/2 rf-transform rf--translate-x-1/2">
            <div className="border rounded-lg px-3 rf-select-none py-1 text-sm font-medium bg-gray-100 flex items-center">
              <span className="mx-3">{entrypoint}</span>
            </div>
          </div>
        </>
      }
    />
  )
}
