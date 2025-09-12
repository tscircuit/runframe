import * as React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog"
import { Button } from "../ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs"
import { Loader2, Search, ExternalLink } from "lucide-react"
import { Input } from "../ui/input"
import { searchJLCComponents, mapJLCComponentToSearchResult } from "./jlc-api"
import {
  searchTscircuitComponents,
  mapTscircuitSnippetToSearchResult,
} from "./tscircuit-registry-api"
import {
  searchKicadFootprints,
  mapKicadFootprintToSearchResult,
} from "./kicad-api"
import { CircuitJsonPreview } from "../CircuitJsonPreview/CircuitJsonPreview"
import { useRunFrameStore } from "../RunFrameWithApi/store"
import { importComponentFromJlcpcb } from "lib/optional-features/importing/import-component-from-jlcpcb"
import { toast } from "lib/utils/toast"

export interface ComponentSearchResult {
  id: string
  name: string
  description?: string
  source: "tscircuit.com" | "jlcpcb" | "kicad"
  partNumber?: string
  // Additional JLC-specific properties
  package?: string
  price?: number
  // Additional tscircuit-specific properties
  code?: string
  owner?: string
  circuitJson?: import("circuit-json").CircuitJson
}

interface TscircuitPackageDetails {
  ai_description?: string
  ai_usage_instructions?: string
  [key: string]: any
}

interface ImportComponentDialogProps {
  isOpen: boolean
  onClose: () => void
  proxyRequestHeaders?: Record<string, string>
  onImport?: (component: ComponentSearchResult) => void
}

