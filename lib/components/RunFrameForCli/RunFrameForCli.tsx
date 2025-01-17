import { RunFrameWithApi } from "../RunFrameWithApi/RunFrameWithApi";
import { SaveToSnippetsButton } from "./SaveToSnippetsButton";

export const RunFrameForCli = (props: { debug?: boolean }) => {
  return (
    <div className="h-full w-full flex flex-col">
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
