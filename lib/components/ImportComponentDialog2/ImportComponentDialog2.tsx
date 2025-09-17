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
import { useComponentSearch } from "./hooks/useComponentSearch"
import { useTscircuitPackageDetails } from "./hooks/useTscircuitPackageDetails"
import type {
  ComponentSearchResult,
  ImportComponentDialog2Props,
  ImportSource,
} from "./types"

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
  proxyRequestHeaders,
  onKicadStringSelected,
  onTscircuitPackageSelected,
  onJlcpcbComponentTsxLoaded,
}: ImportComponentDialog2Props) => {
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

  const {
    query: searchQuery,
    setQuery: setSearchQuery,
    results: searchResults,
    selectedResult: selectedSearchResult,
    setSelectedResult: setSelectedSearchResult,
    isLoading: isComponentSearchLoading,
    hasSearched: hasExecutedComponentSearch,
    error: componentSearchError,
    performSearch: runComponentSearch,
    resetResults: resetComponentSearch,
  } = useComponentSearch(activeSource)
  const {
    details: packageDetails,
    isLoading: isPackageDetailsLoading,
    fetchDetails: fetchPackageDetails,
    reset: resetPackageDetails,
  } = useTscircuitPackageDetails()
  const [componentForDetails, setComponentForDetails] =
    React.useState<ComponentSearchResult | null>(null)
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

  React.useEffect(() => {
    if (!isOpen) {
      resetComponentSearch()
      setSearchQuery("")
      setIsDetailsDialogOpen(false)
      setComponentForDetails(null)
      setImportErrorMessage(null)
    }
  }, [isOpen, resetComponentSearch, setSearchQuery])

  const handleShowDetails = React.useCallback(
    (component: ComponentSearchResult) => {
      setSelectedSearchResult(component)
      setComponentForDetails(component)
      setDetailsPreviewTab("pcb")
      setIsDetailsDialogOpen(true)
      resetPackageDetails()
      if (component.owner) {
        const packageName = component.name.split("/").pop() ?? component.name
        fetchPackageDetails(component.owner, packageName)
      }
    },
    [fetchPackageDetails, resetPackageDetails, setSelectedSearchResult],
  )

  const performActionForComponent = React.useCallback(
    async (component: ComponentSearchResult) => {
      try {
        setImportErrorMessage(null)
        setIsSubmittingImport(true)
        if (component.source === "kicad") {
          if (!onKicadStringSelected) {
            throw new Error("KiCad handler not provided")
          }
          await onKicadStringSelected({
            component,
            footprint: component.name,
          })
        } else if (component.source === "jlcpcb") {
          if (!onJlcpcbComponentTsxLoaded) {
            throw new Error("JLCPCB handler not provided")
          }
          if (!component.partNumber) {
            throw new Error("Missing JLCPCB part number")
          }
          const tsx = await loadJlcpcbComponentTsx(component.partNumber, {
            headers: proxyRequestHeaders,
          })
          await onJlcpcbComponentTsxLoaded({ component, tsx })
        } else if (component.source === "tscircuit.com") {
          if (!onTscircuitPackageSelected) {
            throw new Error("tscircuit package handler not provided")
          }
          if (!component.owner) {
            throw new Error("Missing package owner")
          }
          const packageName = component.name.split("/").pop() ?? component.name
          const fullPackageName = `@tsci/${component.owner}.${packageName}`
          await onTscircuitPackageSelected({
            component,
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
    },
    [
      onJlcpcbComponentTsxLoaded,
      onKicadStringSelected,
      onTscircuitPackageSelected,
      proxyRequestHeaders,
    ],
  )

  const handleConfirm = React.useCallback(async () => {
    if (!selectedSearchResult) return
    const succeeded = await performActionForComponent(selectedSearchResult)
    if (succeeded) {
      onClose()
      resetComponentSearch()
      setSearchQuery("")
    }
  }, [
    onClose,
    performActionForComponent,
    resetComponentSearch,
    selectedSearchResult,
    setSearchQuery,
  ])

  const handleDialogClose = React.useCallback(
    (open: boolean) => {
      if (!open) {
        onClose()
      }
    },
    [onClose],
  )

  const handleDetailsClose = React.useCallback(async (open: boolean) => {
    setIsDetailsDialogOpen(open)
    if (!open) {
      setComponentForDetails(null)
    }
  }, [])

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
              isSearching={isComponentSearchLoading}
              onQueryChange={setSearchQuery}
              onSubmit={runComponentSearch}
            />

            <div className="rf-mt-4 rf-flex-1 rf-min-h-[200px] !rf-max-h-[40vh] !rf-overflow-y-auto rf-border rf-rounded-md">
              {isComponentSearchLoading ? (
                <div className="rf-p-8 rf-text-center rf-text-zinc-500">
                  <Loader2 className="rf-h-8 rf-w-8 rf-animate-spin rf-mx-auto rf-mb-2" />
                  <p>Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <SearchResultsList
                  results={searchResults}
                  selectedId={selectedSearchResult?.id ?? null}
                  onSelect={setSelectedSearchResult}
                  onShowDetails={
                    activeSource === "tscircuit.com"
                      ? handleShowDetails
                      : undefined
                  }
                />
              ) : (
                <div className="rf-p-8 rf-text-center rf-text-zinc-500">
                  {componentSearchError
                    ? `Error: ${componentSearchError}`
                    : hasExecutedComponentSearch
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
        component={componentForDetails}
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
              resetComponentSearch()
              setSearchQuery("")
            }
          })
        }}
      />
    </Dialog>
  )
}
