import ky from "ky"

export function getWindowVar(name: string) {
  return typeof window !== "undefined" ? (window as any)[name] : null
}

export function getRegistryKy() {
  const registryApiBaseUrl =
    getWindowVar("TSCIRCUIT_REGISTRY_API_BASE_URL") ||
    import.meta.env.VITE_TSCIRCUIT_REGISTRY_API_BASE_URL ||
    "https://registry-api.tscircuit.com"

  const registryToken = getWindowVar("TSCIRCUIT_REGISTRY_TOKEN")

  return ky.create({
    prefixUrl: registryApiBaseUrl,
    headers: {
      Authorization: `Bearer ${registryToken}`,
    },
    timeout: 30000,
  })
}

export function hasRegistryToken() {
  return Boolean(getWindowVar("TSCIRCUIT_REGISTRY_TOKEN"))
}

export const registryKy = {
  get: (url: string, options?: any) => getRegistryKy().get(url, options),
  post: (url: string, options?: any) => getRegistryKy().post(url, options),
  put: (url: string, options?: any) => getRegistryKy().put(url, options),
  delete: (url: string, options?: any) => getRegistryKy().delete(url, options),
  patch: (url: string, options?: any) => getRegistryKy().patch(url, options),
}
