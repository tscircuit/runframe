export const sanitizeFileName = (name: string): string => {
  let sanitized = name
    .trim() // Move trim to the start
    // Replace invalid characters (\ / : * ? " < > |) with underscores
    .replace(/[\\/:*?"<>|]/g, "_")
    // Remove control characters
    .replace(/[\x00-\x1f]/g, "")
    // Strip leading dots
    .replace(/^\.+/, "")
    // Strip trailing dots
    .replace(/\.+$/, "")
    // Collapse multiple whitespace to single space
    .replace(/\s+/g, " ")
    // Collapse multiple underscores
    .replace(/_+/g, "_")

  // Device names remain reserved before an extension, including superscript digits.
  const reserved = /^(con|prn|aux|nul|com[0-9¹²³]|lpt[0-9¹²³])(\.|$)/i
  if (reserved.test(sanitized)) {
    sanitized = `_${sanitized}`
  }

  // Limit to 200 characters
  sanitized = sanitized.slice(0, 200)

  // Fall back to "untitled" if empty
  return sanitized || "untitled"
}
