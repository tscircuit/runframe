import { CircuitJsonPreview } from "../lib/components/CircuitJsonPreview/CircuitJsonPreview"
import { engineeringDrawingCircuit } from "./assets/engineering-drawing"

export default {
  "Choose Engineering Drawing from More views": () => (
    <CircuitJsonPreview
      circuitJson={engineeringDrawingCircuit}
      allowSelectingVersion={false}
    />
  ),
  "Drawing pages and section views": () => (
    <CircuitJsonPreview
      circuitJson={engineeringDrawingCircuit}
      availableTabs={["engineering_drawing"]}
      defaultActiveTab="engineering_drawing"
      allowSelectingVersion={false}
    />
  ),
  "No engineering drawings": () => (
    <CircuitJsonPreview
      circuitJson={[]}
      defaultActiveTab="engineering_drawing"
      allowSelectingVersion={false}
    />
  ),
}
