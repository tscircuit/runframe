import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer" 

export const ExampleRunFrameStaticBuildViewer = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <RunFrameStaticBuildViewer
        buildDirectoryUrl="https://example.com/circuit-build" 
        debug={false}
        defaultActiveTab="pcb"
        defaultToFullScreen={false}
        showToggleFullScreen={true}
        onCircuitJsonLoaded={(circuitJson) => {
          console.log("Circuit JSON loaded:", circuitJson)
        }}
      />
    </div>
  )
}
