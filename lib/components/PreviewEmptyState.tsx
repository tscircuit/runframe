import { Button } from "lib/components/ui/button"
import { getRandomTipForUser } from "lib/utils/getRandomTipForUser"
import { Loader, LightbulbIcon, PlayIcon } from "lucide-react"

const tipHtml: string = getRandomTipForUser()

const PreviewEmptyState = ({ 
  onRunClicked, 
  isLoading 
}: { 
  onRunClicked?: () => void,
  isLoading?: boolean 
}) => {
  return (
    <div className="rf-flex rf-flex-col rf-items-center rf-justify-center rf-h-full rf-bg-gray-50 rf-text-gray-500 rf-p-4">
      <LightbulbIcon className={`rf-size-14 rf-mb-4 ${isLoading ? 'rf-opacity-50' : ''}`} />
      <p className={`rf-text-md rf-break-words rf-max-w-xl rf-text-center ${isLoading ? 'rf-opacity-50' : ''}`}>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: its internal function */}
        Tip: <span dangerouslySetInnerHTML={{ __html: tipHtml }} />
      </p>
      {onRunClicked && (
        <Button
          className="rf-mt-4 rf-bg-blue-600 rf-hover:bg-blue-500"
          onClick={onRunClicked}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              Loading
              <Loader className="rf-w-3 rf-h-3 rf-ml-2 rf-animate-spin" />
            </>
          ) : (
            <>
              Run Code
              <PlayIcon className="rf-w-3 rf-h-3 rf-ml-2" />
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default PreviewEmptyState
