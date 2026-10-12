import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { SOURCE_CONFIG } from "./config"
import { loadJlcpcbComponentTsx } from "./api/jlcpcb"
import { canPreviewFootprint } from "./api/footprint-preview"
import { SearchBar } from "./components/SearchBar"
import { SearchResultsList } from "./components/SearchResultsList"
import { FootprintPreviewPanel } from "./components/FootprintPreviewPanel"
import { TscircuitPackageDetailsDialog } from "./components/TscircuitPackageDetailsDialog"
import { useTscircuitPackageDetails } from "./hooks/useTscircuitPackageDetails"
import { useFootprintPreviewCircuitJson } from "./hooks/useFootprintPreviewCircuitJson"
import type {
  ImportComponentDialog2Props,
  ImportComponentDialogSearchResult,
  TscircuitPackageSearchResult,
  ImportSource,
} from "./types"
import { useTscircuitPackageSearch } from "./hooks/useTscircuitPackageSearch"
import { useJlcpcbComponentSearch } from "./hooks/useJlcpcbComponentSearch"
import { useKicadFootprintSearch } from "./hooks/useKicadFootprintSearch"
import { useStyles } from "../../hooks/use-styles"
import { zIndexMap } from "lib/utils/z-index-map"
import { createLocalDatasheetCatalog } from "lib/optional-features/importing/datasheet-catalog/catalog"
import { useDatasheetComponentSearch } from "./hooks/useDatasheetComponentSearch"

const computeAvailableSources = ({
  onTscircuitPackageSelected,
  onJlcpcbComponentTsxLoaded,
  onKicadStringSelected,
  onDatasheetComponentTsxLoaded,
  cachedDatasheetImports,
}: Pick<
  ImportComponentDialog2Props,
  | "onTscircuitPackageSelected"
  | "onJlcpcbComponentTsxLoaded"
  | "onKicadStringSelected"
  | "onDatasheetComponentTsxLoaded"
  | "cachedDatasheetImports"
>): ImportSource[] => {
  if (cachedDatasheetImports) {
    return onDatasheetComponentTsxLoaded ? ["datasheets"] : []
  }
  const sources: ImportSource[] = []
  if (onTscircuitPackageSelected) sources.push("tscircuit.com")
  if (onJlcpcbComponentTsxLoaded) sources.push("jlcpcb")
  if (onKicadStringSelected) sources.push("kicad")
  return sources
}

