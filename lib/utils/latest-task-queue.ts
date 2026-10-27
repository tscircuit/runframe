/** Let the active task finish; retain only the newest task waiting behind it. */
export class LatestTaskQueue {
  private active = false
  private pending?: {
    run: () => Promise<unknown>
    resolve: () => void
    reject: (error: unknown) => void
  }

  run = (run: () => Promise<unknown>): Promise<void> =>
    new Promise((resolve, reject) => {
      this.pending?.resolve()
      this.pending = { run, resolve, reject }
      if (!this.active) void this.drain()
    })

  private async drain() {
    this.active = true
    while (this.pending) {
      const task = this.pending
      this.pending = undefined
      try {
        await task.run()
        task.resolve()
      } catch (error) {
        task.reject(error)
      }
    }
    this.active = false
  }

  cancel = () => {
    this.pending?.resolve()
    this.pending = undefined
    // The caller suppresses active results. Keep the worker locked until it settles.
  }

  isLocked = () => this.active
}
