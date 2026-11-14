import { expect, test } from "bun:test"
import { createProjectFileWriter } from "../examples/assets/create-project-file-writer"
import {
  saveDatasheetProjectFiles,
  loadDatasheetProjectFiles,
} from "../examples/assets/datasheet-project-files"

test("editor changes coalesce and precede generated board updates", async () => {
  const written: Record<string, string>[] = []
  const writer = createProjectFileWriter({
    save: async (files) => {
      written.push(files)
    },
    onState: () => {},
  })
  writer.edit("main.tsx", "first")
  writer.edit("main.tsx", "latest edit")
  await writer.commit({ "generated/chip.tsx": "chip" })
  await writer.commit({ "main.tsx": "latest edit plus imported chip" })
  expect(written).toEqual([
    { "main.tsx": "latest edit", "generated/chip.tsx": "chip" },
    { "main.tsx": "latest edit plus imported chip" },
  ])
  expect(writer.hasPendingChanges()).toBe(false)
})

test("a failed old write cannot overwrite a newer edit queued behind it", async () => {
  let reject!: (error: Error) => void
  const written: string[] = []
  let first = true
  const writer = createProjectFileWriter({
    save: async (files) => {
      written.push(files["main.tsx"])
      if (first) {
        first = false
        await new Promise<void>((_resolve, fail) => {
          reject = fail
        })
      }
    },
    onState: () => {},
  })
  writer.edit("main.tsx", "old")
  const failing = writer.flush()
  await Promise.resolve()
  writer.edit("main.tsx", "new")
  const latest = writer.flush()
  reject(new Error("Disk full"))
  await expect(failing).rejects.toThrow("Disk full")
  await latest
  expect(written).toEqual(["old", "new"])
  expect(writer.hasPendingChanges()).toBe(false)
})

test("failed editor saves remain retryable and use the most recent text", async () => {
  let failed = true
  const states: Array<{ pending: boolean; error: string | null }> = []
  const saved: string[] = []
  const writer = createProjectFileWriter({
    save: async (files) => {
      if (failed) throw new Error("Disk full")
      saved.push(files["main.tsx"])
    },
    onState: (state) => states.push(state),
  })
  writer.edit("main.tsx", "first")
  await expect(writer.flush()).rejects.toThrow("Disk full")
  expect(writer.hasPendingChanges()).toBe(true)
  expect(states.at(-1)?.error).toBe("Disk full")
  writer.edit("main.tsx", "corrected")
  failed = false
  await writer.flush()
  expect(saved).toEqual(["corrected"])
  expect(states.at(-1)).toEqual({ pending: false, error: null })
})

test("a queued board update retries a dependency whose earlier save failed", async () => {
  let reject!: (error: Error) => void
  const written: Record<string, string>[] = []
  const writer = createProjectFileWriter({
    save: async (files) => {
      written.push(files)
      if (written.length === 1)
        await new Promise<void>((_resolve, fail) => {
          reject = fail
        })
    },
    onState: () => {},
  })
  writer.edit("generated/chip.tsx", "corrected chip")
  const failed = writer.flush()
  await Promise.resolve()
  const board = writer.commit({ "main.tsx": "board using corrected chip" })
  reject(new Error("Temporary write failure"))
  await expect(failed).rejects.toThrow("Temporary write failure")
  await board
  expect(written[1]).toEqual({
    "generated/chip.tsx": "corrected chip",
    "main.tsx": "board using corrected chip",
  })
  expect(writer.hasPendingChanges()).toBe(false)
})

test("a rejected filesystem write aborts without committing an empty replacement", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator")
  let committed = "original content"
  let aborted = false
  let closed = false
  const directory = {
    getDirectoryHandle: async () => directory,
    getFileHandle: async () => ({
      createWritable: async () => ({
        write: async () => {
          throw new Error("Quota exceeded")
        },
        close: async () => {
          closed = true
          committed = ""
        },
        abort: async () => {
          aborted = true
        },
      }),
    }),
  }
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { storage: { getDirectory: async () => directory } },
  })
  try {
    await expect(
      saveDatasheetProjectFiles({ "main.tsx": "new content" }),
    ).rejects.toThrow("Quota exceeded")
    expect(aborted).toBe(true)
    expect(closed).toBe(false)
    expect(committed).toBe("original content")
  } finally {
    if (previous) Object.defineProperty(globalThis, "navigator", previous)
    else Reflect.deleteProperty(globalThis, "navigator")
  }
})

test("filesystem snapshots wait for an in-flight atomic replacement", async () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator")
  let committed = "old"
  let release!: () => void
  let loaded = false
  const file = {
    kind: "file",
    getFile: async () => ({ text: async () => committed }),
  }
  const directory = {
    getDirectoryHandle: async () => directory,
    getFileHandle: async () => ({
      getFile: file.getFile,
      createWritable: async () => ({
        write: async () => {
          await new Promise<void>((resolve) => {
            release = resolve
          })
        },
        close: async () => {
          committed = "new"
        },
        abort: async () => {},
      }),
    }),
    entries: async function* () {
      yield ["main.tsx", file]
    },
  }
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { storage: { getDirectory: async () => directory } },
  })
  try {
    const writing = saveDatasheetProjectFiles({ "main.tsx": "new" })
    const reading = loadDatasheetProjectFiles().then((files) => {
      loaded = true
      return files
    })
    for (let i = 0; i < 30 && !release; i++) await Promise.resolve()
    expect(loaded).toBe(false)
    release()
    await writing
    expect(await reading).toEqual({ "main.tsx": "new" })
  } finally {
    if (previous) Object.defineProperty(globalThis, "navigator", previous)
    else Reflect.deleteProperty(globalThis, "navigator")
  }
})
