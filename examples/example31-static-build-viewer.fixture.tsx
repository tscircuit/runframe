import {
  RunFrameStaticBuildViewer,
  type CircuitJsonFileReference,
} from "../lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer"
import type { CircuitJson } from "circuit-json"

const circuitJsonFileAssets: CircuitJsonFileReference[] = [
  {
    filePath: "index.circuit.tsx",
    fileStaticAssetUrl:
      "https://api.tscircuit.com/package_files/get?file_path=dist/circuit.json&package_release_id=73d16b85-e199-4700-b8cf-825725d6aaef",
  },
  {
    filePath: "main.circuit.tsx",
    fileStaticAssetUrl:
      "https://api.tscircuit.com/package_files/get?file_path=dist/circuit.json&package_release_id=28a58d52-d924-4583-a53c-8f90b74219b6",
  },
  {
    filePath: "example/circuit.tsx",
    fileStaticAssetUrl:
      "https://api.tscircuit.com/package_files/get?file_path=dist/circuit.json&package_release_id=8b90619f-14ef-4c5a-89f1-2476566c08a5",
  },
]

const circuitJsonFileAssetsExternal: CircuitJsonFileReference[] = [
  {
    filePath: "index.tsx",
    fileStaticAssetUrl:
      "https://raw.githubusercontent.com/tscircuit/circuitjson.com/94fa2b7635fd82b5e9b54de13b5a2f11b58b0611/assets/usb-c-flashlight.json",
  },
  {
    filePath: "circuit.tsx",
    fileStaticAssetUrl:
      "https://raw.githubusercontent.com/tscircuit/3d-viewer/c7bc63e5a678e71ba99b4831d32e665e98b43bc4/stories/assets/left-flashlight-board.json",
  },
]

const mockFetchFile = async (
  fileRef: CircuitJsonFileReference,
): Promise<CircuitJson> => {
  const res = await fetch(String(fileRef.fileStaticAssetUrl))
  const resJson = await res.json()
  return JSON.parse(resJson.package_file.content_text)
}
export const wErrorHandler = () => (
  <RunFrameStaticBuildViewer
    files={[circuitJsonFileAssets[0], circuitJsonFileAssetsExternal[0]]}
    onFetchFile={mockFetchFile}
    projectName="test-project"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export const emptyFiles = () => (
  <RunFrameStaticBuildViewer files={[]} projectName="empty-project" />
)

export const fullFledge = () => (
  <RunFrameStaticBuildViewer
    files={circuitJsonFileAssets}
    onFetchFile={mockFetchFile}
    projectName="full-featured-project"
    debug={true}
    initialCircuitPath="index.tsx"
    onCircuitJsonPathChange={(c) => {
      console.info(c)
    }}
    defaultToFullScreen={false}
    showToggleFullScreen={true}
    showFileMenu={false}
  />
)

export const LoadingBasic = () => (
  <RunFrameStaticBuildViewer
    files={circuitJsonFileAssets}
    onFetchFile={mockFetchFile}
    projectName="project"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export const LoadingWithInitialFile = () => (
  <RunFrameStaticBuildViewer
    files={circuitJsonFileAssets}
    onFetchFile={mockFetchFile}
    initialCircuitPath="example/circuit.tsx"
    projectName="project"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export const LoadingWithoutCustomFetch = () => (
  <RunFrameStaticBuildViewer
    files={circuitJsonFileAssetsExternal}
    projectName="loading-default-fetch"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export const ProjectExample = () => (
  <RunFrameStaticBuildViewer
    files={[...circuitJsonFileAssets, ...circuitJsonFileAssetsExternal]}
    onFetchFile={mockFetchFile}
    projectName="project"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export default {
  wErrorHandler,
  emptyFiles,
  fullFledge,
  LoadingBasic,
  LoadingWithInitialFile,
  LoadingWithoutCustomFetch,
  ProjectExample,
}
