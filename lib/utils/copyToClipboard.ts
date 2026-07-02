/**
 * Copy text to the clipboard, gracefully degrading when the async Clipboard API
 * is unavailable.
 *
 * `navigator.clipboard` only exists in a secure context (the entire ancestor
 * frame chain must be secure). When runframe is embedded as an iframe inside an
 * insecure (HTTP / local-IP) page, `navigator.clipboard` is `undefined`, so
 * calling `navigator.clipboard.writeText(...)` directly throws an unhandled
 * `TypeError`. This helper checks for the API first, falls back to a
 * `document.execCommand("copy")` textarea, and always returns a promise so
 * callers (including `toast.promise`) get a rejection rather than a thrown
 * exception on failure.
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Fallback for insecure contexts where the Clipboard API is unavailable.
  if (typeof document === "undefined") {
    throw new Error("Clipboard is not available in this environment")
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  // Keep it out of view and prevent scrolling/zoom on focus.
  textarea.style.position = "fixed"
  textarea.style.top = "-9999px"
  textarea.style.left = "-9999px"
  textarea.setAttribute("readonly", "")
  document.body.appendChild(textarea)

  try {
    textarea.select()
    const succeeded = document.execCommand("copy")
    if (!succeeded) {
      throw new Error("Copy command was unsuccessful")
    }
  } finally {
    document.body.removeChild(textarea)
  }
}
