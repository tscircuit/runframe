import { useCallback, useState } from "react"

const isEnabledFlag = (value: string | null) =>
  value !== null && !["0", "false", "off", "no"].includes(value.toLowerCase())

export const hasGalleryFlag = ({
  hash,
  search = "",
}: {
  hash: string
  search?: string
}) => {
  const hashParams = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash,
  )
  const searchParams = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search,
  )
  return (
    isEnabledFlag(hashParams.get("gallery")) ||
    isEnabledFlag(searchParams.get("gallery"))
  )
}

export const getInitialCircuitJsonPath = ({
  hash,
  initialCircuitPath,
}: {
  hash: string
  initialCircuitPath?: string
}) => {
  const params = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash,
  )
  return (
    params.get("file") ??
    params.get("main_component") ??
    initialCircuitPath ??
    ""
  )
}

export const getUpdatedCircuitJsonPathHash = ({
  hash,
  filePath,
}: {
  hash: string
  filePath: string
}) => {
  const params = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash,
  )
  if (
    params.get("file") === filePath &&
    !params.has("gallery") &&
    (!params.has("main_component") || params.get("main_component") === filePath)
  ) {
    return hash.startsWith("#") ? hash : hash ? `#${hash}` : ""
  }
  params.delete("gallery")
  params.set("file", filePath)
  if (params.has("main_component")) {
    params.set("main_component", filePath)
  }
  const nextHash = params.toString()
  return nextHash ? `#${nextHash}` : ""
}

export const useStaticCircuitJsonPathHash = (
  initialCircuitPath?: string,
  defaultToGallery = false,
) => {
  const [currentCircuitJsonPath, setCurrentCircuitJsonPath] = useState<string>(
    () => {
      if (typeof window === "undefined") return initialCircuitPath ?? ""
      return getInitialCircuitJsonPath({
        hash: window.location.hash,
        initialCircuitPath,
      })
    },
  )
  const [isGalleryVisible, setIsGalleryVisible] = useState(() => {
    if (typeof window === "undefined") return defaultToGallery
    return (
      defaultToGallery ||
      hasGalleryFlag({
        hash: window.location.hash,
        search: window.location.search,
      })
    )
  })

  const updateGalleryUrl = useCallback((visible: boolean) => {
    if (typeof window === "undefined") return
    const hashParams = new URLSearchParams(window.location.hash.slice(1))
    const searchParams = new URLSearchParams(window.location.search.slice(1))

    if (visible) {
      hashParams.set("gallery", "true")
    } else {
      hashParams.delete("gallery")
      searchParams.delete("gallery")
    }

    const search = searchParams.toString()
    const hash = hashParams.toString()
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`,
    )
  }, [])

  const showGallery = useCallback(() => {
    setIsGalleryVisible(true)
    updateGalleryUrl(true)
  }, [updateGalleryUrl])

  const hideGallery = useCallback(() => {
    setIsGalleryVisible(false)
    updateGalleryUrl(false)
  }, [updateGalleryUrl])

  const updateFileHash = useCallback((filePath: string) => {
    if (typeof window === "undefined") return
    const newHash = getUpdatedCircuitJsonPathHash({
      hash: window.location.hash,
      filePath,
    })
    const searchParams = new URLSearchParams(window.location.search.slice(1))
    searchParams.delete("gallery")
    const search = searchParams.toString()
    const newUrl = `${window.location.pathname}${search ? `?${search}` : ""}${newHash}`
    if (
      newHash === window.location.hash &&
      `${search ? `?${search}` : ""}` === window.location.search
    )
      return
    window.history.replaceState(null, "", newUrl)
  }, [])

  return {
    currentCircuitJsonPath,
    setCurrentCircuitJsonPath,
    updateFileHash,
    isGalleryVisible,
    showGallery,
    hideGallery,
  }
}
