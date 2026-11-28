const BYTE_CHUNK_SIZE = 0x8000

export function bytesToBase64(bytes: Uint8Array): string {
  let binString = ""
  for (let offset = 0; offset < bytes.length; offset += BYTE_CHUNK_SIZE) {
    binString += String.fromCodePoint(
      ...bytes.subarray(offset, offset + BYTE_CHUNK_SIZE),
    )
  }
  return btoa(binString)
}
