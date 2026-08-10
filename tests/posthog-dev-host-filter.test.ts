import { describe, expect, test } from "bun:test"

import { dropViteDevExceptions, isLocalHost } from "../lib/utils/posthog"

describe("isLocalHost", () => {
  test("matches loopback and localhost names", () => {
    expect(isLocalHost("localhost")).toBe(true)
    expect(isLocalHost("app.localhost")).toBe(true)
    expect(isLocalHost("127.0.0.1")).toBe(true)
    expect(isLocalHost("::1")).toBe(true)
    expect(isLocalHost("[::1]")).toBe(true)
    expect(isLocalHost("my-machine.local")).toBe(true)
  })

  test("matches private LAN ranges", () => {
    expect(isLocalHost("10.0.0.5")).toBe(true)
    expect(isLocalHost("192.168.1.20")).toBe(true)
    expect(isLocalHost("172.16.0.1")).toBe(true)
    expect(isLocalHost("172.31.255.254")).toBe(true)
    expect(isLocalHost("172.15.0.1")).toBe(false)
    expect(isLocalHost("172.32.0.1")).toBe(false)
  })

  test("matches the CGNAT / Tailscale range", () => {
    expect(isLocalHost("100.71.249.93")).toBe(true)
    expect(isLocalHost("100.64.0.0")).toBe(true)
    expect(isLocalHost("100.127.255.255")).toBe(true)
    expect(isLocalHost("100.63.0.1")).toBe(false)
    expect(isLocalHost("100.128.0.1")).toBe(false)
  })

  test("does not match public hostnames", () => {
    expect(isLocalHost("tscircuit.com")).toBe(false)
    expect(isLocalHost("8.8.8.8")).toBe(false)
    expect(isLocalHost("100.200.1.1")).toBe(false)
  })
})

const makeViteException = (filename: string) =>
  ({
    event: "$exception",
    properties: {
      $exception_list: [
        {
          stacktrace: {
            frames: [
              { filename: "app.js", function: "onError" },
              { filename, function: "send" },
            ],
          },
        },
      ],
    },
  }) as any

describe("dropViteDevExceptions", () => {
  test("drops an exception whose top frame is the Vite dev client", () => {
    expect(
      dropViteDevExceptions(makeViteException("http://x/@vite/client")),
    ).toBe(null)
  })

  test("keeps an exception from an application frame", () => {
    const result = makeViteException("http://x/lib/app.js")
    expect(dropViteDevExceptions(result)).toBe(result)
  })

  test("keeps non-exception events", () => {
    const result = { event: "runframe_activity", properties: {} } as any
    expect(dropViteDevExceptions(result)).toBe(result)
  })

  test("passes a null result through", () => {
    expect(dropViteDevExceptions(null)).toBe(null)
  })
})
