// The preview uses the browser's origin-private file system as its project
// filesystem. Production hosts provide their own persistence callback.
const projectDirectory = async () => {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle("runframe-datasheet-project", { create: true })
}

export const saveDatasheetProjectFiles = async (
  files: Record<string, string>,
) => {
  const root = await projectDirectory()
  for (const [path, content] of Object.entries(files)) {
    const segments = path.split("/")
    let directory = root
    for (const name of segments.slice(0, -1))
      directory = await directory.getDirectoryHandle(name, { create: true })
    const handle = await directory.getFileHandle(segments.at(-1)!, {
      create: true,
    })
    const writer = await handle.createWritable()
    try {
      await writer.write(content)
    } finally {
      await writer.close()
    }
  }
}

export const loadDatasheetProjectFiles = async (): Promise<
  Record<string, string>
> => {
  const files: Record<string, string> = {}
  const read = async (directory: FileSystemDirectoryHandle, prefix = "") => {
    const iterable = directory as FileSystemDirectoryHandle & {
      entries(): AsyncIterableIterator<[string, FileSystemHandle]>
    }
    for await (const [name, entry] of iterable.entries()) {
      const path = `${prefix}${name}`
      if (entry.kind === "directory")
        await read(entry as FileSystemDirectoryHandle, `${path}/`)
      else
        files[path] = await (
          await (entry as FileSystemFileHandle).getFile()
        ).text()
    }
  }
  await read(await projectDirectory())
  return files
}
