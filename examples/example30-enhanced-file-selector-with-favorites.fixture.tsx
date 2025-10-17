import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useState, useEffect } from "react"
import { DebugEventsTable } from "./utils/DebugEventsTable"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"
import { EnhancedFileSelectorCombobox } from "lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox"
import { useLocalStorageState } from "lib/hooks/use-local-storage-state"

export default () => {
  const [currentFile, setCurrentFile] = useLocalStorageState(
    "runframe:example30-favorites:current-file",
    "",
  )
  const [favorites, setFavorites] = useLocalStorageState<string[]>(
    "runframe:example30-favorites:favorites",
    [
      "main.tsx",
      "modules/power/PowerModule.tsx",
      "components/display/LedMatrix.tsx",
    ],
  )
  const fsMap = useRunFrameStore((s) => s.fsMap)
  const loadInitialFiles = useRunFrameStore((s) => s.loadInitialFiles)
  const allFiles = Array.from(fsMap.keys())

  const handleToggleFavorite = (filePath: string) => {
    setFavorites((prev) =>
      prev.includes(filePath)
        ? prev.filter((f) => f !== filePath)
        : [...prev, filePath],
    )
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `${window.location.origin}/registry`
      window.TSCIRCUIT_REGISTRY_TOKEN =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYWNjb3VudC0xMjM0IiwiZ2l0aHViX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJzZXNzaW9uX2lkIjoic2Vzc2lvbi0xMjM0IiwidG9rZW4iOiIxMjM0In0.KvHMnB_ths0mI-f8Tj-t-OTOGRUPOEbFunima0dgMcQ"
    }
  }, [])

  useEffect(() => {
    loadInitialFiles()

    setTimeout(async () => {
      fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const filesToCreate = [
        {
          path: "main.tsx",
          content: `export default () => <board width="50mm" height="40mm" />`,
        },
        {
          path: "components/display/LedMatrix.tsx",
          content: `export const LedMatrix = () => <group name="LedMatrix" />`,
        },
        {
          path: "components/display/Molecule4x2MedShort.tsx",
          content: `export const Molecule4x2MedShort = () => <group name="Molecule4x2" />`,
        },
        {
          path: "components/display/Molecule6x2MedShort.tsx",
          content: `export const Molecule6x2MedShort = () => <group name="Molecule6x2" />`,
        },
        {
          path: "components/display/Molecule8x8MedShort.tsx",
          content: `export const Molecule8x8MedShort = () => <group name="Molecule8x8" />`,
        },
        {
          path: "components/display/Molecule8x8MedStandard.tsx",
          content: `export const Molecule8x8MedStandard = () => <group name="Molecule8x8" />`,
        },
        {
          path: "components/display/Molecule16x16MedStandard.tsx",
          content: `export const Molecule16x16MedStandard = () => <group name="Molecule16x16" />`,
        },
        {
          path: "components/display/Molecule32x32MedStandard.tsx",
          content: `export const Molecule32x32MedStandard = () => <group name="Molecule32x32" />`,
        },
        {
          path: "modules/power/PowerModule.tsx",
          content: `export const PowerModule = () => <group name="PowerModule" />`,
        },
        {
          path: "sensors/SensorArray.tsx",
          content: `export const SensorArray = () => <group name="SensorArray" />`,
        },
        {
          path: "utils/helpers.ts",
          content: `export const calculateResistance = (v: number, i: number) => v / i`,
        },
        {
          path: "config/development.json",
          content: JSON.stringify({ debug: true }, null, 2),
        },
      ]

      for (const file of filesToCreate) {
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: file.path,
            text_content: file.content,
          }),
        })
      }

      // Set initial file after creation
      setTimeout(() => {
        setCurrentFile("main.tsx")
      }, 100)
    }, 500)
  }, [])

  // Auto-select first file when files load
  useEffect(() => {
    if (!currentFile && allFiles.length > 0) {
      setCurrentFile(allFiles[0])
    }
  }, [allFiles, currentFile])

  if (!isFileApiAccessible()) {
    return (
      <div className="rf-p-8">
        <h1 className="rf-text-2xl rf-font-bold rf-mb-4">
          Enhanced File Selector with Favorites
        </h1>
        <p className="rf-text-muted-foreground">
          API not available - try locally!
        </p>
      </div>
    )
  }

  return (
    <div className="rf-h-screen rf-flex rf-flex-col">
      <div className="rf-p-8 rf-border-b rf-bg-gradient-to-r rf-from-slate-50 rf-to-blue-50">
        <h1 className="rf-text-2xl rf-font-bold rf-mb-6 rf-text-center">
          Enhanced File Selector Demo
        </h1>
        <div className="rf-flex rf-justify-center rf-mb-4">
          <EnhancedFileSelectorCombobox
            files={allFiles}
            currentFile={currentFile}
            onFileChange={setCurrentFile}
            config={{
              pinnedFiles: favorites,
              onToggleFavorite: handleToggleFavorite,
              placeholder: "Choose a file...",
              searchPlaceholder: "Search files...",
            }}
          />
        </div>
        <div className="rf-text-center rf-text-sm rf-text-muted-foreground">
          Selected:{" "}
          <strong className="rf-text-slate-800">
            {currentFile || "(none)"}
          </strong>
        </div>
      </div>
    </div>
  )
}
