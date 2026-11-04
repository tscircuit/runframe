import { cad_component } from "circuit-json"
import type { CircuitJson } from "circuit-json"

// An embedded asymmetric triangular prism keeps the example independent of
// external model servers and makes the viewing directions easy to distinguish.
const vertices = [
  [0, 0, 0],
  [24, 0, 0],
  [0, 16, 0],
  [0, 0, 12],
  [24, 0, 12],
  [0, 16, 12],
]
const faces = [
  [0, 2, 1],
  [3, 4, 5],
  [0, 1, 4],
  [0, 4, 3],
  [1, 2, 5],
  [1, 5, 4],
  [2, 0, 3],
  [2, 3, 5],
]
const stl = `solid bracket\n${faces
  .map(
    (face) =>
      `facet normal 0 0 0\nouter loop\n${face.map((index) => `vertex ${vertices[index].join(" ")}`).join("\n")}\nendloop\nendfacet`,
  )
  .join("\n")}\nendsolid bracket`

export const engineeringDrawingCircuit: CircuitJson = [
  {
    type: "source_group",
    source_group_id: "assembly",
    name: "BRACKET_ASSEMBLY",
  },
  {
    type: "source_component",
    source_component_id: "bracket",
    source_group_id: "assembly",
    name: "BRACKET",
    ftype: "simple_chip",
  },
  cad_component.parse({
    type: "cad_component",
    cad_component_id: "bracket_model",
    source_component_id: "bracket",
    position: { x: 12, y: 8, z: 6 },
    model_stl_url: `data:model/stl,${encodeURIComponent(stl)}`,
    model_origin_alignment: "center",
    model_unit_to_mm_scale_factor: 1,
  }),
  {
    type: "drawing_page",
    drawing_page_id: "overview",
    name: "Bracket overview",
    width: 210,
    height: 150,
  },
  {
    type: "drawing_part_view",
    drawing_part_view_id: "top",
    drawing_page_id: "overview",
    source_component_ids: ["bracket"],
    name: "Top",
    direction: "z_positive",
    center: { x: -50, y: 15 },
    width: 85,
    height: 90,
    show_hidden_edges: true,
  },
  {
    type: "drawing_part_view",
    drawing_part_view_id: "isometric",
    drawing_page_id: "overview",
    source_component_ids: ["bracket"],
    name: "Isometric",
    direction: "isometric",
    center: { x: 50, y: 15 },
    width: 85,
    height: 90,
  },
  {
    type: "drawing_dimension_line",
    drawing_dimension_line_id: "width",
    drawing_part_view_id: "top",
    start: { x: -86, y: -20 },
    end: { x: -14, y: -20 },
    text: "24 mm",
  },
  {
    type: "drawing_page",
    drawing_page_id: "section",
    name: "Bracket section",
    width: 210,
    height: 150,
  },
  {
    type: "drawing_part_view",
    drawing_part_view_id: "section_view",
    drawing_page_id: "section",
    source_group_id: "assembly",
    name: "Section A–A",
    direction: "z_positive",
    center: { x: 0, y: 5 },
    width: 140,
    height: 100,
    section: { axis: "z", offset: 6, keep_side: "less", hatch_spacing: 1 },
  },
]
