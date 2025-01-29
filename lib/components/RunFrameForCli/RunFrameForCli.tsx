import { RunFrameWithApi } from "../RunFrameWithApi/RunFrameWithApi"
import { SaveToSnippetsButton } from "./SaveToSnippetsButton"

export const RunFrameForCli = (props: { debug?: boolean }) => {
  return (
      <RunFrameWithApi
        debug={props.debug}
        leftHeaderContent={
          <div>
            <SaveToSnippetsButton />
          </div>
        }
      />
  )
}
