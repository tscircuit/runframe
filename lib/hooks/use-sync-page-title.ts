import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { guessEntrypoint } from "lib/runner"
import { useEffect } from "react"

export const useSyncPageTitle = () => {
  const fsMap = useRunFrameStore((s) => s.fsMap)

  useEffect(() => {
    if (!document || !fsMap) return

    const fileKeys = Array.from(fsMap.keys())
    const entrypoint = guessEntrypoint(fileKeys)
    const packageJsonContent = fsMap.get("package.json")

    try {
      if (packageJsonContent) {
        const parsedPackageJson = JSON.parse(packageJsonContent)
        if (parsedPackageJson?.name) {
          document.title = parsedPackageJson.name
          return
        }
      }
    } catch (e) {}

    if (entrypoint) {
      document.title = entrypoint
    }
  }, [fsMap])
}
