import { naturalSort } from "./naturalSort"

interface FileNode {
  name: string
  path: string
  type: "file" | "folder"
  children?: FileNode[]
}

function parseFilesToTree(files: string[]): FileNode[] {
  const root: FileNode[] = []
  const nodeMap = new Map<string, FileNode>()

  // Create root node
  nodeMap.set("", { name: "", path: "", type: "folder", children: root })

  for (const filePath of files) {
    const parts = filePath.split("/")
    let currentPath = ""

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const parentPath = currentPath
      currentPath = currentPath ? `${currentPath}/${part}` : part

      if (!nodeMap.has(currentPath)) {
        const isFile = i === parts.length - 1
        const node: FileNode = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        }

        nodeMap.set(currentPath, node)

        const parent = nodeMap.get(parentPath)
        if (parent && parent.children) {
          parent.children.push(node)
        }
      }
    }
  }

  return root
}

function findNode(nodes: FileNode[], path: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === path) return node
    if (node.children) {
      const found = findNode(node.children, path)
      if (found) return found
    }
  }
  return null
}

function flattenFolder(folder: FileNode): {
  flattenedFolder: FileNode
  displayName: string
} {
  let current = folder
  const pathParts = [folder.name]

  // Keep traversing while the folder has exactly one child and it's a folder (no files)
  while (
    current.children &&
    current.children.length === 1 &&
    current.children[0].type === "folder"
  ) {
    current = current.children[0]
    pathParts.push(current.name)
  }

  return {
    flattenedFolder: current,
    displayName: pathParts.join("/"),
  }
}

interface FlattenedFolderNode extends FileNode {
  displayName: string
}

function getCurrentFolderContents(
  tree: FileNode[],
  currentFolder: string,
): { files: FileNode[]; folders: FlattenedFolderNode[] } {
  let targetNode: FileNode | null

  if (!currentFolder) {
    // Root level
    targetNode = { name: "", path: "", type: "folder", children: tree }
  } else {
    targetNode = findNode(tree, currentFolder)
  }

  if (!targetNode || !targetNode.children) {
    return { files: [], folders: [] }
  }

  const files = targetNode.children.filter((node) => node.type === "file")
  const rawFolders = targetNode.children.filter(
    (node) => node.type === "folder",
  )

  // Flatten folders that only contain a single subfolder (no files)
  const folders: FlattenedFolderNode[] = rawFolders.map((folder) => {
    const { flattenedFolder, displayName } = flattenFolder(folder)
    return {
      ...flattenedFolder,
      displayName,
    }
  })

  // Sort files first, then folders, using natural sorting
  files.sort((a, b) => naturalSort(a.name, b.name))
  folders.sort((a, b) => naturalSort(a.displayName, b.displayName))

  return { files, folders }
}

export { parseFilesToTree, getCurrentFolderContents }
export type { FileNode, FlattenedFolderNode }
