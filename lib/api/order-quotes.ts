import { registryKy } from "lib/utils/get-registry-ky"
import type { OrderQuote } from "@tscircuit/fake-snippets/schema"
import { HTTPError } from "ky"

export const createOrderQuote = async (packageReleaseId: string) => {
  try {
    const { order_quote_id } = await registryKy
      .post("order_quotes/create", {
        json: {
          package_release_id: packageReleaseId,
          vendor_name: "jlcpcb", // TODO: Remove this once we have more vendor
        },
      })
      .json<{
        order_quote_id?: string
        error?: {
          message: string
          error_code: string
        }
      }>()
    return order_quote_id
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorBody = await err.response.json()
      throw new Error(errorBody.message || err.message)
    }
    throw err
  }
}

export const getOrderQuote = async (orderQuoteId: string) => {
  const { order_quote } = await registryKy
    .get(`order_quotes/get`, {
      searchParams: {
        order_quote_id: orderQuoteId,
      },
    })
    .json<{ order_quote: OrderQuote }>()
  return order_quote
}
