import { useCallback, useState } from "react"

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
    (!params.has("main_component") || params.get("main_component") === filePath)
  ) {
    return hash.startsWith("#") ? hash : hash ? `#${hash}` : ""
  }
  params.set("file", filePath)
  if (params.has("main_component")) {
    params.set("main_component", filePath)
  }
  const nextHash = params.toString()
  return nextHash ? `#${nextHash}` : ""
}

export const useStaticCircuitJsonPathHash = (initialCircuitPath?: string) => {
  const [currentCircuitJsonPath, setCurrentCircuitJsonPath] = useState<string>(
    () => {
      if (typeof window === "undefined") return initialCircuitPath ?? ""
      return getInitialCircuitJsonPath({
        hash: window.location.hash,
        initialCircuitPath,
      })
    },
  )

  const updateFileHash = useCallback((filePath: string) => {
    if (typeof window === "undefined") return
    const newHash = getUpdatedCircuitJsonPathHash({
      hash: window.location.hash,
      filePath,
    })
    if (newHash === window.location.hash) return
    const newUrl = `${window.location.pathname}${window.location.search}${newHash}`
    window.history.replaceState(null, "", newUrl)
  }, [])

  return {
    currentCircuitJsonPath,
    setCurrentCircuitJsonPath,
    updateFileHash,
  }
}
