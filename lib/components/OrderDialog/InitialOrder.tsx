import { Button } from "lib/components/ui/button"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import VendorQuoteCard from "./VendorQuoteCard"
import { toast } from "lib/utils/toast"
import { getWindowVar } from "lib/utils/get-registry-ky"
import { useCreateOrderQuote } from "lib/hooks/use-create-order-quote"
import { useOrderQuotePolling } from "lib/hooks/use-order-quote-polling"

interface InitialOrderScreenProps {
  onCancel: () => void
  packageReleaseId: string
}

export const InitialOrderScreen = ({
  onCancel,
  packageReleaseId,
}: InitialOrderScreenProps) => {
  const [selectedVendorIdx, setSelectedVendorIdx] = useState<number | null>(
    null,
  )
  const [selectedShippingIdx, setSelectedShippingIdx] = useState<number | null>(
    null,
  )

  const {
    mutate: createOrderQuote,
    data: orderQuoteId,
    error: createOrderQuoteError,
    isError,
  } = useCreateOrderQuote(packageReleaseId)
  const { data: orderQuote } = useOrderQuotePolling(orderQuoteId)

  const redirectToStripeCheckout = async (orderQuoteId: string) => {
    const stripeCheckoutBaseUrl = getWindowVar(
      "TSCIRCUIT_STRIPE_CHECKOUT_BASE_URL",
    )
    window.location.href = `${stripeCheckoutBaseUrl}?client_reference_id=${orderQuoteId}`
  }

  // Reset shipping selection when changing vendor
  useEffect(() => {
    setSelectedShippingIdx(null)
  }, [selectedVendorIdx])

  // Create order quote when component mounts
  useEffect(() => {
    createOrderQuote()
  }, [packageReleaseId, createOrderQuote])

  return (
    <div className="rf-max-w-lg rf-mx-auto rf-bg-white rf-rounded-2xl rf-p-8 rf-flex rf-flex-col rf-gap-3">
      <h2 className="rf-text-3xl rf-font-bold rf-text-center rf-mb-8">
        Order PCB
      </h2>
      <div className="rf-mb-4 rf-text-gray-700 rf-text-center">
        Select a quote from below, then pick a shipping method.
      </div>

      {/* Loading States */}
      {(!orderQuoteId || !orderQuote || !orderQuote?.is_completed) &&
        !isError && <LoadingMessage message="Fetching quotes..." />}

      {/* Error States */}
      {(createOrderQuoteError || orderQuote?.error || isError) && (
        <ErrorMessage
          message={
            createOrderQuoteError?.message ||
            orderQuote?.error?.message ||
            "Failed to fetch quotes"
          }
        />
      )}

      {/* Success State */}
      {orderQuote?.is_completed &&
        !createOrderQuoteError &&
        !orderQuote?.error && (
          <VendorQuoteCard
            key={orderQuote?.order_quote_id}
            vendor={orderQuote}
            isActive={selectedVendorIdx === 0}
            onSelect={() => setSelectedVendorIdx(0)}
            selectedShippingIdx={
              selectedVendorIdx === 0 ? selectedShippingIdx : null
            }
            onSelectShipping={setSelectedShippingIdx}
          />
        )}

      <div className="rf-flex rf-justify-between rf-mt-5 rf-gap-4">
        <Button
          variant="outline"
          type="button"
          className="rf-w-1/2 rf-border-red-500 rf-text-red-500 rf-hover:bg-red-50 rf-hover:text-red-600"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="button"
          className="rf-w-1/2 rf-bg-blue-600 rf-hover:bg-blue-700"
          disabled={selectedVendorIdx === null || status === "loading"}
          onClick={() => {
            if (selectedVendorIdx === null || status === "loading") {
              toast.error("Please select a vendor and shipping option.")
              return
            }

            if (orderQuote) {
              redirectToStripeCheckout(orderQuote.order_quote_id)
            }
          }}
        >
          Continue
        </Button>
      </div>
      <div className="rf-text-xs rf-text-center rf-text-gray-400 rf-mt-4">
        Pricing may vary based on specifications.
      </div>
    </div>
  )
}

// Helper components for better organization
const LoadingMessage = ({ message }: { message: string }) => (
  <div className="rf-flex rf-flex-col rf-items-center rf-gap-2 rf-my-12">
    <Loader2 className="rf-animate-spin rf-w-8 rf-h-8 rf-text-gray-400" />
    <p className="rf-text-gray-600">{message}</p>
  </div>
)

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="rf-text-red-600 rf-text-center rf-py-12">{message}</div>
)
