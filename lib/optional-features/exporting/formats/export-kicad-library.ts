import type { CircuitJson } from "circuit-json"
import JSZip from "jszip"
import { CircuitJsonToKicadLibraryConverter } from "circuit-json-to-kicad"
import { openForDownload } from "../open-for-download"

export const createKicadLibraryZip = async ({
  circuitJson,
  libraryName,
}: {
  circuitJson: CircuitJson
  libraryName: string
}) => {
  const libConverter = new CircuitJsonToKicadLibraryConverter(
    circuitJson as any,
    {
      libraryName,
      footprintLibraryName: libraryName,
    },
  )
  libConverter.runUntilFinished()
  const libOutput = libConverter.getOutput()

  const zip = new JSZip()

  // Add symbol library
  zip.file(`${libraryName}.kicad_sym`, libOutput.kicadSymString)

  // Add footprints to .pretty folder
  for (const fp of libOutput.footprints) {
    const libraryFolder = zip.folder(`${libraryName}.pretty`)
    if (libraryFolder) {
      libraryFolder.file(
        `${fp.footprintName}.kicad_mod`,
        `${fp.kicadModString}\n`,
      )
    }
  }

  // Fetch 3D model files via HTTP and add to .3dshapes folder
  if (libOutput.model3dSourcePaths.length > 0) {
    const shapesFolder = zip.folder(`${libraryName}.3dshapes`)
    if (shapesFolder) {
      for (const modelPath of libOutput.model3dSourcePaths) {
        try {
          const filename = modelPath.split("/").pop() || modelPath
          const response = await fetch(modelPath)
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            shapesFolder.file(filename, arrayBuffer)
          }
        } catch {
          // Skip files that can't be fetched
        }
      }
    }
  }

  // Add library tables
  zip.file("fp-lib-table", libOutput.fpLibTableString)
  zip.file("sym-lib-table", libOutput.symLibTableString)

  return zip
}

export const exportKicadLibrary = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  const zip = await createKicadLibraryZip({
    circuitJson,
    libraryName: projectName,
  })
  const zipBlob = await zip.generateAsync({ type: "blob" })

  openForDownload(zipBlob, {
    fileName: `${projectName}_kicad_library.zip`,
  })
}
