import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "lib/components/ui/tabs"
import { cn } from "lib/utils"
import { applyPcbEditEvents } from "lib/utils/pcbManualEditEventHandler"
import { CadViewer } from "@tscircuit/3d-viewer"
import { PCBViewer } from "@tscircuit/pcb-viewer"
import { useEffect, useState } from "react"
import { ErrorFallback } from "./ErrorFallback"
import { ErrorBoundary } from "react-error-boundary"
import { ErrorTabContent } from "./ErrorTabContent"
import { SchematicViewer } from "@tscircuit/schematic-viewer"
import { AssemblyViewer } from "@tscircuit/assembly-viewer"
import PreviewEmptyState from "./PreviewEmptyState"
import { CircuitJsonTableViewer } from "./CircuitJsonTableViewer/CircuitJsonTableViewer"
import { BomTable } from "./BomTable"
import {
  CheckIcon,
  EllipsisIcon,
  EllipsisVerticalIcon,
  FullscreenIcon,
  MinimizeIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { PcbViewerWithContainerHeight } from "./PcbViewerWithContainerHeight"
import { useStyles } from "lib/hooks/use-styles"
import type { ManualEditEvent } from "@tscircuit/props"

export interface PreviewContentProps {
  code?: string
  readOnly?: boolean
  onRunClicked?: () => void
  tsxRunTriggerCount?: number
  errorMessage?: string | null
  circuitJson: any
  circuitJsonKey?: string
  className?: string
  showCodeTab?: boolean
  codeTabContent?: React.ReactNode
  showJsonTab?: boolean
  showImportAndFormatButtons?: boolean
  headerClassName?: string
  /**
   * An optional left-side header, you can put a save button, a run button, or
   * a title here.
   */
  leftHeaderContent?: React.ReactNode
  isRunningCode?: boolean
  isStreaming?: boolean
  onToggleFullScreen?: () => void
  isFullScreen?: boolean
  // manualEditsFileContent?: string
  hasCodeChangedSinceLastRun?: boolean
  // onManualEditsFileContentChange?: (newmanualEditsFileContent: string) => void

  defaultActiveTab?:
    | "code"
    | "pcb"
    | "schematic"
    | "assembly"
    | "cad"
    | "bom"
    | "circuitjson"
    | "error"

  onEditEvent?: (editEvent: ManualEditEvent) => void
  editEvents?: ManualEditEvent[]
}

export const CircuitJsonPreview = ({
  code,
  onRunClicked = undefined,
  tsxRunTriggerCount,
  errorMessage,
  circuitJsonKey = "",
  circuitJson,
  showCodeTab = false,
  codeTabContent,
  showJsonTab = true,
  showImportAndFormatButtons = true,
  className,
  headerClassName,
  leftHeaderContent,
  readOnly,
  isStreaming,
  onToggleFullScreen,
  isFullScreen,
  isRunningCode,
  hasCodeChangedSinceLastRun,
  onEditEvent,
  editEvents,
  defaultActiveTab,
}: PreviewContentProps) => {
  useStyles()
  const [activeTab, setActiveTab] = useState(defaultActiveTab ?? "pcb")

  useEffect(() => {
    if (errorMessage) {
      setActiveTab("error")
    }
  }, [errorMessage])

  useEffect(() => {
    if (activeTab === "code" && circuitJson && !errorMessage) {
      setActiveTab("pcb")
    }
  }, [circuitJson])

  return (
    <div className={cn("flex flex-col relative", className)}>
      <div className="md:sticky md:top-2">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab as any}
          className="flex-grow flex flex-col p-2"
        >
          <div className={cn("flex items-center gap-2", headerClassName)}>
            {leftHeaderContent}
            {leftHeaderContent && <div className="flex-grow" />}
            {/* <RunButton
              onClick={() => triggerRunTsx()}
              disabled={!hasCodeChangedSinceLastRun && tsxRunTriggerCount !== 0}
              isRunningCode={isRunningCode}
            /> */}
            {!leftHeaderContent && <div className="flex-grow" />}
            <TabsList>
              {showCodeTab && <TabsTrigger value="code">Code</TabsTrigger>}
              <TabsTrigger value="pcb" className="whitespace-nowrap">
                {circuitJson && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-2 h-2 mr-1 text-xs font-bold text-white rounded-full",
                      !hasCodeChangedSinceLastRun
                        ? "bg-blue-500"
                        : "bg-gray-500",
                    )}
                  />
                )}
                PCB
              </TabsTrigger>
              <TabsTrigger value="schematic" className="whitespace-nowrap">
                {circuitJson && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-2 h-2 mr-1 text-xs font-bold text-white rounded-full",
                      !hasCodeChangedSinceLastRun
                        ? "bg-blue-500"
                        : "bg-gray-500",
                    )}
                  />
                )}
                Schematic
              </TabsTrigger>
              <TabsTrigger value="cad">
                {circuitJson && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-2 h-2 mr-1 text-xs font-bold text-white rounded-full",
                      !hasCodeChangedSinceLastRun
                        ? "bg-blue-500"
                        : "bg-gray-500",
                    )}
                  />
                )}
                3D
              </TabsTrigger>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="whitespace-nowrap p-2 mr-1 cursor-pointer relative">
                    <EllipsisIcon className="w-4 h-4" />
                    {errorMessage && (
                      <span className="inline-flex absolute top-[6px] right-[4px] items-center justify-center w-1 h-1 ml-2 text-[8px] font-bold text-white bg-red-500 rounded-full" />
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="*:text-xs">
                  <DropdownMenuItem onSelect={() => setActiveTab("assembly")}>
                    <CheckIcon
                      className={cn(
                        "w-3 h-3 mr-2",
                        activeTab !== "assembly" && "invisible",
                      )}
                    />
                    Assembly
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setActiveTab("error")}
                    className="flex"
                  >
                    <CheckIcon
                      className={cn(
                        "w-3 h-3 mr-2",
                        activeTab !== "error" && "invisible",
                      )}
                    />
                    <div className="flex-grow">Errors</div>
                    {errorMessage && (
                      <span className="inline-flex items-center justify-center w-3 h-3 ml-2 text-[8px] font-bold text-white bg-red-500 rounded-full">
                        1
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setActiveTab("bom")}>
                    <CheckIcon
                      className={cn(
                        "w-3 h-3 mr-2",
                        activeTab !== "bom" && "invisible",
                      )}
                    />
                    Bill of Materials
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setActiveTab("circuitjson")}
                  >
                    <CheckIcon
                      className={cn(
                        "w-3 h-3 mr-2",
                        activeTab !== "circuitjson" && "invisible",
                      )}
                    />
                    JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TabsList>
            {onToggleFullScreen && (
              <Button onClick={onToggleFullScreen} variant="ghost">
                {isFullScreen ? (
                  <MinimizeIcon size={16} />
                ) : (
                  <FullscreenIcon size={16} />
                )}
              </Button>
            )}
          </div>
          {showCodeTab && (
            <TabsContent value="code" className="flex-grow overflow-hidden">
              <div className="h-full">{codeTabContent}</div>
            </TabsContent>
          )}

          <TabsContent value="pcb">
            <div
              className={cn(
                "overflow-hidden",
                isFullScreen ? "h-[calc(100vh-96px)]" : "h-[620px]",
              )}
            >
              <ErrorBoundary fallback={<div>Error loading PCB viewer</div>}>
                {circuitJson ? (
                  <PcbViewerWithContainerHeight
                    key={circuitJsonKey}
                    soup={circuitJson}
                    containerClassName={cn(
                      "h-full w-full",
                      isFullScreen
                        ? "min-h-[calc(100vh-240px)]"
                        : "min-h-[620px]",
                    )}
                    // onEditEventsChanged={(editEvents) => {
                    //   if (editEvents.some((editEvent) => editEvent.in_progress))
                    //     return
                    //   // Update state with new edit events
                    //   const newManualEditsFileContent = applyPcbEditEvents({
                    //     editEvents,
                    //     circuitJson,
                    //     manualEditsFileContent,
                    //   })
                    //   onManualEditsFileContentChange?.(
                    //     JSON.stringify(newManualEditsFileContent, null, 2),
                    //   )
                    // }}
                  />
                ) : (
                  <PreviewEmptyState onRunClicked={onRunClicked} />
                )}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="assembly">
            <div
              className={cn(
                "overflow-auto",
                isFullScreen ? "h-[calc(100vh-96px)]" : "h-[620px]",
              )}
            >
              <ErrorBoundary fallback={<div>Error loading Assembly</div>}>
                {circuitJson ? (
                  <AssemblyViewer
                    circuitJson={circuitJson}
                    containerStyle={{
                      height: "100%",
                    }}
                    editingEnabled
                    debugGrid
                  />
                ) : (
                  <PreviewEmptyState onRunClicked={onRunClicked} />
                )}
              </ErrorBoundary>
            </div>
          </TabsContent>
          <TabsContent value="schematic">
            <div
              className={cn(
                "overflow-auto",
                isFullScreen ? "h-[calc(100vh-96px)]" : "h-[620px]",
              )}
            >
              <ErrorBoundary fallback={<div>Error loading Schematic</div>}>
                {circuitJson ? (
                  <SchematicViewer
                    circuitJson={circuitJson}
                    containerStyle={{
                      height: "100%",
                    }}
                    editingEnabled
                    onEditEvent={(ee) => onEditEvent?.(ee)}
                    editEvents={editEvents}
                    debugGrid
                  />
                ) : (
                  <PreviewEmptyState onRunClicked={onRunClicked} />
                )}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="cad">
            <div
              className={cn(
                "overflow-auto",
                isFullScreen ? "h-[calc(100vh-96px)]" : "h-[620px]",
              )}
            >
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                {circuitJson ? (
                  <CadViewer soup={circuitJson as any} />
                ) : (
                  <PreviewEmptyState onRunClicked={onRunClicked} />
                )}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="bom">
            <div
              className={cn(
                "overflow-auto",
                isFullScreen ? "h-[calc(100vh-96px)]" : "h-[620px]",
              )}
            >
              <ErrorBoundary fallback={<div>Error loading BOM</div>}>
                {circuitJson ? (
                  <BomTable circuitJson={circuitJson} />
                ) : (
                  <PreviewEmptyState onRunClicked={onRunClicked} />
                )}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="circuitjson">
            <div
              className={cn(
                "overflow-auto",
                isFullScreen ? "h-[calc(100vh-96px)]" : "h-[620px]",
              )}
            >
              <ErrorBoundary fallback={<div>Error loading JSON viewer</div>}>
                {circuitJson ? (
                  <CircuitJsonTableViewer elements={circuitJson as any} />
                ) : (
                  <PreviewEmptyState onRunClicked={onRunClicked} />
                )}
              </ErrorBoundary>
            </div>
          </TabsContent>
          <TabsContent value="error">
            {circuitJson || errorMessage ? (
              <ErrorTabContent code={code} errorMessage={errorMessage} />
            ) : (
              <PreviewEmptyState onRunClicked={onRunClicked} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
