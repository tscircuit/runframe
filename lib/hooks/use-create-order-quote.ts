import { useMutation } from "react-query"
import type { UseMutationResult } from "react-query"
import { createOrderQuote } from "lib/api/order-quotes"
import type { CircuitJson } from "circuit-json"

export const useCreateOrderQuote = (
  packageReleaseId: string,
  circuitJson?: CircuitJson,
): UseMutationResult<string | undefined, Error, void> => {
  return useMutation({
    mutationFn: async () => {
      try {
        return await createOrderQuote(packageReleaseId, circuitJson)
      } catch (error) {
        console.error("Error creating order quote:", error)
        throw error instanceof Error
          ? error
          : new Error("Failed to create order quote")
      }
    },
  })
}
