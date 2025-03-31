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
import { createSvgUrl as createPngUrl } from "@tscircuit/create-snippet-url"

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
            <Button onClick={handleSearch} disabled={isLoading}>
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
        <AlertDialogContent className="!rf-max-h-[70%] !rf-overflow-y-auto rf-flex rf-flex-col !rf-max-w-[60vw] !rf-overflow-x-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle>{detailsComponent?.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Detailed information about the selected component
            </AlertDialogDescription>
            <div className="rf-text-sm rf-text-muted-foreground">
              {detailsComponent?.partNumber && (
                <div className="rf-font-mono rf-text-sm rf-mb-2">
                  {detailsComponent.partNumber}
                </div>
              )}
              {detailsComponent?.description}
            </div>
          </AlertDialogHeader>

          {/* Component-specific information */}
          {detailsComponent?.source === "jlcpcb" && (
            <div className="rf-my-4 rf-border rf-rounded-md rf-p-4">
              <div className="rf-text-sm rf-font-medium rf-mb-2">
                JLCPCB Details
              </div>
              <div className="rf-grid rf-grid-cols-2 rf-gap-2">
                {detailsComponent.package && (
                  <div className="rf-flex rf-flex-col">
                    <span className="rf-text-xs rf-text-zinc-500">Package</span>
                    <span className="rf-font-medium">
                      {detailsComponent.package}
                    </span>
                  </div>
                )}
                {detailsComponent.price !== undefined && (
                  <div className="rf-flex rf-flex-col">
                    <span className="rf-text-xs rf-text-zinc-500">Price</span>
                    <span className="rf-font-medium">
                      ${(detailsComponent as any).price.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* tscircuit-specific information */}
          {detailsComponent?.source === "tscircuit.com" && (
            <div className="rf-my-4 rf-border rf-rounded-md rf-p-4 !rf-max-w-[60vw] !rf-overflow-x-hidden">
              <div className="rf-text-sm rf-font-medium rf-mb-2">
                tscircuit Details
              </div>
              <div className="rf-grid rf-grid-cols-2 rf-gap-2">
                {(detailsComponent as any).owner && (
                  <div className="rf-flex rf-flex-col">
                    <span className="rf-text-xs rf-text-zinc-500">Owner</span>
                    <span className="rf-font-medium">
                      {(detailsComponent as any).owner}
                    </span>
                  </div>
                )}
              </div>
              {detailsComponent.code && (
                <div className="rf-mt-2">
                  <div className="rf-text-xs rf-text-zinc-500 rf-mb-1">
                    Code Preview
                  </div>
                  <pre className="rf-bg-zinc-50 rf-p-2 rf-rounded rf-text-xs rf-font-mono rf-max-h-32 rf-overflow-y-auto">
                    {detailsComponent.code.substring(0, 500)}
                    {detailsComponent.code.length > 500 && "..."}
                  </pre>
                </div>
              )}
            </div>
          )}

          <div className="rf-my-4 rf-border rf-rounded-md rf-p-4">
            <div className="rf-text-sm rf-font-medium rf-mb-2">Preview</div>
            {detailsComponent?.source === "tscircuit.com" &&
            detailsComponent.code ? (
              <div className="rf-flex rf-justify-center">
                <div className="rf-border rf-rounded rf-p-4 rf-bg-zinc-50">
                  <img
                    src={createPngUrl(detailsComponent.code!, "pcb")}
                    alt={detailsComponent.name}
                    className="rf-w-full rf-aspect-video rf-object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="rf-text-center rf-text-zinc-500 rf-p-4">
                No preview available
              </div>
            )}
          </div>

          <div className="rf-flex rf-justify-between">
            <Button
              variant="outline"
              size="sm"
              className="rf-gap-1"
              onClick={() => {
                const url =
                  detailsComponent?.source === "jlcpcb"
                    ? `https://jlcpcb.com/partdetail/${detailsComponent.partNumber}`
                    : `https://tscircuit.com/${(detailsComponent as any).owner}/${detailsComponent?.name.split("/").pop()}`
                window.open(url, "_blank")
              }}
            >
              View on{" "}
              {detailsComponent?.source === "jlcpcb"
                ? "JLCPCB"
                : "tscircuit.com"}{" "}
              <ExternalLink className="rf-h-3 rf-w-3" />
            </Button>
            <Button
              onClick={() => {
                setDetailsOpen(false)
                if (detailsComponent) {
                  onImport(detailsComponent)
                  onClose()
                }
              }}
            >
              Import Component
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </AlertDialog>
  )
}
