import { MapPin } from "lucide-react"
import { Button } from "lib/components/ui/button"
import { Input } from "lib/components/ui/input"
import { cn } from "lib/utils"
import { useState } from "react"
import { toast } from "react-hot-toast"

interface SavedAddress {
  id: number
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

interface CheckoutOrderProps {
  finalCost: number
  onConfirmCheckout: () => void
  onCancel: () => void
}

export const CheckoutOrder = ({
  finalCost,
  onConfirmCheckout,
  onCancel,
}: CheckoutOrderProps) => {
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
    null,
  )

  const [savedAddresses] = useState<SavedAddress[]>([
    {
      id: 1,
      name: "Home",
      street: "123 Main St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "USA",
      isDefault: true,
    },
    {
      id: 2,
      name: "Office",
      street: "456 Market St",
      city: "San Francisco",
      state: "CA",
      zipCode: "94103",
      country: "USA",
      isDefault: false,
    },
  ])

  const [addressForm, setAddressForm] = useState({
    name: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setAddressForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectAddress = (addressId: number) => {
    setSelectedAddressId(addressId)
    const selectedAddress = savedAddresses.find((addr) => addr.id === addressId)

    if (selectedAddress) {
      setAddressForm({
        name: selectedAddress.name,
        street: selectedAddress.street,
        city: selectedAddress.city,
        state: selectedAddress.state,
        zipCode: selectedAddress.zipCode,
        country: selectedAddress.country,
      })
    }
  }

  const handleConfirmCheckout = () => {
    // Validate form
    if (
      !selectedAddressId &&
      (!addressForm.street || !addressForm.city || !addressForm.zipCode)
    ) {
      toast.error("Please provide a complete shipping address.")
      return
    }

    toast.success("Your PCB order has been placed successfully.")

    onConfirmCheckout()
  }

  return (
    <div className="rf-bg-white rf-rounded-xl rf-p-6 rf-mx-auto">
      <h2 className="rf-text-2xl rf-font-bold rf-mb-6">Checkout</h2>

      <div className="rf-grid rf-grid-cols-1 md:rf-grid-cols-2 rf-gap-8">
        {/* Left side - Address Form */}
        <div className="rf-space-y-6">
          <h3 className="rf-text-lg rf-font-semibold">Shipping Address</h3>

          {savedAddresses.length > 0 && (
            <div className="rf-space-y-4">
              <div className="rf-text-sm rf-font-medium rf-text-gray-500">
                Saved Addresses
              </div>
              <div className="rf-flex rf-flex-wrap rf-gap-3">
                {savedAddresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => handleSelectAddress(address.id)}
                    className={cn(
                      "rf-flex rf-items-center rf-gap-2 rf-px-3 rf-py-2 rf-text-sm rf-rounded-md rf-border rf-transition-colors",
                      selectedAddressId === address.id
                        ? "rf-border-blue-500 rf-bg-blue-50 rf-text-blue-700"
                        : "rf-border-gray-200 rf-hover:bg-gray-50",
                    )}
                  >
                    <MapPin className="rf-h-4 rf-w-4" />
                    <span>{address.name}</span>
                    {address.isDefault && (
                      <span className="rf-inline-flex rf-items-center rf-rounded-full rf-bg-blue-100 rf-px-2 rf-py-0.5 rf-text-xs rf-font-medium rf-text-blue-800">
                        Default
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="rf-space-y-4">
            <div className="rf-grid rf-grid-cols-2 rf-gap-4">
              <div className="rf-space-y-2">
                <label htmlFor="name">Address Name</label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Home, Office, etc."
                  value={addressForm.name}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="rf-space-y-2">
              <label htmlFor="street">Street Address</label>
              <Input
                id="street"
                name="street"
                placeholder="123 Main St"
                value={addressForm.street}
                onChange={handleInputChange}
              />
            </div>

            <div className="rf-grid rf-grid-cols-2 rf-gap-4">
              <div className="rf-space-y-2">
                <label htmlFor="city">City</label>
                <Input
                  id="city"
                  name="city"
                  placeholder="City"
                  value={addressForm.city}
                  onChange={handleInputChange}
                />
              </div>
              <div className="rf-space-y-2">
                <label htmlFor="state">State</label>
                <Input
                  id="state"
                  name="state"
                  placeholder="State"
                  value={addressForm.state}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="rf-grid rf-grid-cols-2 rf-gap-4">
              <div className="rf-space-y-2">
                <label htmlFor="zipCode">Zip Code</label>
                <Input
                  id="zipCode"
                  name="zipCode"
                  placeholder="Zip Code"
                  value={addressForm.zipCode}
                  onChange={handleInputChange}
                />
              </div>
              <div className="rf-space-y-2">
                <label htmlFor="country">Country</label>
                <Input
                  id="country"
                  name="country"
                  placeholder="Country"
                  value={addressForm.country}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Order Summary */}
        <div className="rf-bg-gray-50 rf-p-6 rf-rounded-lg">
          <h3 className="rf-text-lg rf-font-semibold rf-mb-4">Order Summary</h3>

          <div className="rf-space-y-4">
            <div className="rf-flex rf-justify-between rf-py-2 rf-border-b rf-border-gray-200">
              <span className="rf-text-gray-600">PCB Manufacturing</span>
              <span className="rf-font-medium">
                ${(finalCost * 0.6).toFixed(2)}
              </span>
            </div>

            <div className="rf-flex rf-justify-between rf-py-2 rf-border-b rf-border-gray-200">
              <span className="rf-text-gray-600">Components</span>
              <span className="rf-font-medium">
                ${(finalCost * 0.3).toFixed(2)}
              </span>
            </div>

            <div className="rf-flex rf-justify-between rf-py-2 rf-border-b rf-border-gray-200">
              <span className="rf-text-gray-600">Assembly</span>
              <span className="rf-font-medium">
                ${(finalCost * 0.1).toFixed(2)}
              </span>
            </div>

            <div className="rf-flex rf-justify-between rf-py-2 rf-border-b rf-border-gray-200">
              <span className="rf-text-gray-600">Shipping</span>
              <span className="rf-font-medium">$15.00</span>
            </div>

            <div className="rf-flex rf-justify-between rf-py-2 rf-text-lg rf-font-bold">
              <span>Total</span>
              <span>${(finalCost + 15).toFixed(2)}</span>
            </div>

            <div className="rf-pt-4">
              <Button
                onClick={handleConfirmCheckout}
                className="rf-w-full rf-bg-gray-700 rf-hover:bg-gray-800 rf-text-white rf-py-3"
              >
                Confirm and Place Order
              </Button>

              <Button
                variant="outline"
                onClick={onCancel}
                className="rf-w-full rf-mt-3"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
