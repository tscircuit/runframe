import type { WebWorkerConfiguration } from "@tscircuit/eval/worker"
import type { RunFrameProps } from "./RunFrameProps"

const objectIds = new WeakMap<object, number>()
let nextObjectId = 1

const getObjectCacheKey = (value: unknown) => {
  if (!value || (typeof value !== "object" && typeof value !== "function")) {
    return value
  }
  const objectValue = value as object
  if (!objectIds.has(objectValue)) {
    objectIds.set(objectValue, nextObjectId++)
  }
  return objectIds.get(objectValue)
}

const getDefaultProjectBaseUrl = () => {
  const apiBase =
    typeof window !== "undefined"
      ? window.TSCIRCUIT_FILESERVER_API_BASE_URL
      : undefined
  return `${apiBase ?? "/api"}/files/static`
}

export const createRunFrameWorkerConfig = (
  props: RunFrameProps,
  opts: {
    evalVersion: string
    useRunFrameForCli?: boolean
  },
): Partial<WebWorkerConfiguration> => ({
  evalVersion: opts.evalVersion,
  webWorkerBlobUrl: props.evalWebWorkerBlobUrl,
  verbose: true,
  projectConfig: {
    projectBaseUrl: props.projectBaseUrl || getDefaultProjectBaseUrl(),
  },
  ...(props.platformConfig && {
    platform: props.platformConfig,
  }),
  ...(props.enableFetchProxy && {
    enableFetchProxy: props.enableFetchProxy,
  }),
  ...(opts.useRunFrameForCli && {
    disableCdnLoading: true,
  }),
  ...(props.tscircuitSessionToken && {
    tscircuitSessionToken: props.tscircuitSessionToken,
  }),
  ...(props.easyEdaProxyConfig && {
    easyEdaProxyConfig: props.easyEdaProxyConfig,
  }),
})

export const getRunFrameWorkerConfigCacheKey = (
  props: RunFrameProps,
  opts: {
    evalVersion: string
    useRunFrameForCli?: boolean
  },
) =>
  JSON.stringify({
    evalVersion: opts.evalVersion,
    webWorkerBlobUrl: props.evalWebWorkerBlobUrl,
    projectBaseUrl: props.projectBaseUrl || getDefaultProjectBaseUrl(),
    platformConfig: getObjectCacheKey(props.platformConfig),
    enableFetchProxy: props.enableFetchProxy,
    useRunFrameForCli: opts.useRunFrameForCli,
    tscircuitSessionToken: props.tscircuitSessionToken,
    easyEdaProxyConfig: getObjectCacheKey(props.easyEdaProxyConfig),
  })
