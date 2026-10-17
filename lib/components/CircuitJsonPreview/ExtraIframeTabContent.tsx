import { useEffect, useState } from "react"
import { TabsContent } from "../ui/tabs"
import type { ResolvedExtraRunFrameTab } from "./extra-runframe-tabs"

/** Mount on first selection and retain the frame when another view is selected. */
export function ExtraIframeTabContent({
  tab,
  active,
  isFullScreen = false,
}: {
  tab: ResolvedExtraRunFrameTab
  active: boolean
  isFullScreen?: boolean
}) {
  const [visited, setVisited] = useState(active)
  useEffect(() => {
    if (active) setVisited(true)
  }, [active])

  return (
    <TabsContent
      value={tab.id}
      forceMount
      className="rf-flex-1 rf-min-h-0 rf-overflow-hidden"
      style={{
        display: active ? "flex" : "none",
        minHeight: isFullScreen ? 0 : 620,
      }}
    >
      {(visited || active) && (
        <iframe
          title={tab.tabName}
          src={tab.iframeUrl}
          sandbox="allow-scripts allow-same-origin"
          referrerPolicy="no-referrer"
          className="rf-w-full rf-h-full rf-border-0 rf-flex-1 rf-min-h-0"
        />
      )}
    </TabsContent>
  )
}
