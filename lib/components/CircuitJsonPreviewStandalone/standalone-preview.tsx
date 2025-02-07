import { createRoot } from "react-dom/client"
import { CircuitJsonPreview, type TabId } from "../CircuitJsonPreview"

declare global {
  interface Window {
    CIRCUIT_JSON?: any
    CIRCUIT_JSON_PREVIEW_PROPS?: {
      autoRotate3dViewerDisabled?: boolean
      defaultActiveTab?: TabId
    }
  }
}

const root = createRoot(document.getElementById("root")!)

root.render(
  <CircuitJsonPreview
    defaultActiveTab={"cad"}
    autoRotate3dViewerDisabled={true}
    circuitJson={window.CIRCUIT_JSON || {}}
    {...(window.CIRCUIT_JSON_PREVIEW_PROPS || {})}
  />,
)
