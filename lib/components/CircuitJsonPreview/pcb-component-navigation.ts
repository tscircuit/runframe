import type { PcbComponentFocusRequest } from "@tscircuit/pcb-viewer"
import type { NavigateToPcbComponentOptions } from "@tscircuit/schematic-viewer"
import type { Dispatch, SetStateAction } from "react"

export const createNextPcbComponentFocusRequest = (
  previousRequest: PcbComponentFocusRequest | undefined,
  pcbComponentId: string,
): PcbComponentFocusRequest => ({
  pcbComponentId,
  requestId: (previousRequest?.requestId ?? 0) + 1,
})

export const navigateToPcbComponent = ({
  options,
  setPcbComponentFocusRequest,
  setActiveTab,
}: {
  options: NavigateToPcbComponentOptions
  setPcbComponentFocusRequest: Dispatch<
    SetStateAction<PcbComponentFocusRequest | undefined>
  >
  setActiveTab: (tab: "pcb") => void
}) => {
  setPcbComponentFocusRequest((previousRequest) =>
    createNextPcbComponentFocusRequest(previousRequest, options.pcbComponentId),
  )
  setActiveTab("pcb")
}