export const ImportComponentDialog2 = ({
  isOpen,
  onClose,
  jlcpcbProxyRequestHeaders,
  onKicadStringSelected,
  onTscircuitPackageSelected,
  onJlcpcbComponentTsxLoaded,
  jlcpcbProxyApiBase,
  tscircuitSessionToken,
  cachedDatasheetImports = false,
  platformConfig,
  onDatasheetComponentTsxLoaded,
}: ImportComponentDialog2Props) => {
  useStyles()
  const importModeRef = React.useRef({
    cached: cachedDatasheetImports,
    platformFetch: platformConfig?.platformFetch,
    revision: 0,
  })
  if (
    importModeRef.current.cached !== cachedDatasheetImports ||
    importModeRef.current.platformFetch !== platformConfig?.platformFetch
  ) {
    importModeRef.current = {
      cached: cachedDatasheetImports,
      platformFetch: platformConfig?.platformFetch,
      revision: importModeRef.current.revision + 1,
    }
  }

  const availableSources = React.useMemo(
    () =>
      computeAvailableSources({
        onKicadStringSelected,
        onTscircuitPackageSelected,
        onJlcpcbComponentTsxLoaded,
        onDatasheetComponentTsxLoaded,
        cachedDatasheetImports,
      }),
    [
      onKicadStringSelected,
      onTscircuitPackageSelected,
      onJlcpcbComponentTsxLoaded,
      onDatasheetComponentTsxLoaded,
      cachedDatasheetImports,
    ],
  )

  const hasSources = availableSources.length > 0
  const singleSource = availableSources.length === 1
  const [sourceSelection, setActiveSource] = React.useState<ImportSource>(
    availableSources[0] ?? "tscircuit.com",
  )
  // Derive these immediately so a mode change cannot expose an old online result
  // before effects reset the dialog state.
  const activeSource = cachedDatasheetImports
    ? "datasheets"
    : availableSources.includes(sourceSelection)
      ? sourceSelection
      : (availableSources[0] ?? "tscircuit.com")

  const [searchQuery, setSearchQuery] = React.useState("")
  const [selection, setSelectedSearchResult] =
    React.useState<ImportComponentDialogSearchResult | null>(null)
  const selectedSearchResult =
    selection && availableSources.includes(selection.source) ? selection : null
  const datasheetCatalog = React.useMemo(
    () =>
      cachedDatasheetImports && platformConfig?.platformFetch
        ? createLocalDatasheetCatalog({
            platformFetch: platformConfig.platformFetch,
          })
        : null,
    [cachedDatasheetImports, platformConfig?.platformFetch],
  )
  const {
    results: datasheetResults,
    isSearching: isDatasheetSearching,
    error: datasheetError,
    hasSearched: hasDatasheetSearched,
    search: searchDatasheets,
    reset: resetDatasheetSearch,
  } = useDatasheetComponentSearch(datasheetCatalog)
  const {
    results: tscircuitResults,
    isSearching: isTscircuitSearching,
    error: tscircuitError,
    hasSearched: hasTscircuitSearched,
    search: searchTscircuit,
    reset: resetTscircuitSearch,
  } = useTscircuitPackageSearch({
    sessionToken: tscircuitSessionToken,
  })
  const {
    results: jlcpcbResults,
    isSearching: isJlcpcbSearching,
    error: jlcpcbError,
    hasSearched: hasJlcpcbSearched,
    search: searchJlcpcb,
    reset: resetJlcpcbSearch,
  } = useJlcpcbComponentSearch()
  const {
    results: kicadResults,
    isSearching: isKicadSearching,
    error: kicadError,
    hasSearched: hasKicadSearched,
    search: searchKicad,
    reset: resetKicadSearch,
  } = useKicadFootprintSearch()
  const {
    details: packageDetails,
    isLoading: isPackageDetailsLoading,
    fetchDetails: fetchPackageDetails,
    reset: resetPackageDetails,
  } = useTscircuitPackageDetails()
  const [componentForDetails, setComponentForDetails] =
    React.useState<TscircuitPackageSearchResult | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false)
  const [detailsPreviewTab, setDetailsPreviewTab] = React.useState<
    "pcb" | "schematic" | "3d"
  >("pcb")
  const [importErrorMessage, setImportErrorMessage] = React.useState<
    string | null
  >(null)
  const [isSubmittingImport, setIsSubmittingImport] = React.useState(false)
  const footprintPreviewOptions = React.useMemo(
    () => ({
      jlcpcb: {
        headers: jlcpcbProxyRequestHeaders,
        apiBase: jlcpcbProxyApiBase,
      },
      datasheetCatalog,
    }),
    [jlcpcbProxyApiBase, jlcpcbProxyRequestHeaders, datasheetCatalog],
  )
  const {
    circuitJson: footprintPreviewCircuitJson,
    error: footprintPreviewError,
    isLoading: isFootprintPreviewLoading,
  } = useFootprintPreviewCircuitJson(
    selectedSearchResult,
    footprintPreviewOptions,
  )
  const showFootprintPreview = canPreviewFootprint(selectedSearchResult)

  React.useEffect(() => {
    setImportErrorMessage(null)
  }, [selectedSearchResult])

  const resetAllSearches = React.useCallback(() => {
    resetTscircuitSearch()
    resetJlcpcbSearch()
    resetKicadSearch()
    resetDatasheetSearch()
    setSelectedSearchResult(null)
  }, [
    resetJlcpcbSearch,
    resetKicadSearch,
    resetTscircuitSearch,
    resetDatasheetSearch,
  ])

  React.useEffect(() => {
    resetAllSearches()
    setIsDetailsDialogOpen(false)
    setComponentForDetails(null)
    setImportErrorMessage(null)
  }, [cachedDatasheetImports, datasheetCatalog, resetAllSearches])

  React.useEffect(() => {
    if (!isOpen) {
      resetAllSearches()
      setSearchQuery("")
      setIsDetailsDialogOpen(false)
      setComponentForDetails(null)
      setImportErrorMessage(null)
    }
  }, [isOpen, resetAllSearches])

  React.useEffect(() => {
    setSearchQuery("")
    setSelectedSearchResult(null)
    if (activeSource === "tscircuit.com") {
      resetTscircuitSearch()
    } else if (activeSource === "jlcpcb") {
      resetJlcpcbSearch()
    } else if (activeSource === "kicad") {
      resetKicadSearch()
    } else if (activeSource === "datasheets") {
      resetDatasheetSearch()
    }
  }, [
    activeSource,
    resetJlcpcbSearch,
    resetKicadSearch,
    resetTscircuitSearch,
    resetDatasheetSearch,
  ])

  const handleShowDetails = (component: TscircuitPackageSearchResult) => {
    if (cachedDatasheetImports) return
    setSelectedSearchResult(component)
    setComponentForDetails(component)
    setDetailsPreviewTab("pcb")
    setIsDetailsDialogOpen(true)
    resetPackageDetails()
    const owner = component.package.org_owner_tscircuit_handle
    const unscopedName = component.package.unscoped_name
    if (owner && unscopedName) {
      const packageName = unscopedName.split("/").pop() ?? unscopedName
      fetchPackageDetails(owner, packageName)
    }
  }

  const performSearch = async () => {
    const trimmedQuery = searchQuery.trim()
    if (!trimmedQuery) return

    setSelectedSearchResult(null)

    if (cachedDatasheetImports) {
      await searchDatasheets(searchQuery)
    } else if (activeSource === "tscircuit.com") {
      await searchTscircuit(searchQuery)
    } else if (activeSource === "jlcpcb") {
      await searchJlcpcb(searchQuery)
    } else if (activeSource === "kicad") {
      await searchKicad(searchQuery)
    }
  }

  const performActionForComponent = async (
    result: ImportComponentDialogSearchResult,
  ) => {
    try {
      setImportErrorMessage(null)
      setIsSubmittingImport(true)
      const startedInCachedMode = importModeRef.current.cached
      const startedInRevision = importModeRef.current.revision
      const requireSameImportMode = () => {
        if (importModeRef.current.revision !== startedInRevision) {
          throw new Error("Import source changed; select a component again")
        }
      }
      if (startedInCachedMode && result.source !== "datasheets") {
        throw new Error(
          "Only cached datasheet components can be imported in this mode",
        )
      }
      if (result.source === "datasheets") {
        if (!cachedDatasheetImports || !datasheetCatalog) {
          throw new Error(
            "Cached datasheet imports require platformConfig.platformFetch",
          )
        }
        if (!onDatasheetComponentTsxLoaded) {
          throw new Error("Datasheet import handler not provided")
        }
        const component = await datasheetCatalog.loadComponent(result.datasheet)
        requireSameImportMode()
        await onDatasheetComponentTsxLoaded({ result, tsx: component.tsx })
      } else if (result.source === "kicad") {
        if (!onKicadStringSelected) {
          throw new Error("KiCad handler not provided")
        }
        await onKicadStringSelected({
          result,
          footprint: result.footprint.qualifiedName,
        })
      } else if (result.source === "jlcpcb") {
        if (!onJlcpcbComponentTsxLoaded) {
          throw new Error("JLCPCB handler not provided")
        }
        const tsx = await loadJlcpcbComponentTsx(result.component.partNumber, {
          headers: jlcpcbProxyRequestHeaders,
          apiBase: jlcpcbProxyApiBase,
        })
        requireSameImportMode()
        await onJlcpcbComponentTsxLoaded({ result, tsx })
      } else if (result.source === "tscircuit.com") {
        if (!onTscircuitPackageSelected) {
          throw new Error("tscircuit package handler not provided")
        }
        const owner = result.package.org_owner_tscircuit_handle
        const unscopedName = result.package.unscoped_name
        if (!owner || !unscopedName) {
          throw new Error("Missing package metadata")
        }
        const packageName = unscopedName.split("/").pop() ?? unscopedName
        const fullPackageName = `@tsci/${owner}.${packageName}`
        await onTscircuitPackageSelected({
          result,
          fullPackageName,
        })
      }
      return true
    } catch (error) {
      console.error("Failed to import component", error)
      setImportErrorMessage(
        error instanceof Error ? error.message : "Failed to import component",
      )
      return false
    } finally {
      setIsSubmittingImport(false)
    }
  }

  let searchResults: ImportComponentDialogSearchResult[] = []
  let isSearching = false
  let searchError: string | null = null
  let hasExecutedSearch = false

  if (cachedDatasheetImports) {
    searchResults = datasheetResults
    isSearching = isDatasheetSearching
    searchError = datasheetError
    hasExecutedSearch = hasDatasheetSearched
  } else if (activeSource === "tscircuit.com") {
    searchResults = tscircuitResults
    isSearching = isTscircuitSearching
    searchError = tscircuitError
    hasExecutedSearch = hasTscircuitSearched
  } else if (activeSource === "jlcpcb") {
    searchResults = jlcpcbResults
    isSearching = isJlcpcbSearching
    searchError = jlcpcbError
    hasExecutedSearch = hasJlcpcbSearched
  } else if (activeSource === "kicad") {
    searchResults = kicadResults
    isSearching = isKicadSearching
    searchError = kicadError
    hasExecutedSearch = hasKicadSearched
  }

  const handleConfirm = async () => {
    if (!selectedSearchResult) return
    const succeeded = await performActionForComponent(selectedSearchResult)
    if (succeeded) {
      onClose()
      resetAllSearches()
      setSearchQuery("")
    }
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  const handleDetailsClose = (open: boolean) => {
    setIsDetailsDialogOpen(open)
    if (!open) {
      setComponentForDetails(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent
        style={{
          width: "calc(100vw - 2rem)",
          maxWidth: showFootprintPreview
            ? "min(1120px, calc(100vw - 2rem))"
            : "min(672px, calc(100vw - 2rem))",
          zIndex: zIndexMap.importComponentDialog,
        }}
        className="rf-rounded-sm rf-max-h-[90vh] rf-overflow-y-auto rf-overflow-x-hidden rf-flex rf-flex-col"
      >
        <DialogHeader>
          <DialogTitle className="rf-text-lg sm:rf-text-xl">
            Import {singleSource ? SOURCE_CONFIG[activeSource].label : ""}{" "}
            Component
          </DialogTitle>
          <DialogDescription className="rf-text-sm">
            {cachedDatasheetImports && hasSources
              ? "Search components available in the local datasheet cache."
              : hasSources
                ? "Search for components from available sources."
                : "Import options are disabled because no handlers were provided."}
          </DialogDescription>
        </DialogHeader>

        {hasSources ? (
          <Tabs
            value={activeSource}
            onValueChange={(value) => setActiveSource(value as ImportSource)}
            className="rf-min-w-0 rf-w-full"
          >
            {!singleSource && (
              <TabsList className="rf-flex rf-w-full rf-gap-2">
                {availableSources.map((source) => (
                  <TabsTrigger
                    key={source}
                    value={source}
                    className="rf-flex-1 rf-text-xs sm:rf-text-sm"
                  >
                    {SOURCE_CONFIG[source].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            <div
              className="rf-min-w-0"
              style={
                showFootprintPreview
                  ? {
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0, 1fr) minmax(360px, 0.95fr)",
                      gap: "1.5rem",
                      alignItems: "start",
                    }
                  : undefined
              }
            >
              <div className="rf-min-w-0">
                <SearchBar
                  query={searchQuery}
                  placeholder={SOURCE_CONFIG[activeSource].placeholder}
                  isSearching={isSearching}
                  onQueryChange={setSearchQuery}
                  onSubmit={performSearch}
                />

                <div className="no-scrollbar rf-mt-4 rf-flex-1 rf-min-h-[200px] !rf-max-h-[40vh] !rf-overflow-y-auto rf-overflow-x-hidden rf-border rf-rounded-md rf-min-w-0">
                  {isSearching ? (
                    <div className="rf-p-8 rf-text-center rf-text-zinc-500">
                      <Loader2 className="rf-h-8 rf-w-8 rf-animate-spin rf-mx-auto rf-mb-2" />
                      <p>Searching...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <SearchResultsList
                      results={searchResults}
                      selected={selectedSearchResult}
                      onSelect={setSelectedSearchResult}
                      onShowDetails={
                        activeSource === "tscircuit.com"
                          ? handleShowDetails
                          : undefined
                      }
                    />
                  ) : (
                    <div className="rf-p-8 rf-text-center rf-text-zinc-500">
                      {searchError
                        ? `Error: ${searchError}`
                        : hasExecutedSearch
                          ? SOURCE_CONFIG[activeSource].emptyMessage
                          : "Enter a search term to find components"}
                    </div>
                  )}
                </div>
              </div>

              {showFootprintPreview ? (
                <div className="rf-mt-4">
                  <FootprintPreviewPanel
                    circuitJson={footprintPreviewCircuitJson}
                    error={footprintPreviewError}
                    isLoading={isFootprintPreviewLoading}
                    height={325}
                  />
                </div>
              ) : null}
            </div>
          </Tabs>
        ) : null}

        {importErrorMessage ? (
          <div className="rf-text-sm rf-text-red-600 rf-mt-2">
            {importErrorMessage}
          </div>
        ) : null}

        <DialogFooter className="rf-flex rf-flex-col sm:rf-flex-row rf-gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rf-order-2 sm:rf-order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedSearchResult || isSubmittingImport}
            className="rf-order-1 sm:rf-order-2"
          >
            {isSubmittingImport ? (
              <Loader2 className="rf-h-4 rf-w-4 rf-animate-spin" />
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {!cachedDatasheetImports && (
        <TscircuitPackageDetailsDialog
          packageResult={componentForDetails}
          isOpen={isDetailsDialogOpen}
          onOpenChange={handleDetailsClose}
          isLoading={isPackageDetailsLoading}
          details={packageDetails}
          previewTab={detailsPreviewTab}
          onPreviewTabChange={(value) => setDetailsPreviewTab(value)}
          isSubmitting={isSubmittingImport}
          onImport={() => {
            if (!componentForDetails) return
            performActionForComponent(componentForDetails).then((succeeded) => {
              if (succeeded) {
                setIsDetailsDialogOpen(false)
                onClose()
                resetAllSearches()
                setSearchQuery("")
              }
            })
          }}
        />
      )}
    </Dialog>
  )
}
