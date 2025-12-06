const EASYEDA_BROWSER_URL =
  "https://cdn.jsdelivr.net/npm/easyeda@0.0.228/dist/browser/index.js"

type EasyedaBrowserModule = {
  fetchEasyEDAComponent: (
    partNumber: string,
    options?: {
      fetch?: (url: RequestInfo, init?: RequestInit) => Promise<Response>
    },
  ) => Promise<any>
  convertRawEasyToTsx: (component: any) => Promise<string>
}

let easyedaBrowserPromise: Promise<EasyedaBrowserModule> | null = null

export const loadEasyedaBrowser = async (): Promise<EasyedaBrowserModule> => {
  if (!easyedaBrowserPromise) {
    easyedaBrowserPromise = import(
      /* @vite-ignore */ EASYEDA_BROWSER_URL
    ) as Promise<EasyedaBrowserModule>
  }

  return easyedaBrowserPromise
}
