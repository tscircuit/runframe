import { expect, test } from "bun:test"
import { LatestTaskQueue } from "lib/utils/latest-task-queue"

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
