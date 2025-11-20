import * as React from "react"
import { ImportComponentDialog2 } from "./ImportComponentDialog2"
import type {
  ImportComponentDialog2Props,
  JlcpcbComponentTsxLoadedPayload,
  KicadStringSelectedPayload,
  TscircuitPackageSelectedPayload,
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

  const handleTscircuitPackageSelected = async ({
    result,
    fullPackageName,
  }: TscircuitPackageSelectedPayload) => {
    const packageName = result.package.unscoped_name
    const displayName = packageName ?? result.package.name

    await toast.promise(
      pushEvent({
        event_type: "INSTALL_PACKAGE",
        full_package_name: fullPackageName,
      }),
      {
        loading: `Requesting install for "${displayName}"`,
        success: `Install requested for "${displayName}"`,
        error: (error) =>
          `Failed to request install: ${
            error instanceof Error ? error.message : String(error)
          }`,
      },
    )
  }

  const handleKicadStringSelected = async ({
    footprint,
  }: KicadStringSelectedPayload) => {
    await toast.promise(navigator.clipboard.writeText(footprint), {
      loading: `Copying "${footprint}"`,
      success: `Copied "${footprint}" to clipboard`,
      error: (error) =>
        `Failed to copy footprint: ${
          error instanceof Error ? error.message : String(error)
        }`,
    })
  }

  const handleJlcpcbComponentTsxLoaded = async ({
    result,
    tsx,
  }: JlcpcbComponentTsxLoadedPayload) => {
    const componentName = extractComponentName(tsx)
    const filePath = `imports/${componentName}.tsx`

    await toast.promise(upsertFile(filePath, tsx), {
      loading: `Importing ${result.component.partNumber}`,
      success: `Imported to "${filePath}"`,
      error: (error) =>
        `Failed to import component: ${
          error instanceof Error ? error.message : String(error)
        }`,
    })
  }

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
