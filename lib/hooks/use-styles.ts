import { useEffect } from "react"
import styles from "./styles.generated"

export const useStyles = () => {
  useEffect(() => {
    // Check if styles are already added
    const existingStyle = document.querySelector(
      'style[data-styles="tscircuit-runframe-animations"]',
    )
    if (existingStyle) return

    const styleElement = document.createElement("style")
    styleElement.setAttribute("data-styles", "tscircuit-runframe-animations")
    styleElement.textContent = styles
    document.head.appendChild(styleElement)
  }, [])
}
