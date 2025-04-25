import { Button } from "lib/components/ui/button"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import VendorQuoteCard from "./VendorQuoteCard"
import { toast } from "lib/utils/toast"
import { registryKy } from "lib/utils/get-registry-ky"
import type { OrderQuote } from "@tscircuit/fake-snippets/schema"
import { getWindowVar } from "lib/utils/get-registry-ky"

interface InitialOrderScreenProps {
  onCancel: () => void
  packageReleaseId: string
}

export const InitialOrderScreen = ({
  onCancel,
  packageReleaseId,
}: InitialOrderScreenProps) => {
  const [quotes, setQuotes] = useState<OrderQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVendorIdx, setSelectedVendorIdx] = useState<number | null>(
    null,
  )
  const [selectedShippingIdx, setSelectedShippingIdx] = useState<number | null>(
    null,
  )
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [orderQuoteReceived, setOrderQuoteReceived] =
    useState<OrderQuote | null>(null)

  const createOrderQuotes = async () => {
    const { order_quote_id } = await registryKy
      .post("order_quotes/create", {
        json: {
          package_release_id: packageReleaseId,
          vendor_name: "jlcpcb", // TODO: Remove this once we have more vendor
        },
      })
      .json<{ order_quote_id: string }>()
    return order_quote_id
  }

  const getOrderQuotes = async (orderQuoteId: string) => {
    const { order_quote } = await registryKy
      .get(`order_quotes/get`, {
        searchParams: {
          order_quote_id: orderQuoteId,
        },
      })
      .json<{ order_quote: OrderQuote }>()
    return order_quote
  }

  const pollToGetOrderQuotes = async (
    orderQuoteId: string,
    maxAttempts = 10,
  ) => {
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const orderQuote = await getOrderQuotes(orderQuoteId)

        if (orderQuote.is_completed) {
          setOrderQuoteReceived(orderQuote)
          return orderQuote
        }

        if (orderQuote.has_error) {
          throw new Error(orderQuote.error?.message ?? "Unknown error")
        }

        attempts++

        await new Promise((resolve) => setTimeout(resolve, 2000))
      } catch (error) {
        attempts++
        console.error("Error polling order quote:", error)
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }

    throw new Error("Polling timed out after maximum attempts")
  }

  const redirectToStripeCheckout = async (orderQuoteId: string) => {
    const stripeCheckoutBaseUrl = getWindowVar(
      "TSCIRCUIT_STRIPE_CHECKOUT_BASE_URL",
    )

    window.location.href = `${stripeCheckoutBaseUrl}?client_reference_id=${orderQuoteId}`
  }

  // Fetch order quotes
  useEffect(() => {
    const fetchQuotes = async () => {
      setLoading(true)
      setQuotes([])
      setFetchError(null)

      const orderQuoteId = await createOrderQuotes()

      if (!orderQuoteId) {
        toast.error("Failed to create order quote.")
        setLoading(false)
        return
      }

      try {
        const orderQuote = await pollToGetOrderQuotes(orderQuoteId)
        setQuotes([orderQuote])
        setLoading(false)
      } catch (error) {
        console.error(error)
        toast.error("Failed to fetch order quotes.")
        setLoading(false)
      }
    }

    fetchQuotes()
  }, [])

  // Reset shipping selection when changing vendor
  useEffect(() => {
    setSelectedShippingIdx(null)
  }, [selectedVendorIdx])

  return (
    <div className="rf-max-w-lg rf-mx-auto rf-bg-white rf-rounded-2xl rf-p-8 rf-flex rf-flex-col rf-gap-3">
      <h2 className="rf-text-3xl rf-font-bold rf-text-center rf-mb-8">
        Order PCB – Choose a Vendor
      </h2>
      <div className="rf-mb-4 rf-text-gray-700 rf-text-center">
        Select a quote from below, then pick a shipping method.
      </div>
      {loading ? (
        <div className="rf-flex rf-flex-col rf-items-center rf-gap-2 rf-my-12">
          <Loader2 className="rf-animate-spin rf-w-8 rf-h-8 rf-text-gray-400" />
          <p className="rf-text-gray-600">Fetching quotes...</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="rf-text-red-600 rf-text-center rf-py-12">
          No quotes available.
        </div>
      ) : (
        quotes.map((quote, idx) => (
          <VendorQuoteCard
            key={quote.order_quote_id}
            vendor={quote}
            isActive={selectedVendorIdx === idx}
            onSelect={() => setSelectedVendorIdx(idx)}
            selectedShippingIdx={
              selectedVendorIdx === idx ? selectedShippingIdx : null
            }
            onSelectShipping={setSelectedShippingIdx}
          />
        ))
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
          disabled={
            selectedVendorIdx === null ||
            // selectedShippingIdx === null ||
            loading
          }
          onClick={() => {
            if (
              selectedVendorIdx === null ||
              // selectedShippingIdx === null ||
              loading
            ) {
              toast.error("Please select a vendor and shipping option.")
              return
            }
            
            if (orderQuoteReceived) {
              redirectToStripeCheckout(orderQuoteReceived.order_quote_id)
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
