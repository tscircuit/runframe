export function bytesToBase64(bytes: Uint8Array): string {
  const binString = String.fromCodePoint(...bytes)
  return btoa(binString)
}
