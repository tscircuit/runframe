import { useEffect, useState } from "react"
import type { ExtraRunFrameTab } from "../components/CircuitJsonPreview/extra-runframe-tabs"

declare global {
  interface Window {
    TSCIRCUIT_EXTRA_RUNFRAME_TABS?: ExtraRunFrameTab[]
  }
}

export const EXTRA_RUNFRAME_TABS_CHANGE_EVENT =
  "tscircuit:extra-runframe-tabs-change"

const readExtraTabs = (): ExtraRunFrameTab[] => {
  if (typeof window === "undefined") return []
  const tabs = window.TSCIRCUIT_EXTRA_RUNFRAME_TABS
  return Array.isArray(tabs) ? [...tabs] : []
}

/** Only the standalone bootstrap reads globals; React consumers use extraTabs. */
export function useExtraRunFrameTabsFromWindow() {
  const [tabs, setTabs] = useState(readExtraTabs)
  useEffect(() => {
    const update = () => setTabs(readExtraTabs())
    window.addEventListener(EXTRA_RUNFRAME_TABS_CHANGE_EVENT, update)
    update()
    return () =>
      window.removeEventListener(EXTRA_RUNFRAME_TABS_CHANGE_EVENT, update)
  }, [])
  return tabs
}
