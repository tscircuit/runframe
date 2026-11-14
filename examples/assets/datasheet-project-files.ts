// The preview uses the browser's origin-private file system as its project
// filesystem. Production hosts provide their own persistence callback.
const projectDirectory = async () => {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle("runframe-datasheet-project", { create: true })
}

const writeProjectFiles = async (files: Record<string, string>) => {
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
      await writer.close()
    } catch (error) {
      await writer.abort().catch(() => {})
      throw error
    }
  }
}

const readProjectFiles = async (): Promise<Record<string, string>> => {
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
          await (await directory.getFileHandle(name)).getFile()
        ).text()
    }
  }
  await read(await projectDirectory())
  return files
}

// Atomic file replacement invalidates previously enumerated handles. Keep local
// snapshots and writes in one queue so a reader never observes an in-flight swap.
let queue: Promise<unknown> = Promise.resolve()
const withProjectFiles = <T>(operation: () => Promise<T>): Promise<T> => {
  const pending = queue.then(
    async (): Promise<T> =>
      navigator.locks
        ? await navigator.locks.request("runframe-datasheet-project", operation)
        : await operation(),
  )
  queue = pending.catch(() => {})
  return pending
}
export const saveDatasheetProjectFiles = (files: Record<string, string>) =>
  withProjectFiles(() => writeProjectFiles(files))
export const loadDatasheetProjectFiles = () =>
  withProjectFiles(readProjectFiles)
