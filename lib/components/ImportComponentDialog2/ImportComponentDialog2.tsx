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
import { SearchBar } from "./components/SearchBar"
import { SearchResultsList } from "./components/SearchResultsList"
import { TscircuitPackageDetailsDialog } from "./components/TscircuitPackageDetailsDialog"
import { useTscircuitPackageDetails } from "./hooks/useTscircuitPackageDetails"
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

const computeAvailableSources = ({
  onTscircuitPackageSelected,
  onJlcpcbComponentTsxLoaded,
  onKicadStringSelected,
}: Pick<
  ImportComponentDialog2Props,
  | "onTscircuitPackageSelected"
  | "onJlcpcbComponentTsxLoaded"
  | "onKicadStringSelected"
>): ImportSource[] => {
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
}: ImportComponentDialog2Props) => {
  useStyles()

  const availableSources = React.useMemo(
    () =>
      computeAvailableSources({
        onKicadStringSelected,
        onTscircuitPackageSelected,
        onJlcpcbComponentTsxLoaded,
      }),
    [
      onKicadStringSelected,
      onTscircuitPackageSelected,
      onJlcpcbComponentTsxLoaded,
    ],
  )

  const hasSources = availableSources.length > 0
  const [activeSource, setActiveSource] = React.useState<ImportSource>(
    availableSources[0] ?? "tscircuit.com",
  )

  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedSearchResult, setSelectedSearchResult] =
    React.useState<ImportComponentDialogSearchResult | null>(null)
  const {
    results: tscircuitResults,
    isSearching: isTscircuitSearching,
    error: tscircuitError,
    hasSearched: hasTscircuitSearched,
    search: searchTscircuit,
    reset: resetTscircuitSearch,
  } = useTscircuitPackageSearch()
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
    "pcb" | "schematic"
  >("pcb")
  const [importErrorMessage, setImportErrorMessage] = React.useState<
    string | null
  >(null)
  const [isSubmittingImport, setIsSubmittingImport] = React.useState(false)

  React.useEffect(() => {
    setImportErrorMessage(null)
  }, [selectedSearchResult])

  const resetAllSearches = React.useCallback(() => {
    resetTscircuitSearch()
    resetJlcpcbSearch()
    resetKicadSearch()
    setSelectedSearchResult(null)
  }, [resetJlcpcbSearch, resetKicadSearch, resetTscircuitSearch])

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
    }
  }, [activeSource, resetJlcpcbSearch, resetKicadSearch, resetTscircuitSearch])

  const handleShowDetails = (component: TscircuitPackageSearchResult) => {
    setSelectedSearchResult(component)
    setComponentForDetails(component)
    setDetailsPreviewTab("pcb")
    setIsDetailsDialogOpen(true)
    resetPackageDetails()
    const owner = component.package.owner_github_username
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

    if (activeSource === "tscircuit.com") {
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
      if (result.source === "kicad") {
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
        await onJlcpcbComponentTsxLoaded({ result, tsx })
      } else if (result.source === "tscircuit.com") {
        if (!onTscircuitPackageSelected) {
          throw new Error("tscircuit package handler not provided")
        }
        const owner = result.package.owner_github_username
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

  if (activeSource === "tscircuit.com") {
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
        style={{ width: "calc(100vw - 2rem)" }}
        className="rf-rounded-sm rf-max-h-[90vh] rf-overflow-y-auto rf-flex rf-flex-col"
      >
        <DialogHeader>
          <DialogTitle className="rf-text-lg sm:rf-text-xl">
            Import Component
          </DialogTitle>
          <DialogDescription className="rf-text-sm">
            {hasSources
              ? "Search for components from available sources."
              : "Import options are disabled because no handlers were provided."}
          </DialogDescription>
        </DialogHeader>

        {hasSources ? (
          <Tabs
            value={activeSource}
            onValueChange={(value) => setActiveSource(value as ImportSource)}
          >
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

            <SearchBar
              query={searchQuery}
              placeholder={SOURCE_CONFIG[activeSource].placeholder}
              isSearching={isSearching}
              onQueryChange={setSearchQuery}
              onSubmit={performSearch}
            />

            <div className="rf-mt-4 rf-flex-1 rf-min-h-[200px] !rf-max-h-[40vh] !rf-overflow-y-auto rf-border rf-rounded-md">
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
    </Dialog>
  )
}
