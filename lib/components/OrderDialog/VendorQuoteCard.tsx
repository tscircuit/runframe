import { Truck, Package } from "lucide-react"
import { cn } from "lib/utils"

export interface ShippingOption {
  carrier: string
  service: string
  cost: number
  base_shipping_cost: number
  duties_cost: number
}

export interface OrderQuote {
  account_id: string
  bare_pcb_cost: number
  completed_at: string
  created_at: string
  error: null | string
  has_error: boolean
  is_completed: boolean
  is_processing: boolean
  order_quote_id: string
  package_release_id: string
  quoted_components: {
    available: boolean
    manufacturer_part_number: string
    supplier_part_number: string
    quantity: number
    unit_price: number
    total_price: number
  }[]
  shipping_options: ShippingOption[]
  total_cost_without_shipping: number
  updated_at: string
  vendor_name: string
}

interface Props {
  orderQuote: OrderQuote
  selectedShippingCarrier: string | null
  onSelectShippingCarrier: (carrier: string) => void
  lowestShippingCarrierCost: number
}

export default function VendorQuoteCard({
  orderQuote,
  selectedShippingCarrier,
  onSelectShippingCarrier,
  lowestShippingCarrierCost,
}: Props) {
  // Find the selected shipping option
  const selectedShipping = selectedShippingCarrier
    ? orderQuote.shipping_options.find(
        (ship) => ship.carrier === selectedShippingCarrier,
      )
    : null

  return (
    <div className="rf-rounded-xl rf-bg-white rf-shadow-lg rf-border rf-border-gray-200">
      <div className="rf-flex rf-items-center rf-justify-between rf-px-6 rf-pt-4 rf-pb-2">
        <div className="rf-flex rf-items-center rf-gap-2">
          <Package className="rf-w-6 rf-h-6 rf-text-blue-500" />
          <span className="rf-font-semibold rf-text-lg">
            {orderQuote.vendor_name.toUpperCase()}
          </span>
        </div>
        <div className="rf-flex rf-flex-col rf-items-end">
          <span className="rf-text-gray-500 rf-text-sm">
            Fully Assembled PCB
          </span>
          <div className="rf-flex rf-items-center rf-gap-2">
            <span className="rf-text-gray-400 rf-line-through rf-text-base">
              ${lowestShippingCarrierCost.toFixed(2)}
            </span>
            <span className="rf-font-bold rf-text-xl rf-text-blue-600">
              $50.00
            </span>
          </div>
        </div>
      </div>

      <hr className="rf-border-gray-200" />
      <div className="rf-px-6 rf-pt-4 rf-pb-2">
        <div className="rf-mb-2 rf-text-sm rf-font-bold rf-text-gray-700">
          Shipping Options:
        </div>
        <div className="rf-flex rf-flex-col rf-gap-2 rf-mb-2">
          {orderQuote.shipping_options.map((ship, idx) => (
            <button
              key={ship.carrier + idx}
              type="button"
              className={cn(
                "rf-flex rf-items-center rf-gap-3 rf-px-4 rf-py-3 rf-rounded-lg rf-border rf-min-w-[148px] rf-transition-colors rf-bg-white",
                selectedShippingCarrier === ship.carrier
                  ? "rf-border-blue-600 rf-bg-blue-50 rf-ring-2 rf-ring-blue-500"
                  : "rf-border-gray-300 rf-bg-gray-50 hover:rf-border-blue-300",
              )}
              onClick={() => onSelectShippingCarrier(ship.carrier)}
            >
              <Truck className="rf-w-5 rf-h-5 rf-text-yellow-500" />
              <div className="rf-text-left rf-flex-1">
                <div className="rf-leading-tight rf-font-medium">
                  {ship.carrier}
                </div>
                <div className="rf-text-xs rf-text-gray-500">
                  Express, 5-12 days
                </div>
              </div>
              <div className="rf-flex rf-flex-col rf-items-end rf-ml-2">
                <span className="rf-text-gray-400 rf-line-through rf-text-sm">
                  ${ship.cost.toFixed(2)}
                </span>
                <span className="rf-text-xs rf-text-blue-600 rf-font-medium">
                  waived
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedShippingCarrier !== null && selectedShipping && (
        <div className="rf-px-6 rf-pb-4 rf-pt-2">
          <div className="rf-flex rf-justify-between rf-items-center rf-mt-3 rf-mb-2">
            <span className="rf-text-gray-700 rf-font-bold">
              Total (incl. shipping):
            </span>
            <div className="rf-flex rf-flex-col rf-items-end">
              <div className="rf-text-gray-400 rf-line-through rf-text-base">
                $
                {(
                  orderQuote.total_cost_without_shipping + selectedShipping.cost
                ).toFixed(2)}
              </div>
              <div className="rf-flex rf-items-center">
                <span className="rf-font-bold rf-text-xl rf-text-blue-600">
                  $50.00
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
