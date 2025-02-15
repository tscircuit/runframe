import { RunFrameWithApi } from "../RunFrameWithApi/RunFrameWithApi"
import { RunframeCliLeftHeader } from "./LeftHeader"

export const RunFrameForCli = (props: { debug?: boolean }) => {
  return (
    <RunFrameWithApi
      debug={props.debug}
      leftHeaderContent={
        <div>
          <RunframeCliLeftHeader />
        </div>
      }
    />
  )
}
