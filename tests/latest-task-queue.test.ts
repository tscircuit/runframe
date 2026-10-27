import { expect, test } from "bun:test"
import { LatestTaskQueue } from "lib/utils/latest-task-queue"

test("only the newest pending build runs, after the active build completes", async () => {
  const queue = new LatestTaskQueue()
  const completed: number[] = []
  let release!: () => void
  const first = queue.run(async () => {
    await new Promise<void>((resolve) => {
      release = resolve
    })
    completed.push(1)
  })
  const skipped = queue.run(async () => {
    completed.push(2)
  })
  const latest = queue.run(async () => {
    completed.push(3)
  })
  await skipped
  expect(completed).toEqual([])
  release()
  await Promise.all([first, latest])
  expect(completed).toEqual([1, 3])
  expect(queue.isLocked()).toBe(false)
})

test("cancel drops pending builds without releasing an active worker", async () => {
  const queue = new LatestTaskQueue()
  let release!: () => void
  const completed: string[] = []
  const active = queue.run(
    () =>
      new Promise<void>((resolve) => {
        release = resolve
      }),
  )
  const skipped = queue.run(async () => {
    completed.push("cancelled")
  })
  queue.cancel()
  await skipped
  expect(queue.isLocked()).toBe(true)
  const latest = queue.run(async () => {
    completed.push("latest")
  })
  expect(completed).toEqual([])
  release()
  await Promise.all([active, latest])
  expect(completed).toEqual(["latest"])
})

test("an active error is reported and does not block the latest build", async () => {
  const queue = new LatestTaskQueue()
  let reject!: (error: Error) => void
  const failed = queue
    .run(
      () =>
        new Promise<void>((_resolve, fail) => {
          reject = fail
        }),
    )
    .catch((error) => error.message)
  let recovered = false
  const latest = queue.run(async () => {
    recovered = true
  })
  reject(new Error("invalid source"))
  expect(await failed).toBe("invalid source")
  await latest
  expect(recovered).toBe(true)
})
