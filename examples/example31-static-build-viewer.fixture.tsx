import { renderToCircuitJson } from "lib/dev/render-to-circuit-json"
import {
  RunFrameStaticBuildViewer,
  type CircuitJsonFileReference,
} from "../lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer"
import type { CircuitJson } from "circuit-json"

const sampleCircuitJson1: CircuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm">
    <resistor name="R1" schX={-1} resistance="1k" footprint="0402" />
    <resistor name="R2" schX={1} resistance="1k" footprint="0402" />
  </board>,
)

const sampleCircuitJson2: CircuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm"></board>,
)
const sampleCircuitJson3: CircuitJson = renderToCircuitJson(
  <board width="10mm" height="10mm">
    <group name="wow">
      <resistor resistance="1k" footprint="0402" name="R1" />
      <capacitor capacitance="1000pF" footprint="0402" name="C1" />
      <trace from=".R1 > .pin1" to=".C1 > .pin1" />
    </group>
  </board>,
)
const circuitJsonFiles = {
  "main.circuit.tsx": sampleCircuitJson1,
  "index.circuit.tsx": sampleCircuitJson3,
  "components/blank.circuit.tsx": sampleCircuitJson2,
  "examples/group.circuit.tsx": sampleCircuitJson3,
}

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
export const basic = () => (
  <RunFrameStaticBuildViewer
    circuitJsonFiles={circuitJsonFiles}
    projectName="test-project"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export const emptyFiles = () => (
  <RunFrameStaticBuildViewer
    circuitJsonFiles={{}}
    projectName="empty-project"
  />
)

export const fullFledge = () => (
  <RunFrameStaticBuildViewer
    circuitJsonFiles={circuitJsonFiles}
    projectName="empty-project"
    debug={true}
    initialCircuitPath="d"
    onCircuitJsonPathChange={(c) => {
      console.info(c)
    }}
    defaultToFullScreen={false}
    showToggleFullScreen={true}
    showFileMenu={false}
  />
)

export const lazyLoadingBasic = () => (
  <RunFrameStaticBuildViewer
    files={circuitJsonFileAssets}
    onFetchFile={mockFetchFile}
    projectName="lazy-loading-project"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export const lazyLoadingWithInitialFile = () => (
  <RunFrameStaticBuildViewer
    files={circuitJsonFileAssets}
    onFetchFile={mockFetchFile}
    initialCircuitPath="example/circuit.tsx"
    projectName="lazy-loading-project"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export const lazyLoadingWithoutCustomFetch = () => (
  <RunFrameStaticBuildViewer
    files={circuitJsonFileAssetsExternal}
    projectName="lazy-loading-default-fetch"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export const lazyLoadingEmptyFiles = () => (
  <RunFrameStaticBuildViewer files={[]} projectName="empty-lazy-project" />
)

export const mixedApiUsage = () => (
  <RunFrameStaticBuildViewer
    circuitJsonFiles={circuitJsonFiles}
    files={circuitJsonFileAssetsExternal}
    projectName="mixed-api-project"
    defaultToFullScreen={false}
    showToggleFullScreen={true}
  />
)

export default {
  basic,
  emptyFiles,
  fullFledge,
  lazyLoadingBasic,
  lazyLoadingWithInitialFile,
  lazyLoadingWithoutCustomFetch,
  lazyLoadingEmptyFiles,
  mixedApiUsage,
}
