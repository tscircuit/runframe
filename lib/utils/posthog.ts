import posthog from "posthog-js"
import type { BeforeSendFn, CaptureResult } from "posthog-js"

import { getWindowVar } from "./get-registry-ky"

const POSTHOG_PROJECT_API_KEY =
  "phc_htd8AQjSfVEsFCLQMAiUooG4Q0DKBCjqYuQglc9V3Wo"
const POSTHOG_API_HOST = "https://postpig.tscircuit.com"
const RUNFRAME_ANONYMOUS_ID_STORAGE_KEY = "runframe:anonymous-id"

const isBrowser = () => typeof window !== "undefined"

// Matches loopback, private LAN, and CGNAT/Tailscale hostnames. A development
// server can run on any of these, so telemetry must stay off for all of them.
export const isLocalHost = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "")
  if (host === "localhost" || host.endsWith(".localhost")) return true
  if (host.endsWith(".local")) return true
  if (host === "::1") return true

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/)
  if (!ipv4) return false
  const first = Number(ipv4[1])
  const second = Number(ipv4[2])
  if (first === 127) return true // loopback
  if (first === 10) return true // private
  if (first === 192 && second === 168) return true // private
  if (first === 172 && second >= 16 && second <= 31) return true // private
  if (first === 100 && second >= 64 && second <= 127) return true // CGNAT / Tailscale
  return false
}

// Vite injects its dev client at /@vite/client, which only exists on a
// development server. An exception thrown from that frame can never happen in a
// built bundle, so drop it instead of sending it to error tracking.
const isViteDevException = (result: CaptureResult) => {
  if (result.event !== "$exception") return false
  const exceptionList = result.properties?.$exception_list
  if (!Array.isArray(exceptionList)) return false

  return exceptionList.some((exception) => {
    const frames = exception?.stacktrace?.frames
    if (!Array.isArray(frames) || frames.length === 0) return false
    const topFrame = frames[frames.length - 1]
    return (
      typeof topFrame?.filename === "string" &&
      topFrame.filename.includes("/@vite/")
    )
  })
}

export const dropViteDevExceptions: BeforeSendFn = (result) => {
  if (result && isViteDevException(result)) return null
  return result
}

const getHostnameFromUrl = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

export const getRunFrameEmbedDomain = () => {
  if (!isBrowser()) return null

  let referrerHostname = null
  if (document.referrer) {
    referrerHostname = getHostnameFromUrl(document.referrer)
  }

  return referrerHostname ?? window.location.hostname
}

const createRunFrameAnonymousId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

export const getRunFrameAnonymousId = () => {
  if (!isBrowser()) return null

  try {
    const storedId = window.localStorage.getItem(
      RUNFRAME_ANONYMOUS_ID_STORAGE_KEY,
    )
    if (storedId) return storedId

    const newId = createRunFrameAnonymousId()
    window.localStorage.setItem(RUNFRAME_ANONYMOUS_ID_STORAGE_KEY, newId)
    return newId
  } catch {
    return null
  }
}

const shouldTrackOnLocalhost = () =>
  getWindowVar("TSCIRCUIT_USE_RUNFRAME_FOR_CLI") === true

export const initPostHog = () => {
  if (!isBrowser()) return false
  if (isLocalHost(window.location.hostname) && !shouldTrackOnLocalhost()) {
    return false
  }
  if ((posthog as any).__loaded) return true

  posthog.init(POSTHOG_PROJECT_API_KEY, {
    api_host: POSTHOG_API_HOST,
    person_profiles: "always",
    before_send: dropViteDevExceptions,
  })

  return true
}

export interface RunFrameActivityProperties {
  source: "runframe" | "circuit_json_viewer"
  component?: string
  isWebEmbedded?: boolean
  activeTab?: string
}

const getRunFrameIdentity = () => {
  if (!initPostHog()) return null

  const embedDomain = getRunFrameEmbedDomain()
  const shouldUseDomainIdentity =
    embedDomain != null && !isLocalHost(embedDomain)
  let anonymousId = null
  if (!shouldUseDomainIdentity) {
    anonymousId = getRunFrameAnonymousId()
  }
  let distinctId: string | undefined
  let identityType: "domain" | "anonymous_id"

  if (shouldUseDomainIdentity) {
    distinctId = `domain:${embedDomain}`
    identityType = "domain"
  } else {
    distinctId = undefined
    if (anonymousId) {
      distinctId = `anonymous:${anonymousId}`
    }
    identityType = "anonymous_id"
  }

  return {
    embedDomain,
    anonymousId,
    distinctId,
    identityType,
  }
}

export const captureRunFrameTelemetry = (
  eventName: string,
  { source, ...properties }: RunFrameActivityProperties,
) => {
  const identity = getRunFrameIdentity()
  if (!identity) return

  const { embedDomain, anonymousId, distinctId, identityType } = identity

  if (distinctId) {
    const personProperties: Record<string, string> = {}
    if (identityType === "domain" && embedDomain) {
      personProperties.embed_domain = embedDomain
    }
    if (identityType === "anonymous_id" && anonymousId) {
      personProperties.runframe_anonymous_id = anonymousId
    }

    posthog.identify(distinctId, personProperties)
  }

  posthog.capture(eventName, {
    ...properties,
    source,
    embed_domain: embedDomain,
    runframe_anonymous_id: anonymousId,
    identity_type: identityType,
  })
}

export const captureRunFrameActivity = (
  properties: RunFrameActivityProperties,
) => {
  captureRunFrameTelemetry("runframe_activity", properties)
}

initPostHog()

export { posthog }
