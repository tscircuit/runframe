import * as React from "react"
import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "../ui/alert-dialog"
import { Button } from "../ui/button"
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs"
import { Loader2, Search, ExternalLink } from "lucide-react"
import { Input } from "../ui/input"
import { searchJLCComponents, mapJLCComponentToSearchResult } from "./jlc-api"
import {
  searchTscircuitComponents,
  mapTscircuitSnippetToSearchResult,
} from "./tscircuit-registry-api"

export interface ComponentSearchResult {
  id: string
  name: string
  description?: string
  source: "tscircuit.com" | "jlcpcb"
  partNumber?: string
  // Additional JLC-specific properties
  package?: string
  price?: number
  // Additional tscircuit-specific properties
  code?: string
  owner?: string
}

interface ImportComponentDialogProps {
  isOpen: boolean
  onClose: () => void
  onImport: (component: ComponentSearchResult) => void
}

export const ImportComponentDialog = ({
  isOpen,
  onClose,
  onImport,
}: ImportComponentDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<ComponentSearchResult[]>(
    [],
  )
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedComponent, setSelectedComponent] =
    useState<ComponentSearchResult | null>(null)
  const [activeTab, setActiveTab] = useState<"tscircuit.com" | "jlcpcb">(
    "tscircuit.com",
  )
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsComponent, setDetailsComponent] =
    useState<ComponentSearchResult | null>(null)

  // Search function that calls the appropriate API based on the active tab
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)

    // Determine search type based on query format
    // If query starts with C and followed by numbers, assume it's a JLC part number
    const isJlcPartNumber = /^C\d+/.test(searchQuery)
    if (isJlcPartNumber) {
      setActiveTab("jlcpcb")
    }

    try {
      if (activeTab === "jlcpcb") {
        // Real JLCPCB API call
        const query = isJlcPartNumber ? searchQuery.substring(1) : searchQuery // Remove 'C' prefix if it's a part number
        const jlcComponents = await searchJLCComponents(query, 10)

        // Map JLC components to the format expected by the UI
        const mappedResults = jlcComponents.map(mapJLCComponentToSearchResult)
        setSearchResults(mappedResults)
      } else {
        // Real tscircuit registry API call
        const tscircuitComponents = await searchTscircuitComponents(
          searchQuery,
          10,
        )

        // Map tscircuit components to the format expected by the UI
        const mappedResults = tscircuitComponents.map(
          mapTscircuitSnippetToSearchResult,
        )
        setSearchResults(mappedResults)
      }
    } catch (error) {
      console.error("Error searching components:", error)
      // Show empty results with an error message
      setSearchResults([])
      // Could add error state handling here if needed
    } finally {
      setIsLoading(false)
      setHasSearched(true)
    }
  }

  // Handle search when Enter key is pressed
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  // Reset search when tab changes
  useEffect(() => {
    setSearchResults([])
    setSelectedComponent(null)
  }, [activeTab])

  // Show component details
  const showDetails = (component: ComponentSearchResult) => {
    setDetailsComponent(component)
    setDetailsOpen(true)
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={() => onClose()}>
      <AlertDialogContent className="rf-max-w-3xl rf-w-full rf-max-h-[90vh] rf-overflow-y-auto rf-flex rf-flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Import Component</AlertDialogTitle>
          <AlertDialogDescription>
            Search for components from tscircuit.com or JLCPCB parts library.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "tscircuit.com" | "jlcpcb")
          }
        >
          <TabsList className="rf-grid rf-w-full rf-grid-cols-2">
            <TabsTrigger value="tscircuit.com">tscircuit.com</TabsTrigger>
            <TabsTrigger value="jlcpcb">JLCPCB Parts</TabsTrigger>
          </TabsList>

          <div className="rf-flex rf-items-center rf-gap-2 rf-mt-4">
            <div className="rf-relative rf-flex-grow">
              <Search className="rf-absolute rf-left-2 rf-top-2.5 rf-h-4 rf-w-4 rf-text-muted-foreground" />
              <Input
                placeholder={
                  activeTab === "tscircuit.com"
                    ? "Search components..."
                    : "Search JLCPCB parts (e.g. C14663)..."
                }
                className="rf-pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || searchQuery.trim().length < 1}
            >
              {isLoading ? (
                <Loader2 className="rf-h-4 rf-w-4 rf-animate-spin" />
              ) : (
                "Search"
              )}
            </Button>
          </div>

          <div className="rf-mt-4 rf-flex-1 rf-min-h-[200px] !rf-max-h-[40vh] !rf-overflow-y-auto rf-border rf-rounded-md">
            {searchResults.length > 0 ? (
              <div className="rf-divide-y">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={`rf-p-3 rf-flex rf-items-center rf-justify-between rf-cursor-pointer hover:rf-bg-zinc-100 ${selectedComponent?.id === result.id ? "rf-bg-zinc-100" : ""}`}
                    onClick={() => setSelectedComponent(result)}
                  >
                    <div>
                      <div className="rf-font-medium">{result.name}</div>
                      <div className="rf-text-sm rf-text-zinc-500">
                        {result.partNumber && (
                          <span className="rf-mr-2">{result.partNumber}</span>
                        )}
                        {result.description}
                      </div>
                    </div>
                    <div className="rf-flex rf-gap-2">
                      {result.source === "tscircuit.com" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            showDetails(result)
                          }}
                        >
                          See Details
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : isLoading ? (
              <div className="rf-p-8 rf-text-center rf-text-zinc-500">
                <Loader2 className="rf-h-8 rf-w-8 rf-animate-spin rf-mx-auto rf-mb-2" />
                <p>Searching...</p>
              </div>
            ) : (
              <div className="rf-p-8 rf-text-center rf-text-zinc-500">
                {hasSearched
                  ? "No results found"
                  : "Enter a search term to find components"}
              </div>
            )}
          </div>
        </Tabs>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <Button
            onClick={() => {
              if (selectedComponent) {
                onImport(selectedComponent)
                onClose()
              }
            }}
            disabled={!selectedComponent}
          >
            Import Component
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>

      {/* Component Details Dialog */}
      <AlertDialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <AlertDialogContent className="rf-max-w-4xl rf-max-h-[85vh] rf-overflow-hidden rf-flex rf-flex-col">
          <AlertDialogHeader className="rf-pb-4 rf-border-b">
            <div className="rf-flex rf-items-start rf-justify-between rf-gap-4">
              <div className="rf-flex-1 rf-min-w-0">
                <AlertDialogTitle className="rf-text-xl rf-font-semibold rf-truncate">
                  <a
                    href={`https://tscircuit.com/${detailsComponent?.owner}/${detailsComponent?.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rf-text-black hover:rf-underline"
                  >
                    {detailsComponent?.name?.split("/").pop() ||
                      detailsComponent?.name}
                  </a>
                </AlertDialogTitle>
              </div>
            </div>
          </AlertDialogHeader>

          <div className="rf-flex-1 rf-overflow-y-auto rf-py-4 rf-space-y-6">
            {/* Component Information */}
            <div>
              <div className="rf-space-y-3">
                {detailsComponent?.owner && (
                  <div>
                    <label className="rf-text-xs rf-font-medium rf-text-gray-500 rf-uppercase rf-tracking-wide">
                      Created by
                    </label>
                    <div className="rf-mt-1 rf-text-sm rf-font-medium">
                      <a
                        href={`https://tscircuit.com/${detailsComponent?.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rf-text-black hover:rf-underline"
                      >
                        {detailsComponent?.owner}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section */}
            <div>
              <h3 className="rf-text-lg rf-font-semibold rf-mb-4">Preview</h3>
              <div className="rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50">
                {detailsComponent?.code ? (
                  <div className="rf-aspect-video rf-bg-white rf-flex rf-items-center rf-justify-center">
                    <img
                      src={`https://registry-api.tscircuit.com/packages/images/${detailsComponent.owner}/${detailsComponent.name}/pcb.png`}
                      alt={`${detailsComponent.name} preview`}
                      className="rf-w-full rf-h-full rf-object-cover rf-rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = "none"
                        const parent = target.parentElement
                        if (parent) {
                          parent.innerHTML =
                            '<div class="rf-text-center rf-text-gray-500 rf-py-8"><div class="rf-text-sm">Preview not available</div><div class="rf-text-xs rf-mt-1">Image failed to load</div></div>'
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="rf-aspect-video rf-flex rf-items-center rf-justify-center rf-text-gray-500">
                    <div className="rf-text-center">
                      <div className="rf-text-sm rf-font-medium">
                        No preview available
                      </div>
                      <div className="rf-text-xs rf-mt-1">
                        Preview cannot be generated
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <AlertDialogFooter className="rf-pt-4 rf-border-t rf-flex rf-justify-between rf-items-center">
            <div className="rf-flex-1">
              <Button
                variant="outline"
                size="sm"
                className="rf-gap-2"
                onClick={() => {
                  const url = `https://tscircuit.com/${detailsComponent?.owner}/${detailsComponent?.name.split("/").pop()}`
                  window.open(url, "_blank")
                }}
              >
                <ExternalLink className="rf-h-4 rf-w-4" />
                View on tscircuit.com
              </Button>
            </div>
            <div className="rf-flex rf-gap-2">
              <AlertDialogCancel onClick={() => setDetailsOpen(false)}>
                Close
              </AlertDialogCancel>
              <Button
                onClick={() => {
                  setDetailsOpen(false)
                  if (detailsComponent) {
                    onImport(detailsComponent)
                    onClose()
                  }
                }}
                className="rf-bg-blue-600 hover:rf-bg-blue-700"
              >
                Import Component
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialog>
  )
}
