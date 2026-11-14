import { FilePlus2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useRunFrameAi } from "../../ai/RunFrameAiProvider"
import { readDatasheetGenerations } from "../../ai/datasheet-generation"
import { getPlacedDatasheetEntrypoints } from "../../ai/add-datasheet-to-board"
import { Button } from "../ui/button"
import {
  DatasheetImportDialog,
  type DatasheetImportDialogProps,
} from "./DatasheetImportDialog"

/** A toolbar action that also works when the host hides Runframe's File menu. */
export const DatasheetImportButton = ({
  onAssetsGenerated,
  onGenerationCreated,
  fsMap,
  boardPath,
}: Pick<
  DatasheetImportDialogProps,
  "onAssetsGenerated" | "onGenerationCreated"
> & {
  fsMap?: ReadonlyMap<string, string> | Record<string, string>
  boardPath?: string
}) => {
  const ai = useRunFrameAi()
  const [isOpen, setIsOpen] = useState(false)
  const generations = useMemo(
    () => (fsMap ? readDatasheetGenerations(fsMap) : []),
    [fsMap],
  )
  const source =
    boardPath && fsMap
      ? fsMap instanceof Map
        ? fsMap.get(boardPath)
        : (fsMap as Record<string, string>)[boardPath]
      : undefined
  const [placed, setPlaced] = useState<{
    source: string
    boardPath: string
    entrypoints: Set<string>
  }>()
  useEffect(() => {
    if (
      !boardPath ||
      source === undefined ||
      !/\.[cm]?[jt]sx?$/.test(boardPath)
    )
      return
    let current = true
    getPlacedDatasheetEntrypoints(source, boardPath)
      .catch(() => new Set<string>())
      .then((entrypoints) => {
        if (current) setPlaced({ source, boardPath, entrypoints })
      })
    return () => {
      current = false
    }
  }, [source, boardPath])
  const placement =
    boardPath && source !== undefined && /\.[cm]?[jt]sx?$/.test(boardPath)
      ? {
          source,
          boardPath,
          entrypoints:
            placed && placed.source === source && placed.boardPath === boardPath
              ? placed.entrypoints
              : undefined,
        }
      : undefined

  return (
    <>
      {(ai || generations.length > 0) && (
        <Button
          type="button"
          variant="outline"
          className="rf-ml-2 rf-shrink-0"
          onClick={() => setIsOpen(true)}
        >
          <FilePlus2 aria-hidden="true" />
          Create from datasheet
        </Button>
      )}
      <DatasheetImportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAssetsGenerated={onAssetsGenerated}
        onGenerationCreated={onGenerationCreated}
        savedGenerations={generations}
        placement={placement}
      />
    </>
  )
}
