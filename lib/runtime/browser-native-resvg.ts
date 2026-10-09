/** Native resvg cannot run in a browser. Browser renderers must use canvas/WASM. */
export class Resvg {
  constructor() {
    throw new Error(
      "Native resvg is unavailable in the offline browser build. This feature needs a local browser renderer.",
    )
  }
}
