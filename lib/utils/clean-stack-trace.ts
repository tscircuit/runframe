/**
 * Cleans up stack traces by filtering out browser dev server blob URLs
 */
export const cleanStackTrace = (
  stack?: string | null,
  options: { basePath?: string } = {},
): string | null => {
  if (typeof stack !== "string" || stack.trim() === "") {
    return null
  }

  const { basePath } = options

  return stack
    .split("\n")
    .filter((line) => {
      // Filter out blob URLs from localhost dev server
      if (line.includes("blob:")) {
        return false
      }

      // Apply base path filtering if provided
      if (basePath && line.includes(basePath)) {
        return false
      }

      return true
    })
    .filter((line) => line.trim() !== "")
    .map((line) => {
      // Remove base path if provided
      if (basePath) {
        line = line.replace(new RegExp(basePath, "g"), "")
      }
      return line
    })
    .join("\n")
}

/**
 * Creates a stack trace cleaner with custom options
 */
export const createStackTraceCleaner = (
  options: { basePath?: string } = {},
) => {
  return (stack?: string | null) => cleanStackTrace(stack, options)
}
