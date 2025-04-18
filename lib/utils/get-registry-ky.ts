import ky from "ky"

// Flag to identify if we're running inside runframe specifically
declare global {
  interface Window {
    __RUNFRAME_REGISTRY_BASE_URL__?: boolean
  }
}

// Create a function that provides the configured ky instance
// This ensures we check the flag every time we need the client
export function getRegistryKy() {
  // Check flag at execution time rather than module load time
  const useRegistryPrefix =
    typeof window !== "undefined" &&
    window.__RUNFRAME_REGISTRY_BASE_URL__ === true

  // Set the appropriate prefix based on the environment
  const registryApiBaseUrl = useRegistryPrefix
    ? "/registry"
    : "https://registry-api.tscircuit.com"

  return ky.create({
    prefixUrl: registryApiBaseUrl,
    timeout: 30000,
  })
}

// For backward compatibility and convenience
export const registryKy = {
  get: (url: string, options?: any) => getRegistryKy().get(url, options),
  post: (url: string, options?: any) => getRegistryKy().post(url, options),
  put: (url: string, options?: any) => getRegistryKy().put(url, options),
  delete: (url: string, options?: any) => getRegistryKy().delete(url, options),
  patch: (url: string, options?: any) => getRegistryKy().patch(url, options),
}
