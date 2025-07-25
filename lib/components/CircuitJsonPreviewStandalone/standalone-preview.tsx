import { createRoot } from "react-dom/client"
import {
  CircuitJsonPreview,
  type TabId,
} from "../CircuitJsonPreview/CircuitJsonPreview"

declare global {
  interface Window {
    CIRCUIT_JSON?: any
    CIRCUIT_JSON_PREVIEW_PROPS?: {
      autoRotate3dViewerDisabled?: boolean
      defaultActiveTab?: TabId
      defaultTab?: TabId
      availableTabs?: TabId[]
      showRightHeaderContent?: boolean
    }
  }
}

const root = createRoot(document.getElementById("root")!)

root.render(
  <div style={{ height: "100vh" }}>
    <CircuitJsonPreview
      defaultActiveTab={"cad"}
      autoRotate3dViewerDisabled={true}
      showRightHeaderContent={false}
      circuitJson={window.CIRCUIT_JSON || {}}
      {...(window.CIRCUIT_JSON_PREVIEW_PROPS || {})}
    />
  </div>,
)
