export function bytesToBase64(bytes: Uint8Array): string {
  const binaryChunks: string[] = []
  const chunkSize = 32 * 1024
  // Bound each spread to avoid the JavaScript engine's argument-count limit.
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binaryChunks.push(
      String.fromCodePoint(...bytes.subarray(offset, offset + chunkSize)),
    )
  }
  return btoa(binaryChunks.join(""))
}
