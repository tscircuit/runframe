import { useMutation } from "react-query"
import { createOrderQuote } from "lib/api/order-quotes"

export const useCreateOrderQuote = () => {
  return useMutation<string, Error, string>((packageReleaseId) =>
    createOrderQuote(packageReleaseId),
  )
}
