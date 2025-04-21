import ky from "ky"

export function getRegistryKy() {
  const registryApiBaseUrl =
    (typeof window !== "undefined"
      ? window.TSCIRCUIT_REGISTRY_API_BASE_URL
      : null) ?? "https://registry-api.tscircuit.com"

  return ky.create({
    prefixUrl: registryApiBaseUrl,
    timeout: 30000,
  })
}

export const registryKy = {
  get: (url: string, options?: any) => getRegistryKy().get(url, options),
  post: (url: string, options?: any) => getRegistryKy().post(url, options),
  put: (url: string, options?: any) => getRegistryKy().put(url, options),
  delete: (url: string, options?: any) => getRegistryKy().delete(url, options),
  patch: (url: string, options?: any) => getRegistryKy().patch(url, options),
}
