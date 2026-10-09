import { useRunFrameRuntime } from "lib/runtime/context"
import { useEffect, useMemo, useState } from "react"
import { useLocalStorageState } from "./use-local-storage-state"
import { useRunnerStore } from "lib/components/RunFrame/runner-store/use-runner-store"

export const useEvalVersions = (allowSelecting: boolean) => {
  const runtime = useRunFrameRuntime()
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
    if (!allowSelecting || runtime.mode === "offline") return
    fetch("https://data.jsdelivr.com/v1/package/npm/@tscircuit/eval")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.versions)) {
          let versions = [...data.versions]
          if (data.tags?.latest) {
            setLatest(data.tags.latest)
            versions = versions.filter((v) => v !== data.tags.latest)
          }
          setAllVersions(versions)
        }
      })
      .catch(() => {})
  }, [allowSelecting, runtime])

  useEffect(() => {
    if (!allowSelecting || runtime.mode === "offline") return
    if (selected) {
      window.TSCIRCUIT_LATEST_EVAL_VERSION = selected
      setLastRunEvalVersion(selected)
    } else if (latest) {
      window.TSCIRCUIT_LATEST_EVAL_VERSION = latest
      setLastRunEvalVersion(latest)
    }
  }, [allowSelecting, selected, latest, runtime])

  const filtered = useMemo(
    () => allVersions.filter((v) => v.includes(search)).slice(0, 50),
    [allVersions, search],
  )

  const selectVersion = (v: string | null) => {
    if (runtime.mode === "offline") return
    setSelected(v)
    setSearch("")
  }

  return {
    versions:
      runtime.mode === "offline"
        ? runtime.evalVersion
          ? [runtime.evalVersion]
          : []
        : filtered,
    latestVersion:
      runtime.mode === "offline" ? (runtime.evalVersion ?? null) : latest,
    lastRunEvalVersion,
    search,
    setSearch,
    selectVersion,
  }
}
