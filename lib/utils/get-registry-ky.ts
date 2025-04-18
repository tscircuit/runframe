import ky from "ky";

// Flag to identify environment configuration
declare global {
  interface Window {
    __RUNFRAME_REGISTRY_BASE_URL__?: boolean;
    REGISTRY_API_BASE_URL?: string; // For custom API URL
  }
}

// Create a function that provides the configured ky instance
// This ensures we check the flag/config every time we need the client
export function getRegistryKy() {
  // For runframe specific handling
  const isRunframe = 
    typeof window !== "undefined" && 
    window.__RUNFRAME_REGISTRY_BASE_URL__ === true;
  
  // For custom registry API URL (can be set by the importing application)
  const customApiUrl = 
    typeof window !== "undefined" && 
    window.REGISTRY_API_BASE_URL;
  
  // Detect if we're in a localhost environment
  const isLocalhost = 
    typeof window !== "undefined" && 
    (window.location.hostname === "localhost" || 
     window.location.hostname === "127.0.0.1");
  
  // Determine the registry API URL with this priority:
  // 1. If in runframe, use "/registry"
  // 2. If custom URL is provided, use that
  // 3. If in localhost but not runframe, use relative "/api" path
  // 4. Otherwise use production URL
  const registryApiBaseUrl = 
    isRunframe ? "/registry" :
    customApiUrl ? customApiUrl :
    isLocalhost ? "/api" : // Default to "/api" for other localhost environments
    "https://registry-api.tscircuit.com";

  return ky.create({
    prefixUrl: registryApiBaseUrl,
    timeout: 30000,
  });
}

// For backward compatibility and convenience
export const registryKy = {
  get: (url: string, options?: any) => getRegistryKy().get(url, options),
  post: (url: string, options?: any) => getRegistryKy().post(url, options),
  put: (url: string, options?: any) => getRegistryKy().put(url, options),
  delete: (url: string, options?: any) => getRegistryKy().delete(url, options),
  patch: (url: string, options?: any) => getRegistryKy().patch(url, options),
}
