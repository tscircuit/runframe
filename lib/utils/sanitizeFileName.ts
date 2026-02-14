export const sanitizeFileName = (name: string): string => {
  let sanitized = name
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
    .trim()

  // Prefix Windows reserved names (CON, PRN, AUX, NUL, COM0-9, LPT0-9)
  const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i
  if (reserved.test(sanitized)) {
    sanitized = `_${sanitized}`
  }

  // Limit to 200 characters
  sanitized = sanitized.slice(0, 200)

  // Fall back to "untitled" if empty
  return sanitized || "untitled"
}
