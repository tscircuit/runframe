type Edit = { content: string; revision: number; retry?: boolean }

/** Coalesce editor changes and serialize them with generated-file transactions. */
export const createProjectFileWriter = ({
  save,
  onState,
  delay = 250,
}: {
  save: (files: Record<string, string>) => Promise<void>
  onState: (state: { pending: boolean; error: string | null }) => void
  delay?: number
}) => {
  const edits = new Map<string, Edit>()
  const revisions = new Map<string, number>()
  let revision = 0
  let operations = 0
  let error: string | null = null
  let queue = Promise.resolve()
  let timer: ReturnType<typeof setTimeout> | undefined
  const hasPendingChanges = () => edits.size > 0 || operations > 0
  const notify = () => onState({ pending: hasPendingChanges(), error })
  const commit = (files: Record<string, string> = {}) => {
    clearTimeout(timer)
    const batch = new Map(edits)
    edits.clear()
    for (const path of Object.keys(files)) revisions.set(path, ++revision)
    const changes = {
      ...Object.fromEntries(
        [...batch].map(([path, edit]) => [path, edit.content]),
      ),
      ...files,
    }
    if (!Object.keys(changes).length) return queue
    operations++
    notify()
    const pending = queue
      .then(() => {
        // An earlier queued save can fail after this transaction was scheduled.
        // Retry those dependent edits before publishing a board that uses them.
        const retries: Record<string, string> = {}
        for (const [path, edit] of edits) {
          if (!edit.retry) continue
          retries[path] = edit.content
          batch.set(path, edit)
          edits.delete(path)
        }
        return save({ ...retries, ...changes })
      })
      .then(
        () => {
          if (!edits.size) error = null
        },
        (cause) => {
          for (const [path, edit] of batch)
            if (revisions.get(path) === edit.revision && !edits.has(path))
              edits.set(path, { ...edit, retry: true })
          error =
            cause instanceof Error
              ? cause.message
              : "Could not save project files."
          throw cause
        },
      )
      .finally(() => {
        operations--
        notify()
      })
    queue = pending.catch(() => {})
    return pending
  }
  return {
    commit,
    flush: () => commit(),
    hasPendingChanges,
    edit: (path: string, content: string) => {
      revisions.set(path, ++revision)
      edits.set(path, { content, revision })
      clearTimeout(timer)
      timer = setTimeout(() => {
        void commit().catch(() => {})
      }, delay)
      notify()
    },
  }
}
