import { Button } from "lib/components/ui/button"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import VendorQuoteCard, { type OrderQuote } from "./VendorQuoteCard"
import { toast } from "lib/utils/toast"
import { getWindowVar } from "lib/utils/get-registry-ky"
import { useCreateOrderQuote } from "lib/hooks/use-create-order-quote"
import { useOrderQuotePolling } from "lib/hooks/use-order-quote-polling"
import { GitHubLogoIcon } from "@radix-ui/react-icons"

interface InitialOrderScreenProps {
  onCancel: () => void
  packageReleaseId: string
  isSignIn?: () => void
}

export const InitialOrderScreen = ({
  onCancel,
  packageReleaseId,
  isSignIn,
}: InitialOrderScreenProps) => {
  const [selectedShippingCarrier, setSelectedShippingCarrier] = useState<
    string | null
  >(null)

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
    window.location.href = `${stripeCheckoutBaseUrl}?client_reference_id=${orderQuoteId}&shipping_option=${selectedShippingCarrier}`
  }

  // Auto-select the lowest cost shipping carrier when component mounts
  useEffect(() => {
    if (
      selectedShippingCarrier === null &&
      orderQuote &&
      Array.isArray(orderQuote.shipping_options) &&
      orderQuote.shipping_options.length > 0
    ) {
      const lowest = orderQuote.shipping_options.reduce(
        (min, curr) => (curr.cost < min.cost ? curr : min),
        orderQuote.shipping_options[0],
      )
      setSelectedShippingCarrier(lowest?.carrier || null)
    }
  }, [orderQuote])

  // Calculate lowest shipping and original total (PCB + lowest shipping)
  const lowestShippingCarrierCost =
    orderQuote &&
    Array.isArray(orderQuote.shipping_options) &&
    orderQuote.shipping_options.length > 0
      ? orderQuote.shipping_options.reduce(
          (min, curr) => (curr.cost < min.cost ? curr : min),
          orderQuote.shipping_options[0],
        ).cost
      : 0

  if (!isSignIn) {
    return (
      <div className="rf-max-w-lg rf-mx-auto rf-bg-white rf-rounded-2xl rf-py-8 rf-flex rf-flex-col rf-gap-3">
        <h2 className="rf-text-3xl rf-font-bold rf-text-center">Order PCB</h2>
        <div className="py-4">
          <p className="rf-text-sm rf-text-gray-500 rf-mb-6 rf-text-center">
            Sign in is required to Order. Please sign in with GitHub to
            continue.
          </p>
          <div className="rf-flex rf-justify-center">
            <Button
              onClick={isSignIn}
              className="rf-flex rf-justify-center rf-items-center rf-w-48"
            >
              <GitHubLogoIcon className="rf-h-4 rf-w-4 rf-mr-2" />
              Sign in with GitHub
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rf-max-w-lg rf-mx-auto rf-bg-white rf-rounded-2xl rf-py-8 rf-flex rf-flex-col rf-gap-3">
      <h2 className="rf-text-3xl rf-font-bold rf-text-center">Order PCB</h2>
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
        !orderQuote?.error &&
        Array.isArray(orderQuote?.shipping_options) &&
        orderQuote.shipping_options.length > 0 && (
          <>
            <div className="rf-bg-blue-100 rf-text-blue-800 rf-p-3 rf-rounded-md rf-text-center rf-text-sm">
              This board is eligible for the tscircuit Flat Fee
            </div>
            <VendorQuoteCard
              key={orderQuote?.order_quote_id}
              orderQuote={orderQuote as OrderQuote}
              selectedShippingCarrier={selectedShippingCarrier}
              onSelectShippingCarrier={setSelectedShippingCarrier}
              lowestShippingCarrierCost={
                lowestShippingCarrierCost +
                (orderQuote.total_cost_without_shipping || 0)
              }
            />
          </>
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
          disabled={selectedShippingCarrier === null}
          onClick={() => {
            if (selectedShippingCarrier === null) {
              toast.error("Please select a shipping option.")
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
