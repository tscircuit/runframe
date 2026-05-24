import posthog from "posthog-js"

import { getWindowVar } from "./get-registry-ky"

const POSTHOG_PROJECT_API_KEY =
  "phc_htd8AQjSfVEsFCLQMAiUooG4Q0DKBCjqYuQglc9V3Wo"
const POSTHOG_API_HOST = "https://postpig.tscircuit.com"
const RUNFRAME_ANONYMOUS_ID_STORAGE_KEY = "runframe:anonymous-id"

const isBrowser = () => typeof window !== "undefined"

const isLocalHost = (hostname: string) =>
  hostname.includes("localhost") || hostname.includes("127.0.0.1")

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

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const payload = token.split(".")[1]
  if (!payload) return null

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/")
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "=",
    )
    return JSON.parse(atob(paddedPayload))
  } catch {
    return null
  }
}

export const getAccountIdFromSessionToken = (sessionToken?: string | null) => {
  if (!sessionToken) return null

  const payload = decodeJwtPayload(sessionToken)
  const accountId = payload?.account_id ?? payload?.accountId

  if (typeof accountId !== "string") return null
  if (!accountId.trim()) return null

  return accountId
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
  })

  return true
}

export interface RunFrameActivityProperties {
  source: "runframe" | "circuit_json_viewer"
  sessionToken?: string | null
  component?: string
  isWebEmbedded?: boolean
  defaultActiveTab?: string
}

const getRunFrameIdentity = (sessionToken?: string | null) => {
  if (!initPostHog()) return null

  const accountId = getAccountIdFromSessionToken(sessionToken)
  const embedDomain = getRunFrameEmbedDomain()
  const shouldUseDomainIdentity =
    embedDomain != null && !isLocalHost(embedDomain)
  let anonymousId = null
  if (!accountId && !shouldUseDomainIdentity) {
    anonymousId = getRunFrameAnonymousId()
  }
  let distinctId: string | undefined
  let identityType: "account_id" | "domain" | "anonymous_id"

  if (accountId) {
    distinctId = `account:${accountId}`
    identityType = "account_id"
  } else if (shouldUseDomainIdentity) {
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
    accountId,
    embedDomain,
    anonymousId,
    distinctId,
    identityType,
  }
}

export const captureRunFrameTelemetry = (
  eventName: string,
  { source, sessionToken, ...properties }: RunFrameActivityProperties,
) => {
  const identity = getRunFrameIdentity(sessionToken)
  if (!identity) return

  const { accountId, embedDomain, anonymousId, distinctId, identityType } =
    identity

  if (distinctId) {
    const personProperties: Record<string, string> = {}
    if (accountId) {
      personProperties.account_id = accountId
    }
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
    account_id: accountId,
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
