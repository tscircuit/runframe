import { ImageIcon } from "lucide-react"
import { useState } from "react"
import type { CircuitJsonFileReference } from "./RunFrameStaticBuildViewer"

export const getCircuitPreviewImageUrls = (
  fileRef: CircuitJsonFileReference,
) => {
  const assetUrl = fileRef.fileStaticAssetUrl
  const queryOrHashIndex = assetUrl.search(/[?#]/)
  const path =
    queryOrHashIndex === -1 ? assetUrl : assetUrl.slice(0, queryOrHashIndex)
  const suffix = queryOrHashIndex === -1 ? "" : assetUrl.slice(queryOrHashIndex)
  const directory = path.includes("/")
    ? path.slice(0, path.lastIndexOf("/") + 1)
    : ""

  return ["3d.png", "pcb.png", "pcb.svg", "schematic.png", "schematic.svg"].map(
    (fileName) => `${directory}${fileName}${suffix}`,
  )
}

const getCircuitDisplayName = (filePath: string) => {
  const fileName = filePath.split("/").pop() ?? filePath
  return fileName.replace(/(\.board|\.circuit)?\.(tsx|jsx|json)$/i, "")
}

const CircuitGalleryPreviewImage = ({
  fileRef,
}: {
  fileRef: CircuitJsonFileReference
}) => {
  const previewUrls = getCircuitPreviewImageUrls(fileRef)
  const [previewIndex, setPreviewIndex] = useState(0)

  if (previewIndex >= previewUrls.length) {
    return (
      <div className="rf-flex rf-h-full rf-w-full rf-items-center rf-justify-center rf-bg-zinc-100 rf-text-zinc-400">
        <ImageIcon className="rf-h-8 rf-w-8" aria-hidden="true" />
      </div>
    )
  }

  return (
    <img
      src={previewUrls[previewIndex]}
      alt={`Preview of ${getCircuitDisplayName(fileRef.filePath)}`}
      className="rf-h-full rf-w-full rf-object-contain rf-transition-transform rf-duration-200 group-hover:rf-scale-[1.03]"
      loading="lazy"
      onError={() => setPreviewIndex((index) => index + 1)}
    />
  )
}

export const CircuitGallery = ({
  files,
  projectName,
  onSelectFile,
}: {
  files: CircuitJsonFileReference[]
  projectName?: string
  onSelectFile: (filePath: string) => void
}) => {
  return (
    <main className="rf-h-full rf-w-full rf-overflow-y-auto rf-bg-zinc-50">
      <div className="rf-mx-auto rf-w-full rf-max-w-7xl rf-px-5 rf-py-8 sm:rf-px-8 sm:rf-py-10">
        <div className="rf-mb-7">
          <p className="rf-mb-1 rf-text-xs rf-font-medium rf-uppercase rf-tracking-wider rf-text-zinc-500">
            {projectName ?? "tscircuit project"}
          </p>
          <h1 className="rf-text-2xl rf-font-semibold rf-tracking-tight rf-text-zinc-950 sm:rf-text-3xl">
            Circuit gallery
          </h1>
          <p className="rf-mt-2 rf-text-sm rf-text-zinc-600">
            Explore {files.length} {files.length === 1 ? "board" : "boards"}.
            Select one to open its interactive preview.
          </p>
        </div>

        <div className="rf-grid rf-grid-cols-1 rf-gap-5 sm:rf-grid-cols-2 lg:rf-grid-cols-3">
          {files.map((fileRef) => (
            <button
              type="button"
              key={fileRef.filePath}
              onClick={() => onSelectFile(fileRef.filePath)}
              className="group rf-overflow-hidden rf-rounded-xl rf-border rf-border-zinc-200 rf-bg-white rf-text-left rf-shadow-sm rf-transition-all hover:rf--translate-y-0.5 hover:rf-border-zinc-300 hover:rf-shadow-md focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-zinc-900 focus-visible:rf-ring-offset-2"
            >
              <div className="rf-aspect-[4/3] rf-w-full rf-overflow-hidden rf-bg-white rf-p-3">
                <CircuitGalleryPreviewImage fileRef={fileRef} />
              </div>
              <div className="rf-border-t rf-border-zinc-100 rf-px-4 rf-py-3">
                <div className="rf-truncate rf-text-sm rf-font-medium rf-text-zinc-900">
                  {getCircuitDisplayName(fileRef.filePath)}
                </div>
                <div className="rf-mt-0.5 rf-truncate rf-text-xs rf-text-zinc-500">
                  {fileRef.filePath}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </main>
  )
}
