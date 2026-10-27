import { expect, test } from "bun:test"
import { LatestTaskQueue } from "lib/utils/latest-task-queue"

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
