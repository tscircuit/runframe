const OBJECT_URL_CLEANUP_DELAY_MS = 1_000

/**
 * Triggers a browser download for the provided content.
 * @param content The content to be downloaded (string or Blob)
 * @param opts Options for the download
 */
export const openForDownload = (
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

  // Create a blob with the content if it's a string
  const blob =
    content instanceof Blob ? content : new Blob([content], { type: mimeType })

  const url = URL.createObjectURL(blob)

  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  a.style.display = "none"

  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, OBJECT_URL_CLEANUP_DELAY_MS)
}
