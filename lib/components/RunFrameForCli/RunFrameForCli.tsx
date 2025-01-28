import { RunFrameWithApi } from "../RunFrameWithApi/RunFrameWithApi";
import { SaveToSnippetsButton } from "./SaveToSnippetsButton";

export const RunFrameForCli = (props: { debug?: boolean }) => {
  return (
    <div className="rf-h-screen rf-w-screen rf-flex rf-flex-col">
      <RunFrameWithApi
        debug={props.debug}
        leftHeaderContent={
          <div>
            <SaveToSnippetsButton />
          </div>
        }
      />
    </div>
  );
};
