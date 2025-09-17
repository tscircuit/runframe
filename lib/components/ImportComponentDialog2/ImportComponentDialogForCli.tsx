import * as React from "react"
import { ImportComponentDialog2 } from "./ImportComponentDialog2"
import type {
  ComponentSearchResult,
  ImportComponentDialog2Props,
} from "./types"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { toast } from "lib/utils/toast"

type CliImportDialogProps = Omit<
  ImportComponentDialog2Props,
  | "onKicadStringSelected"
  | "onTscircuitPackageSelected"
  | "onJlcpcbComponentTsxLoaded"
>

const extractComponentName = (tsx: string) => {
  const match = tsx.match(/export const (\w+) =/)
  if (!match) {
    throw new Error("Could not determine component name from TSX contents")
  }
  return match[1]
}

export const ImportComponentDialogForCli = (props: CliImportDialogProps) => {
  const pushEvent = useRunFrameStore((state) => state.pushEvent)
  const upsertFile = useRunFrameStore((state) => state.upsertFile)

  const handleTscircuitPackageSelected = React.useCallback(
    async ({
      component,
      fullPackageName,
    }: {
      component: ComponentSearchResult
      fullPackageName: string
    }) => {
      await toast.promise(
        pushEvent({
          event_type: "INSTALL_PACKAGE",
          full_package_name: fullPackageName,
        }),
        {
          loading: `Requesting install for "${component.name}"`,
          success: `Install requested for "${component.name}"`,
          error: (error) =>
            `Failed to request install: ${
              error instanceof Error ? error.message : String(error)
            }`,
        },
      )

      // TODO wait on event indicating the package was successfully installed
      throw new Error("Not implemented")
    },
    [pushEvent],
  )

  const handleKicadStringSelected = React.useCallback(
    async ({
      component,
      footprint,
    }: {
      component: ComponentSearchResult
      footprint: string
    }) => {
      await toast.promise(navigator.clipboard.writeText(footprint), {
        loading: `Copying "${footprint}"`,
        success: `Copied "${footprint}" to clipboard`,
        error: (error) =>
          `Failed to copy footprint: ${
            error instanceof Error ? error.message : String(error)
          }`,
      })
    },
    [],
  )

  const handleJlcpcbComponentTsxLoaded = React.useCallback(
    async ({
      component,
      tsx,
    }: {
      component: ComponentSearchResult
      tsx: string
    }) => {
      const componentName = extractComponentName(tsx)
      const filePath = `imports/${componentName}.tsx`

      await toast.promise(upsertFile(filePath, tsx), {
        loading: `Importing ${component.partNumber ?? component.name}`,
        success: `Imported to "${filePath}"`,
        error: (error) =>
          `Failed to import component: ${
            error instanceof Error ? error.message : String(error)
          }`,
      })
    },
    [upsertFile],
  )

  return (
    <ImportComponentDialog2
      {...props}
      onTscircuitPackageSelected={handleTscircuitPackageSelected}
      onKicadStringSelected={handleKicadStringSelected}
      onJlcpcbComponentTsxLoaded={handleJlcpcbComponentTsxLoaded}
    />
  )
}

ImportComponentDialogForCli.displayName = "ImportComponentDialogForCli"
