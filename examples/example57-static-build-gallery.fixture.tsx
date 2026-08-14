import {
  RunFrameStaticBuildViewer,
  type CircuitJsonFileReference,
} from "../lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer"

const generatedDistFiles: CircuitJsonFileReference[] = [
  {
    filePath: "boards/controller.board.tsx",
    fileStaticAssetUrl:
      "/example-static-gallery/boards/controller/circuit.json",
  },
  {
    filePath: "boards/power-module.board.tsx",
    fileStaticAssetUrl:
      "/example-static-gallery/boards/power-module/circuit.json",
  },
  {
    filePath: "boards/sensor-node.board.tsx",
    fileStaticAssetUrl:
      "/example-static-gallery/boards/sensor-node/circuit.json",
  },
]

export default () => (
  <RunFrameStaticBuildViewer
    files={generatedDistFiles}
    projectName="tsci build --site gallery"
    defaultToGallery
    defaultToFullScreen={false}
    showToggleFullScreen
  />
)
