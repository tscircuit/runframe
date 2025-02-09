import { RunFrameWithApi } from "../RunFrameWithApi/RunFrameWithApi";
import { SaveToSnippetsButton } from "./SaveToSnippetsButton";

export const RunFrameForCli = (props: { debug?: boolean }) => {
  return (
    <div className="rf-w-full rf-h-full">
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
