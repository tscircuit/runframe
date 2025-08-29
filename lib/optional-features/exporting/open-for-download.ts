/**
 * Opens content for download in the browser
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
