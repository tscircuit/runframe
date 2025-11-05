export function naturalSort(a: string, b: string): number {
  const extA = a.lastIndexOf(".")
  const extB = b.lastIndexOf(".")
  const baseA = extA > 0 ? a.substring(0, extA) : a
  const baseB = extB > 0 ? b.substring(0, extB) : b

  // This ensures "Foo" comes before "Foo_bar" (both with same extension)
  if (baseA !== baseB && a.substring(extA) === b.substring(extB)) {
    if (baseA.startsWith(baseB)) {
      return 1
    }
    if (baseB.startsWith(baseA)) {
      return -1
    }
  }

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" })
}
