import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "lib/components/ui/tabs"
import { cn } from "lib/utils"
import { CadViewer } from "@tscircuit/3d-viewer"
import { PCBViewer } from "@tscircuit/pcb-viewer"
import { useCallback, useEffect, useState } from "react"
import { ErrorFallback } from "../ErrorFallback"
import { ErrorBoundary } from "react-error-boundary"
import { ErrorTabContent } from "../ErrorTabContent"
import { SchematicViewer } from "@tscircuit/schematic-viewer"
import { AssemblyViewer } from "@tscircuit/assembly-viewer"
import PreviewEmptyState from "../PreviewEmptyState"
import { CircuitJsonTableViewer } from "../CircuitJsonTableViewer/CircuitJsonTableViewer"
import { BomTable } from "../BomTable"
import {
  CheckIcon,
  EllipsisIcon,
  EllipsisVerticalIcon,
  FullscreenIcon,
  Loader2,
  LoaderCircleIcon,
  LoaderIcon,
  MinimizeIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Button } from "../ui/button"
import { PcbViewerWithContainerHeight } from "../PcbViewerWithContainerHeight"
import { useStyles } from "lib/hooks/use-styles"
import type { ManualEditEvent } from "@tscircuit/props"
import type { RenderLog } from "lib/render-logging/RenderLog"
import { RenderLogViewer } from "../RenderLogViewer/RenderLogViewer"
import { capitalizeFirstLetters } from "lib/utils"
import type { PreviewContentProps, TabId } from "./PreviewContentProps"

const dropdownMenuItems = [
  "assembly",
  "bom",
  "circuit_json",
  "errors",
  "render_log",
]

export type { PreviewContentProps, TabId }

