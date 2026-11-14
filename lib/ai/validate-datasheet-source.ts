import {
  getDatasheetAssetFiles,
  type DatasheetAssets,
  type DatasheetUsageKind,
} from "./datasheet-assets"

/** Catch invalid modules before marking a saved asset as added to the project. */
export const validateDatasheetSource = async (
  assets: DatasheetAssets,
  selection: DatasheetUsageKind,
) => {
  const { parse } = await import("@babel/parser")
  const files = getDatasheetAssetFiles(assets, selection)
  const modules = new Set(
    files
      .filter((file) => file.filename.endsWith(".tsx"))
      .map((file) => file.filename),
  )
  for (const file of files) {
    if (!modules.has(file.filename)) continue
    try {
      const ast = parse(file.content, {
        sourceType: "module",
        plugins: ["typescript", "jsx"],
      })
      const hasDefault = ast.program.body.some(
        (node) =>
          node.type === "ExportDefaultDeclaration" ||
          (node.type === "ExportNamedDeclaration" &&
            node.specifiers.some(
              (specifier) =>
                specifier.type === "ExportSpecifier" &&
                (specifier.exported.type === "Identifier"
                  ? specifier.exported.name
                  : specifier.exported.value) === "default",
            )),
      )
      if (!hasDefault) throw new Error("Export a default component.")
      for (const node of ast.program.body) {
        const path =
          node.type === "ImportDeclaration" ||
          node.type === "ExportNamedDeclaration" ||
          node.type === "ExportAllDeclaration"
            ? node.source?.value
            : undefined
        if (!path?.startsWith(".")) continue
        const name = path.startsWith("./") ? path.slice(2) : path
        const module = name.endsWith(".tsx") ? name : name + ".tsx"
        if (!modules.has(module))
          throw new Error(
            `The import ${JSON.stringify(path)} does not resolve to a generated TSX module.`,
          )
      }
    } catch (error) {
      throw new Error(
        `${file.filename}: ${error instanceof Error ? error.message : "Invalid module source."}`,
      )
    }
  }
}
