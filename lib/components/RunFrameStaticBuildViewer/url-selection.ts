export const getUrlSelectedFileFromLocation = (
  search: string,
  hash: string,
): string | null => {
  const searchParams = new URLSearchParams(search)
  const hashParams = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash)

  return (
    hashParams.get("file") ??
    hashParams.get("main_component") ??
    searchParams.get("file") ??
    searchParams.get("main_component")
  )
}

export const getUpdatedHashForFileSelection = (
  hash: string,
  filePath: string,
): string | null => {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash)

  if (
    params.get("file") === filePath &&
    (!params.has("main_component") || params.get("main_component") === filePath)
  ) {
    return null
  }

  params.set("file", filePath)
  if (params.has("main_component")) {
    params.set("main_component", filePath)
  }

  const newHash = params.toString()
  return newHash.length > 0 ? `#${newHash}` : ""
}
