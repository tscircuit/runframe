import importer from "@tscircuit/internal-dynamic-import"
import type { CircuitJson, DrawingPartView } from "circuit-json"
import type { DrawingPageOutput } from "@tscircuit/circuit-json-to-drawing"
import type { GLTFScene } from "poppygl"

export const selectDrawingGeometry = (
  circuitJson: CircuitJson,
  view: DrawingPartView,
): CircuitJson => {
  if (!view.source_group_id && !view.source_component_ids) return circuitJson

  const groupIds = new Set<string>(
    view.source_group_id ? [view.source_group_id] : [],
  )
  const groups = circuitJson.filter((e) => e.type === "source_group")
  // Expand descendants regardless of document order, including nested assemblies.
  let previousSize = -1
  while (previousSize !== groupIds.size) {
    previousSize = groupIds.size
    for (const group of groups) {
      if (
        group.parent_source_group_id &&
        groupIds.has(group.parent_source_group_id)
      ) {
        groupIds.add(group.source_group_id)
      }
    }
  }
  const componentIds = new Set(view.source_component_ids ?? [])
  for (const element of circuitJson) {
    if (
      "source_component_id" in element &&
      element.source_component_id &&
      "source_group_id" in element &&
      element.source_group_id &&
      groupIds.has(element.source_group_id)
    ) {
      componentIds.add(element.source_component_id)
    }
  }
  const boardSubcircuitIds = new Set(
    groups
      .filter(
        (group) => groupIds.has(group.source_group_id) && group.is_subcircuit,
      )
      .map((group) => group.subcircuit_id)
      .filter((id): id is string => Boolean(id)),
  )

  // Keep placement and model context; filter the records that create geometry.
  return circuitJson.filter((element) => {
    switch (element.type) {
      case "cad_component":
      case "pcb_component":
        return componentIds.has(element.source_component_id)
      case "pcb_board":
        return Boolean(
          element.subcircuit_id &&
            boardSubcircuitIds.has(element.subcircuit_id),
        )
      case "pcb_panel":
        return false
      case "cad_cable":
        return (
          componentIds.has(element.from_source_component_id) &&
          componentIds.has(element.to_source_component_id)
        )
      default:
        return true
    }
  })
}

type GltfConverter = typeof import("circuit-json-to-gltf")
type Poppygl = typeof import("poppygl")

export const createDrawingSceneResolver = (
  circuitJson: CircuitJson,
  converter: Pick<
    GltfConverter,
    "convertCircuitJsonTo3D" | "convertSceneToGLTF"
  >,
  poppygl: Pick<Poppygl, "createSceneFromGLTF" | "bufferFromDataURI">,
) => {
  const scenes = new Map<string, Promise<GLTFScene>>()
  return (view: DrawingPartView): Promise<GLTFScene> => {
    const key = JSON.stringify([
      view.source_group_id,
      view.source_component_ids?.slice().sort(),
    ])
    let scene = scenes.get(key)
    if (!scene) {
      scene = (async () => {
        const selected = selectDrawingGeometry(circuitJson, view)
        if (
          !selected.some((element) =>
            ["cad_component", "pcb_board", "cad_cable"].includes(element.type),
          )
        ) {
          throw new Error(
            `No geometry selected for drawing view ${view.drawing_part_view_id}`,
          )
        }
        const model = await converter.convertCircuitJsonTo3D(selected, {
          renderBoardTextures: false,
        })
        const gltf = await converter.convertSceneToGLTF(model, {
          binary: false,
        })
        if (
          gltf instanceof ArrayBuffer ||
          !("buffers" in gltf) ||
          !Array.isArray(gltf.buffers)
        ) {
          throw new Error("Drawing geometry converter returned invalid glTF")
        }
        const result = poppygl.createSceneFromGLTF(gltf, {
          buffers: gltf.buffers.map((buffer: { uri: string }) =>
            poppygl.bufferFromDataURI(buffer.uri),
          ),
          images: [],
        })
        // The glTF exporter maps CAD XYZ to (-X, Z, Y). Drawing cameras and
        // section planes use (X, Z, -Y): rotate the exported world 180° about Y.
        for (const drawCall of result.drawCalls) {
          const matrix = new Float32Array(drawCall.model)
          for (let column = 0; column < 4; column++) {
            matrix[column * 4] *= -1
            matrix[column * 4 + 2] *= -1
          }
          drawCall.model = matrix
        }
        return result
      })()
      scenes.set(key, scene)
    }
    return scene
  }
}

export const renderDrawingPages = async (
  circuitJson: CircuitJson,
): Promise<DrawingPageOutput[]> => {
  const [drawing, poppygl, converter] = await Promise.all([
    import("@tscircuit/circuit-json-to-drawing"),
    import("poppygl"),
    importer("circuit-json-to-gltf@0.0.164") as Promise<GltfConverter>,
  ])
  return drawing.convertCircuitJsonToDrawingPages(circuitJson, {
    resolveScene: createDrawingSceneResolver(circuitJson, converter, poppygl),
  })
}
