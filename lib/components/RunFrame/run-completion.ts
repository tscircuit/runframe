import type { CircuitJson } from "circuit-json"

export interface RunCompletedPayload {
  errors?: Array<any>
  hasExecutionError: boolean
}

const isCircuitJsonError = (entry: any): boolean => {
  if (!entry || typeof entry !== "object") return false
  if ("error_type" in entry) return true
  if (typeof entry.type === "string" && entry.type.includes("error"))
    return true
  return false
}

const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  if (typeof error === "string") {
    return { message: error }
  }

  if (error && typeof error === "object") {
    return error
  }

  return { message: String(error) }
}

export const extractCircuitJsonErrors = (
  circuitJson?: CircuitJson | null,
): any[] => {
  if (!Array.isArray(circuitJson)) return []
  return circuitJson.filter(isCircuitJsonError)
}

export const buildRunCompletedPayload = ({
  circuitJson,
  executionError,
}: {
  circuitJson?: CircuitJson | null
  executionError?: unknown
}): RunCompletedPayload => {
  const errors: any[] = []

  if (executionError) {
    errors.push(serializeError(executionError))
  }

  const circuitJsonErrors = extractCircuitJsonErrors(circuitJson)
  errors.push(...circuitJsonErrors)

  return {
    hasExecutionError: Boolean(executionError),
    ...(errors.length > 0 ? { errors } : {}),
  }
}