export const ImportComponentDialog = ({
  isOpen,
  onClose,
  proxyRequestHeaders,
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
  const [activeTab, setActiveTab] = useState<"tscircuit.com" | "jlcpcb" | "kicad">(
    "tscircuit.com",
  )
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsComponent, setDetailsComponent] =
    useState<ComponentSearchResult | null>(null)
  const [packageDetails, setPackageDetails] =
    useState<TscircuitPackageDetails | null>(null)
  const [packageDetailsLoading, setPackageDetailsLoading] = useState(false)
  const [previewActiveTab, setPreviewActiveTab] = useState<"pcb" | "schematic">(
    "pcb",
  )

  const pushEvent = useRunFrameStore((s) => s.pushEvent)

  const handleImport = onImport
    ? (component: ComponentSearchResult) => onImport(component)
    : async (component: ComponentSearchResult) => {
        if (component.source === "kicad") {
          try {
            const footprintString = `footprint="/${component.name}"`
            await navigator.clipboard.writeText(footprintString)
            toast({
              title: "Footprint copied to clipboard",
              description: `Use: ${footprintString}`,
            })
          } catch (error) {
            console.error("Failed to copy footprint:", error)
            toast({
              title: "Failed to copy footprint",
              description: "Please copy manually: footprint=\"/Resistor_SMD:R_0402_1005Metric\"",
              variant: "destructive",
            })
          }
          return
        }

        toast.promise(
          async () => {
            if (component.source === "tscircuit.com") {
              await pushEvent({
                event_type: "INSTALL_PACKAGE",
                full_package_name: `@tsci/${component.owner}.${component.name}`,
              })

              // TODO wait on event indicating the package was successfully installed
              throw new Error("Not implemented")
            } else if (component.source === "jlcpcb") {
              const { filePath } = await importComponentFromJlcpcb(
                component.partNumber!,
                { headers: proxyRequestHeaders },
              )

              return { filePath }
            }
          },
          {
            loading: `Importing component: "${component.name}"`,
            error: (error: Error) => {
              console.error("IMPORT ERROR", error)
              return `Error importing component: "${component.name}": ${error.toString()}`
            },
            success: (data: any) =>
              data?.filePath
                ? `Imported to "${data.filePath}"`
                : "Import Successful",
          },
        )
      }

  // Fetch package details with AI description
  const fetchPackageDetails = async (owner: string, name: string) => {
    setPackageDetailsLoading(true)
    try {
      const response = await fetch(
        `https://registry-api.tscircuit.com/packages/get?name=${encodeURIComponent(`${owner}/${name}`)}`,
      )
      if (response.ok) {
        const data = await response.json()
        setPackageDetails(data.package || null)
      }
    } catch (error) {
      console.error("Error fetching package details:", error)
      setPackageDetails(null)
    } finally {
      setPackageDetailsLoading(false)
    }
  }

  // Search function that calls the appropriate API based on the active tab
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsLoading(true)

    try {
      if (activeTab === "kicad") {
        const kicadResults = await searchKicadFootprints(searchQuery, 20)
        // Map to ComponentSearchResult but keep circuitJson for previews
        const mappedResults = kicadResults.map(footprint => ({
          ...mapKicadFootprintToSearchResult(footprint),
          circuitJson: footprint.circuitJson,
          source: "kicad" as const,
        }))
        setSearchResults(mappedResults)
      } else if (activeTab === "jlcpcb") {
        // Determine search type based on query format
        // If query starts with C and followed by numbers, assume it's a JLC part number
        const isJlcPartNumber = /^C\d+/.test(searchQuery)

        // Real JLCPCB API call
        const query = isJlcPartNumber ? searchQuery.substring(1) : searchQuery // Remove 'C' prefix if it's a part number
        const jlcComponents = await searchJLCComponents(query, 10)

        // Map JLC components to the format expected by the UI
        const mappedResults = jlcComponents.map(mapJLCComponentToSearchResult)
        setSearchResults(mappedResults)
      } else {
        // Real tscircuit registry API call
        const tscircuitComponents = await searchTscircuitComponents(searchQuery)

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
    setPackageDetails(null)
    setPreviewActiveTab("pcb")

    // Fetch package details if it's a tscircuit component
    if (component.source === "tscircuit.com" && component.owner) {
      const packageName = component.name.split("/").pop() || component.name
      fetchPackageDetails(component.owner, packageName)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent
        style={{
          width: "calc(100vw - 2rem)",
        }}
        className="rf-rounded-sm rf-max-h-[90vh] rf-overflow-y-auto rf-flex rf-flex-col"
      >
        <DialogHeader>
          <DialogTitle className="rf-text-lg sm:rf-text-xl">
            Import Component
          </DialogTitle>
          <DialogDescription className="rf-text-sm">
            Search for components from tscircuit.com, JLCPCB parts library, or KiCad footprints.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "tscircuit.com" | "jlcpcb" | "kicad")
          }
        >
          <TabsList className="rf-grid rf-w-full rf-grid-cols-3 rf-h-auto">
            <TabsTrigger
              value="tscircuit.com"
              className="rf-text-xs sm:rf-text-sm"
            >
              tscircuit.com
            </TabsTrigger>
            <TabsTrigger value="jlcpcb" className="rf-text-xs sm:rf-text-sm">
              JLCPCB Parts
            </TabsTrigger>
            <TabsTrigger value="kicad" className="rf-text-xs sm:rf-text-sm">
              KiCad
            </TabsTrigger>
          </TabsList>

          <div className="rf-flex rf-items-center rf-gap-2 rf-mt-4">
            <div className="rf-relative rf-flex-grow">
              <Search className="rf-absolute rf-left-2 rf-top-2.5 rf-h-4 rf-w-4 rf-text-muted-foreground" />
              <Input
                placeholder={
                  activeTab === "kicad"
                    ? "Search KiCad footprints (e.g. resistor, led)..."
                    : activeTab === "tscircuit.com"
                    ? "Search components..."
                    : "Search JLCPCB parts (e.g. C14663)..."
                }
                className="rf-pl-8"
                spellCheck={false}
                autoComplete="off"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || searchQuery.trim().length < 1}
              className="sm:rf-px-4 rf-px-3"
            >
              {isLoading ? (
                <Loader2 className="rf-h-4 rf-w-4 rf-animate-spin" />
              ) : (
                <>
                  <Search className="rf-h-4 rf-w-4 sm:rf-hidden" />
                  <span className="rf-hidden sm:rf-inline">Search</span>
                </>
              )}
            </Button>
          </div>

          <div className="rf-mt-4 rf-flex-1 rf-min-h-[200px] !rf-max-h-[40vh] !rf-overflow-y-auto rf-border rf-rounded-md">
            {searchResults.length > 0 ? (
              <div className="rf-divide-y">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className={`rf-p-3 rf-flex rf-flex-col sm:rf-flex-row rf-items-start sm:rf-items-center rf-justify-between rf-cursor-pointer hover:rf-bg-zinc-100 rf-gap-2 ${selectedComponent?.id === result.id ? "rf-bg-zinc-100" : ""}`}
                    onClick={() => setSelectedComponent(result)}
                  >
                    <div className="rf-flex-1 rf-min-w-0">
                      <div className="rf-font-medium rf-text-sm rf-truncate">
                        {result.name}
                      </div>
                      <div className="rf-text-xs rf-text-zinc-500 rf-break-words">
                        {result.partNumber && (
                          <span className="rf-mr-2">{result.partNumber}</span>
                        )}
                        {result.description}
                      </div>
                    </div>
                    <div className="rf-flex rf-gap-2 rf-flex-shrink-0 rf-w-full sm:rf-w-auto">
                      {result.source === "tscircuit.com" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rf-text-xs rf-w-full sm:rf-w-auto"
                          onClick={(e) => {
                            e.stopPropagation()
                            showDetails(result)
                          }}
                        >
                          See Details
                        </Button>
                      )}
                      {result.source === "kicad" && result.circuitJson && (
                        <div className="rf-w-16 rf-h-12 rf-border rf-rounded rf-overflow-hidden">
                          <CircuitJsonPreview
                            circuitJson={result.circuitJson}
                            className="rf-w-full rf-h-full"
                            availableTabs={["pcb"]}
                            defaultActiveTab="pcb"
                            showFileMenu={false}
                            showRightHeaderContent={false}
                            showImportAndFormatButtons={false}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : isLoading ? (
              <div className="rf-p-8 rf-text-center rf-text-zinc-500">
                <Loader2 className="rf-h-8 rf-w-8 rf-animate-spin rf-mx-auto rf-mb-2" />
                <p>Searching {activeTab === "kicad" ? "KiCad footprints..." : "..."}</p>
              </div>
            ) : (
              <div className="rf-p-8 rf-text-center rf-text-zinc-500">
                {hasSearched
                  ? "No results found"
                  : activeTab === "kicad"
                  ? "Enter a search term to find KiCad footprints"
                  : "Enter a search term to find components"}
              </div>
            )}
          </div>
        </Tabs>

        <DialogFooter className="rf-flex rf-flex-col sm:rf-flex-row rf-gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rf-order-2 sm:rf-order-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (selectedComponent) {
                handleImport(selectedComponent)
                onClose()
              }
            }}
            disabled={!selectedComponent}
          >
            {selectedComponent?.source === "kicad" ? "Copy Footprint" : "Import Component"}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Component Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent
          showOverlay={false}
          style={{
            width: "calc(100vw - 2rem)",
          }}
          className="rf-max-w-5xl !rf-overflow-y-auto rf-max-h-[90vh] rf-overflow-hidden rf-flex rf-flex-col rf-rounded-sm"
        >
          <DialogHeader className="rf-pb-4 rf-border-b">
            <div className="rf-flex rf-items-start rf-justify-between rf-gap-4">
              <div className="rf-flex-1 rf-min-w-0">
                <DialogTitle className="rf-text-xl rf-font-semibold rf-truncate">
                  {detailsComponent?.source === "kicad" ? (
                    detailsComponent?.name
                  ) : (
                    <a
                      href={`https://tscircuit.com/${detailsComponent?.owner}/${detailsComponent?.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rf-text-black hover:rf-underline"
                    >
                      {detailsComponent?.name?.split("/").pop() ||
                        detailsComponent?.name}
                    </a>
                  )}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="rf-flex-1 rf-overflow-y-auto rf-py-4 rf-space-y-6">
            {/* Component Information */}
            <div>
              <div className="rf-space-y-3">
                {detailsComponent?.source === "kicad" ? (
                  <div>
                    <label className="rf-text-xs rf-font-medium rf-text-gray-500 rf-uppercase rf-tracking-wide">
                      Source
                    </label>
                    <div className="rf-mt-1 rf-text-sm rf-font-medium rf-text-blue-600">
                      KiCad Footprint Library
                    </div>
                  </div>
                ) : detailsComponent?.owner ? (
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
                ) : null}
              </div>
            </div>

            {/* Preview Section with Tabs */}
            <div>
              <h3 className="rf-text-lg rf-font-semibold rf-mb-4">Preview</h3>

              <Tabs
                value={previewActiveTab}
                onValueChange={(value) =>
                  setPreviewActiveTab(value as "pcb" | "schematic")
                }
              >
                <TabsList className="rf-inline-flex rf-h-9 rf-items-center rf-justify-center rf-rounded-lg rf-bg-zinc-100 rf-p-1 rf-text-zinc-500 dark:rf-bg-zinc-800 dark:rf-text-zinc-400">
                  <TabsTrigger
                    value="pcb"
                    className="rf-inline-flex rf-items-center rf-justify-center rf-whitespace-nowrap rf-rounded-md rf-px-3 rf-py-1 rf-text-sm rf-font-medium rf-ring-offset-white rf-transition-all focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-zinc-950 focus-visible:rf-ring-offset-2 disabled:rf-pointer-events-none disabled:rf-opacity-50 data-[state=active]:rf-bg-white data-[state=active]:rf-text-zinc-950 data-[state=active]:rf-shadow dark:rf-ring-offset-zinc-950 dark:focus-visible:rf-ring-zinc-300 dark:data-[state=active]:rf-bg-zinc-950 dark:data-[state=active]:rf-text-zinc-50"
                  >
                    PCB
                  </TabsTrigger>
                  <TabsTrigger
                    value="schematic"
                    className="rf-inline-flex rf-items-center rf-justify-center rf-whitespace-nowrap rf-rounded-md rf-px-3 rf-py-1 rf-text-sm rf-font-medium rf-ring-offset-white rf-transition-all focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-zinc-950 focus-visible:rf-ring-offset-2 disabled:rf-pointer-events-none disabled:rf-opacity-50 data-[state=active]:rf-bg-white data-[state=active]:rf-text-zinc-950 data-[state=active]:rf-shadow dark:rf-ring-offset-zinc-950 dark:focus-visible:rf-ring-zinc-300 dark:data-[state=active]:rf-bg-zinc-950 dark:data-[state=active]:rf-text-zinc-50"
                  >
                    Schematic
                  </TabsTrigger>
                </TabsList>

                <div className="rf-mt-4">
                  <TabsContent
                    value="pcb"
                    className="rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50"
                  >
                    {detailsComponent?.source === "kicad" && detailsComponent.circuitJson ? (
                      <div className="rf-w-full rf-h-[400px] rf-bg-white">
                        <CircuitJsonPreview
                          circuitJson={detailsComponent.circuitJson}
                          availableTabs={["pcb"]}
                          defaultActiveTab="pcb"
                          showFileMenu={false}
                          showRightHeaderContent={false}
                          showImportAndFormatButtons={false}
                        />
                      </div>
                    ) : detailsComponent?.owner && detailsComponent?.name ? (
                      <div className="rf-w-full rf-h-fit rf-min-h-[300px] rf-bg-white rf-flex rf-items-center rf-justify-center rf-p-4">
                        <img
                          src={`https://registry-api.tscircuit.com/packages/images/${detailsComponent.owner}/${detailsComponent.name}/pcb.png`}
                          alt={`${detailsComponent.name} PCB preview`}
                          className="rf-max-w-full rf-max-h-full rf-object-contain rf-rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML =
                                '<div class="rf-text-center rf-text-gray-500"><div class="rf-text-sm rf-font-medium">PCB preview not available</div><div class="rf-text-xs rf-mt-1">Preview cannot be generated</div></div>'
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="rf-h-[400px] rf-flex rf-items-center rf-justify-center rf-text-gray-500">
                        <div className="rf-text-center">
                          <div className="rf-text-sm rf-font-medium">
                            No PCB preview available
                          </div>
                          <div className="rf-text-xs rf-mt-1">
                            Preview cannot be generated
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent
                    value="schematic"
                    className="rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50"
                  >
                    {detailsComponent?.source === "kicad" ? (
                      <div className="rf-h-[400px] rf-flex rf-items-center rf-justify-center rf-text-gray-500">
                        <div className="rf-text-center">
                          <div className="rf-text-sm rf-font-medium">
                            Schematic preview not available for KiCad footprints
                          </div>
                          <div className="rf-text-xs rf-mt-1">
                            Only PCB view is supported
                          </div>
                        </div>
                      </div>
                    ) : detailsComponent?.owner && detailsComponent?.name ? (
                      <div className="rf-w-full rf-h-fit rf-min-h-[300px] rf-bg-white rf-flex rf-items-center rf-justify-center rf-p-4">
                        <img
                          src={`https://registry-api.tscircuit.com/packages/images/${detailsComponent.owner}/${detailsComponent.name}/schematic.png`}
                          alt={`${detailsComponent.name} schematic preview`}
                          className="rf-max-w-full rf-max-h-full rf-object-contain rf-rounded"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = "none"
                            const parent = target.parentElement
                            if (parent) {
                              parent.innerHTML =
                                '<div class="rf-text-center rf-text-gray-500"><div class="rf-text-sm rf-font-medium">Schematic preview not available</div><div class="rf-text-xs rf-mt-1">Preview cannot be generated</div></div>'
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="rf-h-[400px] rf-flex rf-items-center rf-justify-center rf-text-gray-500">
                        <div className="rf-text-center">
                          <div className="rf-text-sm rf-font-medium">
                            No schematic preview available
                          </div>
                          <div className="rf-text-xs rf-mt-1">
                            Preview cannot be generated
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </div>
              </Tabs>
            </div>

            {/* AI Description Section */}
            {packageDetails?.ai_description && (
              <div>
                <h3 className="rf-text-lg rf-font-semibold rf-mb-3">
                  AI Description
                </h3>
                <div className="rf-bg-gray-50 rf-border rf-border-gray-200 rf-rounded-lg rf-p-4">
                  <p className="rf-text-sm rf-text-gray-700 rf-leading-relaxed">
                    {packageDetails.ai_description}
                  </p>
                </div>
              </div>
            )}

            {/* Usage Instructions Section */}
            {packageDetails?.ai_usage_instructions && (
              <div>
                <h3 className="rf-text-lg rf-font-semibold rf-mb-3">
                  Usage Instructions
                </h3>
                <div className="rf-bg-gray-50 rf-border rf-border-gray-200 rf-rounded-lg rf-p-4">
                  <p className="rf-text-sm rf-text-gray-700 rf-leading-relaxed rf-whitespace-pre-wrap">
                    {packageDetails.ai_usage_instructions}
                  </p>
                </div>
              </div>
            )}

            {/* Loading state for package details */}
            {packageDetailsLoading && (
              <div className="rf-flex rf-justify-center rf-text-center rf-items-center rf-gap-2 rf-text-gray-500">
                <Loader2 className="rf-h-4 rf-w-4 rf-animate-spin" />
                <span className="rf-text-sm">Loading package details...</span>
              </div>
            )}
          </div>

          <DialogFooter className="rf-pt-4 rf-border-t rf-flex rf-flex-col sm:rf-flex-row rf-justify-between rf-items-stretch sm:rf-items-center rf-gap-2">
            <div className="rf-flex-1 rf-order-3 sm:rf-order-1">
              {detailsComponent?.source === "kicad" ? null : (
                <Button
                  variant="outline"
                  size="sm"
                  className="rf-gap-2 rf-w-full sm:rf-w-auto"
                  onClick={() => {
                    const url = `https://tscircuit.com/${detailsComponent?.owner}/${detailsComponent?.name.split("/").pop()}`
                    window.open(url, "_blank")
                  }}
                >
                  <ExternalLink className="rf-h-4 rf-w-4" />
                  View on tscircuit.com
                </Button>
              )}
            </div>
            <div className="rf-flex rf-flex-col sm:rf-flex-row rf-gap-2 sm:rf-gap-3 rf-order-1 sm:rf-order-2">
              <Button
                variant="outline"
                onClick={() => setDetailsOpen(false)}
                className="rf-order-2 sm:rf-order-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setDetailsOpen(false)
                  if (detailsComponent) {
                    handleImport(detailsComponent)
                    onClose()
                  }
                }}
                className="rf-bg-blue-600 hover:rf-bg-blue-700 rf-order-1 sm:rf-order-2"
              >
                {detailsComponent?.source === "kicad" ? "Copy Footprint" : "Import Component"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
