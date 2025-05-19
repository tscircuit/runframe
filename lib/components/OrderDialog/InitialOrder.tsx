import { Button } from "lib/components/ui/button"
import { Loader2 } from "lucide-react"
import { GitHubLogoIcon } from "@radix-ui/react-icons"
import { useEffect, useMemo, useState } from "react"
import VendorQuoteCard, { type OrderQuote } from "./VendorQuoteCard"
import { toast } from "lib/utils/toast"
import { getWindowVar } from "lib/utils/get-registry-ky"
import { useCreateOrderQuote } from "lib/hooks/use-create-order-quote"
import { useOrderQuotePolling } from "lib/hooks/use-order-quote-polling"

interface InitialOrderScreenProps {
  onCancel: () => void
  packageReleaseId: string
  signIn: () => void
  isLoggedIn: boolean
}

export const InitialOrderScreen = ({
  onCancel,
  packageReleaseId,
  signIn,
  isLoggedIn,
}: InitialOrderScreenProps) => {
  const [selectedShippingCarrier, setSelectedShippingCarrier] = useState<
    string | null
  >(null)
  const [orderQuoteId, setOrderQuoteId] = useState<string | null>(null)

  // Create order quote mutation
  const {
    mutate: createOrderQuote,
    error: createOrderQuoteError,
  } = useCreateOrderQuote()

  // Create the order quote when the component mounts or packageReleaseId changes
  useEffect(() => {
    if (packageReleaseId) {
      createOrderQuote(packageReleaseId, {
        onSuccess: (data) => {
          setOrderQuoteId(data.order_quote_id)
        },
      })
    }
  }, [packageReleaseId])

  // Poll for the order quote status
  const { data: orderQuote } = useOrderQuotePolling(orderQuoteId || undefined)

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
  const lowestShippingCarrierCost = useMemo(() => {
    return orderQuote &&
      Array.isArray(orderQuote.shipping_options) &&
      orderQuote.shipping_options.length > 0
      ? orderQuote.shipping_options.reduce(
          (min, curr) => (curr.cost < min.cost ? curr : min),
          orderQuote.shipping_options[0],
        ).cost
      : 0
  }, [orderQuote])

  // Check for no_token error
  const isNoTokenError =
    (createOrderQuoteError && (createOrderQuoteError as any).error_code?.includes("no_token")) ||
    (orderQuote?.error?.error_code?.includes("no_token")) &&
    signIn

  if (!isLoggedIn || isNoTokenError) {
    return <SignInView signIn={signIn} />
  }

  return (
    <div className="rf-max-w-lg rf-mx-auto rf-bg-white rf-rounded-2xl rf-py-8 rf-flex rf-flex-col rf-gap-3">
      <h2 className="rf-text-3xl rf-font-bold rf-text-center">Order PCB</h2>
      {/* Loading States */}
      {!(createOrderQuoteError || orderQuote?.error) &&
        (!orderQuoteId || !orderQuote || orderQuote?.is_processing) && (
          <LoadingMessage message="Fetching quotes..." />
        )}

      {/* Error States */}
      {(createOrderQuoteError || orderQuote?.error) && (
        <ErrorMessage
          message={
            (createOrderQuoteError && (createOrderQuoteError as any).message) ||
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
const SignInView = ({ signIn }: { signIn: () => void }) => (
  <div className="rf-max-w-lg rf-mx-auto rf-bg-white rf-rounded-2xl rf-py-8 rf-flex rf-flex-col rf-gap-3">
    <h2 className="rf-text-3xl rf-font-bold rf-text-center">Order PCB</h2>
    <div className="rf-flex rf-flex-col rf-items-center rf-gap-4 rf-py-8">
      <p className="rf-text-gray-600">Please sign in to continue</p>
      <Button onClick={signIn} className="rf-flex rf-items-center rf-gap-2">
        <GitHubLogoIcon className="rf-w-5 rf-h-5" />
        Sign in with GitHub
      </Button>
    </div>
  </div>
)
