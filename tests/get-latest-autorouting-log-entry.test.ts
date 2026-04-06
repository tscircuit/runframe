import { describe, expect, test } from "bun:test"
import { getLatestAutoroutingLogEntry } from "../lib/utils/get-latest-autorouting-log-entry"

describe("getLatestAutoroutingLogEntry", () => {
  test("returns entry with highest board number when board keys exist", () => {
    const latest = getLatestAutoroutingLogEntry({
      "<board#25 />": { simpleRouteJson: { id: 25 }, createdAt: 1000 },
      "<board#63 />": { simpleRouteJson: { id: 63 }, createdAt: 900 },
      "<board#10 />": { simpleRouteJson: { id: 10 }, createdAt: 1200 },
    })

    expect(latest?.key).toBe("<board#63 />")
    expect(latest?.value.simpleRouteJson).toEqual({ id: 63 })
  })

  test("falls back to latest createdAt when keys are not numbered", () => {
    const latest = getLatestAutoroutingLogEntry({
      "autoroute-a": { simpleRouteJson: { id: "a" }, createdAt: 1000 },
      "autoroute-b": { simpleRouteJson: { id: "b" }, createdAt: 2000 },
    })

    expect(latest?.key).toBe("autoroute-b")
  })
})
