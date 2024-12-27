export const getChangesBetweenFsMaps = (
  fsMap1: Map<string, string>,
  fsMap2: Map<string, string>,
) => {
  const changes: Record<
    string,
    { old: string | undefined; new: string | undefined }
  > = {}

  // Check for changed or removed files
  for (const [path, oldContent] of fsMap1.entries()) {
    const newContent = fsMap2.get(path)
    if (newContent !== oldContent) {
      changes[path] = {
        old: oldContent,
        new: newContent,
      }
    }
  }

  // Check for new files
  for (const [path, newContent] of fsMap2.entries()) {
    if (!fsMap1.has(path)) {
      changes[path] = {
        old: undefined,
        new: newContent,
      }
    }
  }

  return changes
}
