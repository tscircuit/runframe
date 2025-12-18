import { useEffect } from "react"

/**
 * Checks if Tailwind CSS is loaded on the page, and if not,
 * injects the Tailwind CDN script tag.
 */
export const useInjectTailwind = () => {
  useEffect(() => {
    const tailwindScriptId = "tailwind-cdn-script"

    // Check if Tailwind is already loaded (look for existing script or tailwind object)
    if (document.getElementById(tailwindScriptId) || (window as any).tailwind) {
      return
    }

    // Check if Tailwind styles are already applied by testing a known utility
    const testEl = document.createElement("div")
    testEl.className = "hidden"
    document.body.appendChild(testEl)
    const isHidden = window.getComputedStyle(testEl).display === "none"
    document.body.removeChild(testEl)

    if (isHidden) {
      return // Tailwind is already loaded
    }

    // Load Tailwind from CDN
    const script = document.createElement("script")
    script.id = tailwindScriptId
    script.src = "https://cdn.tailwindcss.com"
    document.head.appendChild(script)
  }, [])
}
