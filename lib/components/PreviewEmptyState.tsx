import { Button } from "lib/components/ui/button"
import { PlayIcon } from "lucide-react"

const PreviewEmptyState = ({ onRunClicked }: { onRunClicked?: () => void }) => (
  <div className="rf-flex rf-items-center rf-gap-3 rf-bg-gray-100 rf-text-center rf-justify-center rf-py-10">
    No circuit json loaded
    {onRunClicked && (
      <Button
        className="rf-bg-blue-600 rf-hover:bg-blue-500"
        onClick={onRunClicked}
      >
        Run Code
        <PlayIcon className="rf-w-3 rf-h-3 rf-ml-2" />
      </Button>
    )}
  </div>
)

export default PreviewEmptyState
