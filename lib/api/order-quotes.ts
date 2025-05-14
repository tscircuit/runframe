import { registryKy } from "lib/utils/get-registry-ky"
import type { OrderQuote } from "@tscircuit/fake-snippets/schema"
import { HTTPError } from "ky"

export interface OrderQuoteError {
  error: {
    message: string
    error_code: string
  }
}

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
        error?: OrderQuoteError
      }>()
    return order_quote_id
  } catch (error) {
    if (error instanceof HTTPError) {
      const errorBody = await error.response.json()
      throw {
        error: {
          message: errorBody.message,
          error_code: errorBody.error_code,
        },
      }
    }
    throw error
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
