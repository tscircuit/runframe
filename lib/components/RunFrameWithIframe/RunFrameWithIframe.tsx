/**
 * NOTE: RunFrame as a module is quite large, so you might want to vendor this
 * file into your project.
 */
import type { RunFrameProps } from "../RunFrame/RunFrameProps"

export const RunFrameWithIframe = ({
  iframeUrl = "https://runframe.tscircuit.com/iframe.html",
}: {
  iframeUrl?: string
}) => {
  return (
    <div>
      <iframe src={iframeUrl} title="tscircuit code runner and preview" />
    </div>
  )
}
