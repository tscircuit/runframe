import { useMutation, type UseMutationResult } from "react-query"
import { useEffect, useRef } from "react"
import { createOrderQuote, type OrderQuoteError } from "lib/api/order-quotes"

interface UseCreateOrderQuoteOptions {
  executeImmediately?: boolean
}

export const useCreateOrderQuote = (
  packageReleaseId: string,
  options?: UseCreateOrderQuoteOptions
): UseMutationResult<string | undefined, OrderQuoteError, void> => {
  const initializedRef = useRef(false);
  
  const mutation = useMutation<string | undefined, OrderQuoteError, void>({
    mutationFn: async () => {
      return await createOrderQuote(packageReleaseId)
    },
  })

  useEffect(() => {
    if (options?.executeImmediately && !initializedRef.current) {
      initializedRef.current = true;
      mutation.mutate();
    }
    
  }, [packageReleaseId, options?.executeImmediately]);

  return mutation
}
