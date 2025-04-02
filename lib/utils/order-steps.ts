import type { Step } from "lib/components/OrderDialog/StepwiseProgress"

export const orderSteps: Step[] = [
  { order_step_id: 1, key: "are_gerbers_generated", title: "Generate Gerbers" },
  { order_step_id: 2, key: "are_gerbers_uploaded", title: "Upload Gerbers" },
  { order_step_id: 3, key: "is_gerber_analyzed", title: "Analyze Gerber" },
  {
    order_step_id: 4,
    key: "are_initial_costs_calculated",
    title: "Calculate Initial Costs",
  },
  { order_step_id: 5, key: "is_pcb_added_to_cart", title: "Add PCB to Cart" },
  { order_step_id: 6, key: "is_bom_uploaded", title: "Upload BOM" },
  { order_step_id: 7, key: "is_pnp_uploaded", title: "Upload PnP" },
  { order_step_id: 8, key: "is_bom_pnp_analyzed", title: "Analyze BOM & PnP" },
  {
    order_step_id: 9,
    key: "is_bom_parsing_complete",
    title: "BOM Parsing Complete",
  },
  {
    order_step_id: 10,
    key: "are_components_available",
    title: "Components Available",
  },
  {
    order_step_id: 11,
    key: "is_patch_map_generated",
    title: "Generate Patch Map",
  },
  {
    order_step_id: 12,
    key: "is_json_merge_file_created",
    title: "Create JSON Merge File",
  },
  {
    order_step_id: 13,
    key: "is_dfm_result_generated",
    title: "Generate DFM Result",
  },
  { order_step_id: 14, key: "are_files_downloaded", title: "Download Files" },
  {
    order_step_id: 15,
    key: "are_product_categories_fetched",
    title: "Fetch Product Categories",
  },
  {
    order_step_id: 16,
    key: "are_final_costs_calculated",
    title: "Calculate Final Costs",
  },
  {
    order_step_id: 17,
    key: "is_json_merge_file_updated",
    title: "Update JSON Merge File",
  },
  { order_step_id: 18, key: "is_added_to_cart", title: "Add to Cart" },
].map((step, index) => ({
  ...step,
  completed: false,
  active: index === 0, // First step starts as active
}))
