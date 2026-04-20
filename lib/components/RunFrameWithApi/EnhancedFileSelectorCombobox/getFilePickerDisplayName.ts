export const getFilePickerDisplayName = (filename: string) => {
  const basename = filename.split("/").pop() || ""

  if (basename.endsWith(".py.tsx")) {
    return basename.slice(0, -".tsx".length)
  }

  return basename
}
