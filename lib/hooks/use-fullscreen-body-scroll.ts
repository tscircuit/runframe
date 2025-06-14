import { useEffect } from "react"

export const useFullscreenBodyScroll = (isFullScreen: boolean) => {
  useEffect(() => {
    if (isFullScreen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isFullScreen])
}
