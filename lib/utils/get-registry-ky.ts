import ky, { HTTPError, type NormalizedOptions } from "ky"

class RegistryHTTPError extends HTTPError {
  constructor(
    response: Response,
    request: Request,
    options: NormalizedOptions,
    message: string,
  ) {
    super(response, request, options)
    this.name = "RegistryHTTPError"
    this.message = message
  }
}

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
    hooks: {
      afterResponse: [
        async (request, options, response) => {
          if (response.ok) return response

          let serverError: any = null

          try {
            serverError = await response.clone().json()
          } catch (jsonError) {
            console.error("Failed to parse registry error response", jsonError)
          }

          const errorMessage =
            serverError?.error?.message ??
            serverError?.error?.error_message ??
            serverError?.message

          const errorCode =
            serverError?.error?.error_code ?? serverError?.error_code
          const url = new URL(response.url)
          const requestPath = `${url.pathname}${url.search}`

          const detailedMessageParts = [
            `Registry request failed for ${requestPath} (${response.status})`,
          ]

          if (errorMessage) {
            detailedMessageParts.push(`Server message: ${errorMessage}`)
          }

          if (errorCode) {
            detailedMessageParts.push(`Error code: ${errorCode}`)
          }

          throw new RegistryHTTPError(
            response,
            request,
            options,
            detailedMessageParts.join(" | "),
          )
        },
      ],
    },
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
