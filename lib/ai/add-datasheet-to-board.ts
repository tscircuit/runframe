import type { DatasheetAssetSelection } from "./datasheet-assets"

/** Append one import and instance; preserve the user's board and other source. */
export const addDatasheetToBoard = async ({
  source,
  boardPath,
  selection,
}: {
  source: string
  boardPath: string
  selection: DatasheetAssetSelection
}): Promise<string> => {
  const { parse } = await import("@babel/parser")
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  })
  const boards: any[] = []
  const names = new Set<string>()
  const visit = (node: any) => {
    if (!node || typeof node !== "object") return
    if (
      node.type === "JSXElement" &&
      node.openingElement.name.type === "JSXIdentifier" &&
      node.openingElement.name.name === "board"
    )
      boards.push(node)
    if (
      node.type === "JSXAttribute" &&
      node.name.name === "name" &&
      node.value?.type === "StringLiteral"
    )
      names.add(node.value.value)
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === "object") visit(value)
    }
  }
  visit(ast.program)
  if (boards.length !== 1)
    throw new Error(
      "Open a TSX file containing one board to add this component.",
    )
  const from = boardPath.split("/").slice(0, -1)
  const to = selection.entrypoint.replace(/\.tsx$/, "").split("/")
  while (from.length && to.length && from[0] === to[0]) {
    from.shift()
    to.shift()
  }
  const relative = [...from.map(() => ".."), ...to].join("/")
  const importPath = relative.startsWith(".") ? relative : `./${relative}`
  // An already imported generation/kind is a successful no-op, including after
  // reopening the dialog or recovering from an interrupted host response.
  const existingImport = ast.program.body.find(
    (node: any) =>
      node.type === "ImportDeclaration" &&
      node.importKind !== "type" &&
      node.source.value === importPath &&
      node.specifiers.some(
        (specifier: any) => specifier.type === "ImportDefaultSpecifier",
      ),
  )
  const existingName =
    existingImport?.type === "ImportDeclaration"
      ? existingImport.specifiers.find(
          (node) => node.type === "ImportDefaultSpecifier",
        )?.local.name
      : undefined
  let alreadyPlaced = false
  const findPlacement = (node: any) => {
    if (!node || typeof node !== "object") return
    if (
      node.type === "JSXOpeningElement" &&
      node.name.type === "JSXIdentifier" &&
      node.name.name === existingName
    )
      alreadyPlaced = true
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(findPlacement)
      else if (value && typeof value === "object") findPlacement(value)
    }
  }
  if (existingName) findPlacement(boards[0])
  if (alreadyPlaced) return source
  const prefix =
    selection.kind === "component"
      ? "Chip"
      : selection.kind === "simulationCircuit"
        ? "Simulation"
        : "Reference"
  let index = 1
  while (
    new RegExp(`\\bGenerated${prefix}${index}\\b`).test(source) ||
    names.has(`${prefix}${index}`) ||
    names.has(`Imported${prefix}${index}`)
  )
    index++
  const identifier = existingName ?? `Generated${prefix}${index}`
  const importedCount = (
    source.match(/name="Imported(?:Chip|Simulation|Reference)\d+"/g) ?? []
  ).length
  const x = 20 + importedCount * 24
  const instance = `\n    <group name="Imported${prefix}${index}" pcbX={${x}} schX={${12 + importedCount * 14}}>\n      <${identifier} name="${prefix}${index}" />\n    </group>\n  `
  const board = boards[0]
  const updated = board.closingElement
    ? source.slice(0, board.closingElement.start) +
      instance +
      source.slice(board.closingElement.start)
    : source.slice(0, board.start) +
      source
        .slice(board.start, board.openingElement.end)
        .replace(/\/\s*>$/, ">") +
      instance +
      "</board>" +
      source.slice(board.end)
  const lastImport = ast.program.body
    .filter((node: any) => node.type === "ImportDeclaration")
    .at(-1)
  if (existingName) return updated
  const insertion =
    lastImport && lastImport.end! < board.start
      ? lastImport.end!
      : (ast.program.directives?.at(-1)?.end ??
        ast.program.interpreter?.end ??
        0)
  return (
    updated.slice(0, insertion) +
    `\nimport ${identifier} from ${JSON.stringify(importPath)};\n` +
    updated.slice(insertion)
  )
}
