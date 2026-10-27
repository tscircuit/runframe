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
