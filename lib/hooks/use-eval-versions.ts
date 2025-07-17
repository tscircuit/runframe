import { useEffect, useMemo, useState } from "react"
import { useLocalStorageState } from "./use-local-storage-state"
import { useRunnerStore } from "lib/components/RunFrame/runner-store/use-runner-store"

export const useEvalVersions = (allowSelecting: boolean) => {
  const [allVersions, setAllVersions] = useState<string[]>([])
  const [latest, setLatest] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useLocalStorageState<string | null>(
    "eval-version-selection",
    null,
  )

  const setLastRunEvalVersion = useRunnerStore((s) => s.setLastRunEvalVersion)
  const lastRunEvalVersion = useRunnerStore((s) => s.lastRunEvalVersion)

  useEffect(() => {
    if (!allowSelecting) return
    fetch("https://data.jsdelivr.com/v1/package/npm/@tscircuit/eval")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.versions)) {
          const versions = [...data.versions].reverse()
          setAllVersions(versions)
          if (data.tags?.latest) setLatest(data.tags.latest)
        }
      })
      .catch(() => {})
  }, [allowSelecting])

  useEffect(() => {
    if (!allowSelecting) return
    if (selected) {
      window.TSCIRCUIT_LATEST_EVAL_VERSION = selected
      setLastRunEvalVersion(selected)
    } else if (latest) {
      window.TSCIRCUIT_LATEST_EVAL_VERSION = latest
      setLastRunEvalVersion(latest)
    }
  }, [allowSelecting, selected, latest])

  const filtered = useMemo(
    () =>
      allVersions.filter((v) => v.includes(search)).slice(0, 50),
    [allVersions, search],
  )

  const selectVersion = (v: string | null) => {
    setSelected(v)
  }

  return {
    versions: filtered,
    latestVersion: latest,
    lastRunEvalVersion,
    search,
    setSearch,
    selectVersion,
  }
}
