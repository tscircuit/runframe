import type { DatasheetAssetSelection } from "./datasheet-assets"

import type { JSXElement, Node } from "@babel/types"

const walk = (node: Node, visit: (node: Node) => void) => {
  visit(node)
  for (const value of Object.values(node)) {
    const children = Array.isArray(value) ? value : [value]
    for (const child of children)
      if (child && typeof child === "object" && typeof child.type === "string")
        walk(child as Node, visit)
  }
}
const resolveImport = (specifier: string, boardPath: string) => {
  if (!specifier.startsWith(".")) return undefined
  const parts = boardPath.split("/").slice(0, -1)
  for (const part of specifier.split("/")) {
    if (part === "..") parts.pop()
    else if (part !== "." && part) parts.push(part)
  }
  const path = parts.join("/")
  return path.endsWith(".tsx") ? path : path + ".tsx"
}
const readBoard = async (source: string) => {
  const { parse } = await import("@babel/parser")
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  })
  const boards: JSXElement[] = []
  const names = new Set<string>()
  walk(ast.program, (node) => {
    if (
      node.type === "JSXElement" &&
      node.openingElement.name.type === "JSXIdentifier" &&
      node.openingElement.name.name === "board"
    )
      boards.push(node)
    if (
      node.type === "JSXAttribute" &&
      node.name.type === "JSXIdentifier" &&
      node.name.name === "name" &&
      node.value?.type === "StringLiteral"
    )
      names.add(node.value.value)
  })
  if (boards.length !== 1)
    throw new Error(
      "Open a TSX file containing one board to add this component.",
    )
  const used = new Set<string>()
  walk(boards[0], (node) => {
    if (
      node.type === "JSXOpeningElement" &&
      node.name.type === "JSXIdentifier" &&
      !/^[a-z]/.test(node.name.name)
    )
      used.add(node.name.name)
  })
  return { ast, board: boards[0], names, used }
}

/** Infer placement from the current board, including after reload or removal. */
export const getPlacedDatasheetEntrypoints = async (
  source: string,
  boardPath: string,
) => {
  const { ast, used } = await readBoard(source)
  const paths = new Set<string>()
  for (const node of ast.program.body) {
    if (node.type !== "ImportDeclaration" || node.importKind === "type")
      continue
    const name = node.specifiers.find(
      (specifier) => specifier.type === "ImportDefaultSpecifier",
    )?.local.name
    const path = resolveImport(node.source.value, boardPath)
    if (name && path && used.has(name)) paths.add(path)
  }
  return paths
}

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
  const { ast, board, names, used } = await readBoard(source)
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
    (node) =>
      node.type === "ImportDeclaration" &&
      node.importKind !== "type" &&
      resolveImport(node.source.value, boardPath) === selection.entrypoint &&
      node.specifiers.some(
        (specifier) => specifier.type === "ImportDefaultSpecifier",
      ),
  )
  const existingName =
    existingImport?.type === "ImportDeclaration"
      ? existingImport.specifiers.find(
          (node) => node.type === "ImportDefaultSpecifier",
        )?.local.name
      : undefined
  if (existingName && used.has(existingName)) return source
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
  const instance = `\n    <group name="Imported${prefix}${index}" schX={${12 + importedCount * 14}}>\n      <${identifier} name="${prefix}${index}" />\n    </group>\n  `
  const updated = board.closingElement
    ? source.slice(0, board.closingElement.start!) +
      instance +
      source.slice(board.closingElement.start!)
    : source.slice(0, board.start!) +
      source
        .slice(board.start!, board.openingElement.end!)
        .replace(/\/\s*>$/, ">") +
      instance +
      "</board>" +
      source.slice(board.end!)
  const lastImport = ast.program.body
    .filter((node) => node.type === "ImportDeclaration")
    .at(-1)
  if (existingName) return updated
  const insertion =
    lastImport && lastImport.end! < board.start!
      ? lastImport.end!
      : (ast.program.directives?.at(-1)?.end ??
        ast.program.interpreter?.end ??
        0)
  return (
    updated.slice(0, insertion) +
    `${insertion ? "\n" : ""}import ${identifier} from ${JSON.stringify(importPath)};\n` +
    updated.slice(insertion)
  )
}