export const CircuitJsonPreview = ({
  code,
  onRunClicked = undefined,
  errorMessage,
  circuitJsonKey = "",
  circuitJson,
  showRightHeaderContent = true,
  showCodeTab = false,
  codeTabContent,
  showJsonTab = true,
  showRenderLogTab = true,
  onActiveTabChange,
  renderLog,
  showImportAndFormatButtons = true,
  className,
  headerClassName,
  leftHeaderContent,
  readOnly,
  isStreaming,
  isRunningCode,
  hasCodeChangedSinceLastRun,
  onEditEvent,
  editEvents,
  defaultActiveTab,
  autoRotate3dViewerDisabled,
  showSchematicDebugGrid = false,
}: PreviewContentProps) => {
  useStyles()

  const [activeTab, setActiveTabState] = useState(defaultActiveTab ?? "pcb")
  const [isFullScreen, setIsFullScreen] = useState(false)
  const setActiveTab = useCallback(
    (tab: TabId) => {
      setActiveTabState(tab)
      onActiveTabChange?.(tab)
    },
    [onActiveTabChange],
  )

  const showToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen)
  }

  useEffect(() => {
    if (errorMessage) {
      setActiveTab("errors")
    }
  }, [errorMessage])

  useEffect(() => {
    if (activeTab === "code" && circuitJson && !errorMessage) {
      setActiveTab("pcb")
    }
  }, [circuitJson])

  return (
    <div
      className={cn("flex flex-col relative rf-overflow-x-hidden", className)}
    >
      <div
        className={cn(
          "rf-md:sticky rf-md:top-2",
          isFullScreen && "rf-fixed rf-top-0 rf-left-0 rf-w-full rf-bg-white",
        )}
      >
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab as any}
          className="rf-flex-grow rf-flex rf-flex-col"
        >
          <div
            className={cn(
              "rf-flex rf-items-center rf-gap-2 rf-p-2 rf-pb-0",
              headerClassName,
            )}
          >
            {leftHeaderContent}
            {leftHeaderContent && <div className="rf-flex-grow" />}
            {!leftHeaderContent && isRunningCode && (
              <Loader2 className="rf-w-4 rf-h-4 rf-animate-spin" />
            )}
            {!leftHeaderContent && <div className="rf-flex-grow" />}
            {renderLog && renderLog.progress !== 1 && (
              <div className="rf-flex rf-items-center rf-gap-2">
                {renderLog.lastRenderEvent && (
                  <div className="rf-text-xs rf-text-gray-500">
                    {
                      renderLog.lastRenderEvent?.type
                        .split("renderable:renderLifecycle:")[1]
                        .split(":")[0]
                    }
                  </div>
                )}
                <div className="rf-w-4 rf-h-4 rf-bg-blue-500 rf-opacity-50 rf-rounded-full rf-text-white">
                  <LoaderCircleIcon className="rf-w-4 rf-h-4 rf-animate-spin" />
                </div>
                <div className="rf-text-xs rf-font-bold rf-text-gray-700 rf-tabular-nums">
                  {((renderLog.progress ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
            )}
            {showRightHeaderContent && (
              <TabsList>
                {showCodeTab && <TabsTrigger value="code">Code</TabsTrigger>}
                <TabsTrigger value="pcb" className="rf-whitespace-nowrap">
                  {circuitJson && (
                    <span
                      className={cn(
                        "rf-inline-flex rf-items-center rf-justify-center rf-w-2 rf-h-2 rf-mr-1 rf-text-xs rf-font-bold rf-text-white rf-rounded-full",
                        !hasCodeChangedSinceLastRun
                          ? "rf-bg-blue-500"
                          : "rf-bg-gray-500",
                      )}
                    />
                  )}
                  PCB
                </TabsTrigger>
                <TabsTrigger value="schematic" className="rf-whitespace-nowrap">
                  {circuitJson && (
                    <span
                      className={cn(
                        "rf-inline-flex rf-items-center rf-justify-center rf-w-2 rf-h-2 rf-mr-1 rf-text-xs rf-font-bold rf-text-white rf-rounded-full",
                        !hasCodeChangedSinceLastRun
                          ? "rf-bg-blue-500"
                          : "rf-bg-gray-500",
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
                          ? "rf-bg-blue-500"
                          : "rf-bg-gray-500",
                      )}
                    />
                  )}
                  3D
                </TabsTrigger>
                {!["pcb", "cad", "schematic"].includes(activeTab) && (
                  <TabsTrigger value={activeTab}>
                    {capitalizeFirstLetters(activeTab)}
                  </TabsTrigger>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="rf-whitespace-nowrap rf-p-2 rf-mr-1 rf-cursor-pointer rf-relative">
                      <EllipsisIcon className="rf-w-4 rf-h-4" />
                      {errorMessage && (
                        <span className="rf-inline-flex rf-absolute rf-top-[6px] rf-right-[4px] rf-items-center rf-justify-center rf-w-1 rf-h-1 rf-ml-2 rf-text-[8px] rf-font-bold rf-text-white rf-bg-red-500 rf-rounded-full" />
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rf-*:text-xs">
                    {dropdownMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={item}
                        onSelect={() => setActiveTab(item as TabId)}
                      >
                        <CheckIcon
                          className={cn(
                            "rf-w-3 rf-h-3 rf-mr-2",
                            activeTab !== item && "rf-invisible",
                          )}
                        />
                        <div className="rf-pr-2">
                          {capitalizeFirstLetters(item)}
                        </div>
                        {item === "errors" && errorMessage && (
                          <span className="rf-inline-flex rf-items-center rf-justify-center rf-w-3 rf-h-3 rf-ml-2 rf-text-[8px] rf-font-bold rf-text-white rf-bg-red-500 rf-rounded-full">
                            1
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TabsList>
            )}
            {showToggleFullScreen && (
              <Button onClick={showToggleFullScreen} variant="ghost">
                {isFullScreen ? (
                  <MinimizeIcon size={16} />
                ) : (
                  <FullscreenIcon size={16} />
                )}
              </Button>
            )}
          </div>
          {showCodeTab && (
            <TabsContent
              value="code"
              className="rf-flex-grow rf-overflow-hidden"
            >
              <div className="rf-h-full">{codeTabContent}</div>
            </TabsContent>
          )}
          <TabsContent value="pcb">
            <div
              className={cn(
                "rf-overflow-hidden",
                isFullScreen ? "rf-h-[calc(100vh-96px)]" : "rf-h-[620px]",
              )}
            >
              <ErrorBoundary fallback={<div>Error loading PCB viewer</div>}>
                {circuitJson ? (
                  <PcbViewerWithContainerHeight
                    key={circuitJsonKey}
                    soup={circuitJson}
                    containerClassName={cn(
                      "rf-h-full rf-w-full",
                      isFullScreen
                        ? "rf-min-h-[calc(100vh-240px)]"
                        : "rf-min-h-[620px]",
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
                "rf-overflow-auto",
                isFullScreen ? "rf-h-[calc(100vh-96px)]" : "rf-h-[620px]",
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
                "rf-overflow-auto",
                isFullScreen ? "rf-h-[calc(100vh-96px)]" : "rf-h-[620px]",
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
                    debugGrid={showSchematicDebugGrid}
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
                "rf-overflow-auto",
                isFullScreen ? "rf-h-[calc(100vh-96px)]" : "rf-h-[620px]",
              )}
            >
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                {circuitJson ? (
                  <CadViewer
                    soup={circuitJson as any}
                    autoRotateDisabled={autoRotate3dViewerDisabled}
                  />
                ) : (
                  <PreviewEmptyState onRunClicked={onRunClicked} />
                )}
              </ErrorBoundary>
            </div>
          </TabsContent>

          <TabsContent value="bom">
            <div
              className={cn(
                "rf-overflow-auto",
                isFullScreen ? "rf-h-[calc(100vh-96px)]" : "rf-h-[620px]",
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
          <TabsContent value="circuit_json">
            <div
              className={cn(
                "rf-overflow-auto",
                isFullScreen ? "rf-h-[calc(100vh-96px)]" : "rf-h-[620px]",
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
          <TabsContent value="errors">
            {circuitJson || errorMessage ? (
              <ErrorTabContent code={code} errorMessage={errorMessage} />
            ) : (
              <PreviewEmptyState onRunClicked={onRunClicked} />
            )}
          </TabsContent>
          {showRenderLogTab && (
            <TabsContent value="render_log">
              <RenderLogViewer renderLog={renderLog} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
