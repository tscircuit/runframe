import { FilePlus2 } from "lucide-react"
import { useState } from "react"
import { useRunFrameAi } from "../../ai/RunFrameAiProvider"
import { Button } from "../ui/button"
import {
  DatasheetImportDialog,
  type DatasheetImportDialogProps,
} from "./DatasheetImportDialog"

/** A toolbar action that also works when the host hides Runframe's File menu. */
export const DatasheetImportButton = ({
  onAssetsGenerated,
}: Pick<DatasheetImportDialogProps, "onAssetsGenerated">) => {
  const ai = useRunFrameAi()
  const [isOpen, setIsOpen] = useState(false)
  if (!ai) return null

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="rf-ml-2 rf-shrink-0"
        onClick={() => setIsOpen(true)}
      >
        <FilePlus2 aria-hidden="true" />
        Create from datasheet
      </Button>
      <DatasheetImportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAssetsGenerated={onAssetsGenerated}
      />
    </>
  )
}
