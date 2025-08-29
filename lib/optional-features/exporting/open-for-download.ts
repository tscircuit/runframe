import { openJsonInNewTabForDownload } from "lib/utils/openJsonInNewTabForDownload"
import { openZipInNewTabForDownload } from "lib/utils/openZipInNewTabForDownload"

/**
 * Checks if the current window is inside an iframe
 */
const isInIframe = (): boolean => {
  try {
    return window.self !== window.top
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions, we're probably in an iframe
    return true
  }
}

/**
 * Opens content for download in the browser
 * Uses direct download by default, but opens in new tab when inside an iframe
 * @param content The content to be downloaded (string or Blob)
 * @param opts Options for the download
 */
export const openForDownload = async (
  content: string | Blob,
  opts: {
    /**
     * The filename to use for the download
     */
    fileName: string
    /**
     * The MIME type of the content (only used if content is a string)
     */
    mimeType?: string
  },
) => {
  const { fileName, mimeType = "text/plain" } = opts
  const inIframe = isInIframe()

  // If we're in an iframe, use the new tab approach for JSON and ZIP files
  if (inIframe) {
    // For JSON files, create a nice formatted view
    if (mimeType === "application/json" && typeof content === "string") {
      openJsonInNewTabForDownload(content, fileName)
      return
    }

    // For ZIP files, create a file listing view
    if (
      content instanceof Blob &&
      (fileName.endsWith(".zip") || mimeType === "application/zip")
    ) {
      await openZipInNewTabForDownload(content, fileName)
      return
    }

    // For other file types in iframe, open in new tab
    const blob =
      content instanceof Blob
        ? content
        : new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const newWindow = window.open(url, "_blank")
    if (!newWindow) {
      console.warn("Popup blocked, cannot open file in new tab")
      return
    }

    // Set a title for the new tab to make it clear what's being downloaded
    setTimeout(() => {
      if (newWindow.document) {
        newWindow.document.title = `Download: ${fileName}`
      }
    }, 100)

    // Clean up after a delay to ensure the content has loaded
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 5000)
    return
  }

  // Default behavior: Direct download (original implementation)
  // Create a blob with the content if it's a string
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType })

  // Create a URL for the blob
  const url = URL.createObjectURL(blob)

  // Create a temporary anchor element
  const a = document.createElement("a")
  a.href = url
  a.download = fileName

  // Append to the document, click, and remove
  document.body.appendChild(a)
  a.click()

  // Clean up
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}
