import { registryKy } from "lib/utils/get-registry-ky"
import type { OrderQuote } from "@tscircuit/fake-snippets/schema"

export const createOrderQuote = async (packageReleaseId: string) => {
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

export const getOrderQuotes = async (orderQuoteId: string) => {
  const { order_quote } = await registryKy
    .get(`order_quotes/get`, {
      searchParams: {
        order_quote_id: orderQuoteId,
      },
    })
    .json<{ order_quote: OrderQuote }>()
  return order_quote
} 