/** Additional views supplied by the application embedding RunFrame. */
export interface ExtraRunFrameTab {
  tabName: string
  /** An absolute HTTP(S) URL. The embedding application must trust this page. */
  iframeUrl: string
  /** Show only when this project-relative circuit path is selected. */
  mainComponentPath?: string
}

export type ExtraRunFrameTabId = `extra:${string}`

export interface ResolvedExtraRunFrameTab extends ExtraRunFrameTab {
  tabId: ExtraRunFrameTabId
}

const normalizeComponentPath = (path: string) =>
  path.replaceAll("\\", "/").replace(/^(\.\/)+/, "")

/** Filter before deduplicating so different circuits can each have a Sysconfig tab. */
export function filterExtraRunFrameTabs(
  tabs: readonly ExtraRunFrameTab[] | undefined,
  mainComponentPath: string | undefined,
): ExtraRunFrameTab[] {
  if (!Array.isArray(tabs)) return []
  return tabs.filter((tab) => {
    if (!tab || typeof tab !== "object") return false
    if (tab.mainComponentPath === undefined) return true
    return (
      typeof tab.mainComponentPath === "string" &&
      tab.mainComponentPath.trim().length > 0 &&
      typeof mainComponentPath === "string" &&
      normalizeComponentPath(tab.mainComponentPath) ===
        normalizeComponentPath(mainComponentPath)
    )
  })
}

/** Treat bootstrap data as untrusted input, including when supplied by JavaScript. */
export function resolveExtraRunFrameTabs(
  extraTabsInput: unknown,
): ResolvedExtraRunFrameTab[] {
  if (!Array.isArray(extraTabsInput)) return []
  const names = new Set<string>()
  const tabs: ResolvedExtraRunFrameTab[] = []
  for (const tab of extraTabsInput) {
    if (!tab || typeof tab !== "object") continue
    if (typeof tab.tabName !== "string" || typeof tab.iframeUrl !== "string")
      continue
    const tabName = tab.tabName.trim()
    if (!tabName || names.has(tabName)) continue
    let url: URL
    let tabId: ExtraRunFrameTabId
    try {
      url = new URL(tab.iframeUrl)
      tabId = `extra:${encodeURIComponent(tabName)}`
    } catch {
      continue
    }
    if (!["http:", "https:"].includes(url.protocol)) continue
    if (url.username || url.password) continue
    names.add(tabName)
    tabs.push({
      tabName,
      iframeUrl: url.href,
      tabId,
    })
  }
  return tabs
}
