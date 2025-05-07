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
  vendor: OrderQuote
  isActive: boolean
  onSelect: () => void
  selectedShippingCarrier: string | null
  onSelectShippingCarrier: (carrier: string) => void
}

export default function VendorQuoteCard({
  vendor,
  isActive,
  onSelect,
  selectedShippingCarrier,
  onSelectShippingCarrier,
}: Props) {
  // Find the selected shipping option
  const selectedShipping = selectedShippingCarrier
    ? vendor.shipping_options.find(
        (ship) => ship.carrier === selectedShippingCarrier,
      )
    : null

  return (
    <div
      className={cn(
        "rf-rounded-xl rf-border rf-transition-all rf-cursor-pointer rf-mb-6 rf-bg-white rf-shadow-sm hover:rf-shadow-lg",
        isActive
          ? "rf-ring-2 rf-ring-primary rf-border-primary"
          : "rf-border-gray-200",
      )}
      onClick={onSelect}
    >
      <div className="rf-flex rf-items-center rf-justify-between rf-px-6 rf-py-4">
        <div className="rf-flex rf-items-center rf-gap-2">
          <Package className="rf-w-6 rf-h-6 rf-text-blue-500" />
          <span className="rf-font-semibold rf-text-lg">
            {vendor.vendor_name.toUpperCase()}
          </span>
        </div>
        <div className="rf-flex rf-flex-col rf-items-end">
          <span className="rf-text-gray-500 rf-text-sm">
            Fully Assembled PCB
          </span>
          <div className="rf-flex rf-items-center rf-gap-2">
            <span className="rf-font-bold rf-text-xl rf-text-blue-600">
              ${vendor.total_cost_without_shipping.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {isActive && (
        <>
          <hr className="rf-border-gray-200" />
          <div className="rf-px-6 rf-py-2">
            <div className="rf-mb-2 rf-text-sm rf-font-medium rf-text-gray-700">
              Shipping Options:
            </div>
            <div className="rf-flex rf-gap-4 rf-flex-wrap rf-mb-2">
              {vendor.shipping_options.map((ship, idx) => (
                <button
                  key={ship.carrier + idx}
                  type="button"
                  className={cn(
                    "rf-flex rf-items-center rf-gap-2 rf-px-4 rf-py-2 rf-rounded-lg rf-border rf-shadow rf-min-w-[148px] rf-transition-colors",
                    selectedShippingCarrier === ship.carrier
                      ? "rf-border-blue-600 rf-bg-blue-50 rf-ring-2 rf-ring-blue-500"
                      : "rf-border-gray-300 rf-bg-gray-50 hover:rf-border-blue-300",
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectShippingCarrier(ship.carrier)
                  }}
                >
                  <Truck className="rf-w-5 rf-h-5 rf-text-yellow-500" />
                  <div className="rf-text-left rf-flex-1">
                    <div className="rf-leading-tight rf-font-medium">
                      {ship.carrier}
                    </div>
                    <div className="rf-text-xs rf-text-gray-500">
                      {ship.service}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {isActive && selectedShippingCarrier !== null && selectedShipping && (
        <div className="rf-px-6 rf-pb-3">
          <div className="rf-flex rf-flex-col rf-gap-1 rf-mt-2">
            {/* Cost breakdown */}
            <div className="rf-flex rf-justify-between rf-items-center">
              <span className="rf-text-gray-600 rf-text-sm">
                Subtotal (PCB Cost):
              </span>
              <span className="rf-text-gray-800 rf-font-medium">
                ${vendor.total_cost_without_shipping.toFixed(2)}
              </span>
            </div>

            <div className="rf-flex rf-justify-between rf-items-center">
              <span className="rf-text-gray-600 rf-text-sm">
                Shipping cost:
              </span>
              <span className="rf-text-gray-800 rf-font-medium">
                ${selectedShipping.base_shipping_cost.toFixed(2)}
              </span>
            </div>

            <div className="rf-flex rf-justify-between rf-items-center">
              <span className="rf-text-gray-600 rf-text-sm">
                Duties & Taxes:
              </span>
              <span className="rf-text-gray-800 rf-font-medium">
                ${selectedShipping.duties_cost.toFixed(2)}
              </span>
            </div>

            <div className="rf-flex rf-justify-between rf-items-center rf-text-sm rf-text-red-500">
              <span className="rf-font-medium">Discount:</span>
              <span className="rf-font-medium">
                -$
                {(
                  vendor.total_cost_without_shipping +
                  selectedShipping.cost -
                  50
                ).toFixed(2)}
              </span>
            </div>

            {/* Divider */}
            <div className="rf-w-full rf-border-t rf-border-gray-200 rf-my-1" />

            {/* Total */}
            <div className="rf-flex rf-justify-between rf-items-center rf-mt-1">
              <span className="rf-text-gray-800 rf-font-semibold">Total:</span>
              <div className="rf-flex rf-items-center">
                <span className="rf-font-bold rf-text-xl rf-text-green-600">
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
