import { useEffect } from "react"
import styles from "./solver-styles.generated"

export const useSolverDebuggerStyles = () => {
  useEffect(() => {
    if (
      document.querySelector('style[data-styles="runframe-solver-debugger"]')
    ) {
      return
    }

    const style = document.createElement("style")
    style.setAttribute("data-styles", "runframe-solver-debugger")
    style.textContent = styles
    document.head.appendChild(style)
  }, [])
}
