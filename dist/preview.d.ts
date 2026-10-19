import * as react from 'react';
import react__default, { ComponentProps, FC } from 'react';
import { PlatformConfig, ManualEditEvent } from '@tscircuit/props';
import { CircuitJson, AnyCircuitElement } from 'circuit-json';
import { SimpleRouteJson } from '@tscircuit/core';
import { Object3D } from 'three';
import { PCBViewer } from '@tscircuit/pcb-viewer';
export { PCBViewer as PcbViewer, PcbViewerController, usePcbViewerController } from '@tscircuit/pcb-viewer';
export { CadViewer } from '@tscircuit/3d-viewer';
export { SchematicViewer, ViewPcbComponentEvent, useSchematicViewerController } from '@tscircuit/schematic-viewer';

type RenderEvent = {
    type: `renderable:renderLifecycle:${string}:start` | `renderable:renderLifecycle:${string}:end` | `board:renderPhaseStarted`;
    /**
     * Corresponds to the element that was rendered
     */
    renderId: string;
    eventsProcessed: number;
    createdAt: number;
    phase?: string;
};
interface RenderLog {
    lastRenderEvent?: RenderEvent;
    eventsProcessed?: number;
    progress?: number;
    renderEvents?: RenderEvent[];
    phaseTimings?: Record<string, number>;
    debugOutputs?: Array<{
        type: string;
        name: string;
        content: unknown;
    }>;
}

/** Optional metadata emitted by newer core versions; older runs still work. */
interface AutoroutingPhaseMetadata {
    subcircuit_id?: string | null;
    componentDisplayName?: string;
    phaseName?: string;
    routingPhaseIndex?: number | null;
    phaseOrdinal?: number;
    phaseCount?: number;
    phaseStageIndex?: number;
    phaseStageCount?: number;
    connectionCount?: number;
    obstacleCount?: number;
    previousTraceCount?: number;
    isReroutePhase?: boolean;
    autorouterName?: string;
    autorouterVersion?: string;
    solverName?: string;
    effort?: number;
    cacheStatus?: "disabled" | "hit" | "miss";
}
interface AutoroutingPhaseEvent extends AutoroutingPhaseMetadata {
    type: "autorouting:start" | "autorouting:end" | "autorouting:error";
    simpleRouteJson?: SimpleRouteJson;
    error?: {
        message: string;
        stack?: string;
    };
}
interface AutoroutingPhase extends AutoroutingPhaseMetadata {
    id: string;
    status: "running" | "complete" | "error";
    startSimpleRouteJson?: SimpleRouteJson;
    endSimpleRouteJson?: SimpleRouteJson;
    errorSimpleRouteJson?: SimpleRouteJson;
    error?: {
        message: string;
        stack?: string;
    };
}

interface SolverStartedEvent {
    type: "solver:started";
    solverName: string;
    solverParams: unknown;
    /** Exact constructor tuple emitted by newer versions of @tscircuit/core. */
    solverConstructorArgs?: readonly unknown[];
    componentName: string;
}
type TabId = "code" | "pcb" | "schematic" | "assembly" | "pinout" | "cad" | "analog_simulation" | "bom" | "circuit_json" | "errors" | "render_log" | "solvers" | "autorouting";
interface PreviewContentProps {
    /** Shared circuit platform hooks used by preview viewers. */
    platformConfig?: PlatformConfig;
    defaultToFullScreen?: boolean;
    code?: string;
    fsMap?: Map<string, string> | Record<string, string>;
    readOnly?: boolean;
    onRunClicked?: () => void;
    tsxRunTriggerCount?: number;
    errorMessage?: string | null;
    errorStack?: string | null;
    autoroutingGraphics?: any;
    circuitJson: CircuitJson | null;
    className?: string;
    schematicSvgOptions?: {
        css?: string;
        className?: string;
    };
    /**
     * Hide the schematic in the analog simulation view and show only the graph.
     * Defaults to false.
     */
    hideSchematicInAnalogSimulation?: boolean;
    showCodeTab?: boolean;
    showRenderLogTab?: boolean;
    codeTabContent?: React.ReactNode;
    showJsonTab?: boolean;
    showToggleFullScreen?: boolean;
    showImportAndFormatButtons?: boolean;
    headerClassName?: string;
    /**
     * A record of component name to autorouting information
     */
    autoroutingLog?: Record<string, {
        simpleRouteJson: any;
    }>;
    /**
     * An optional left-side header, you can put a save button, a run button, or
     * a title here.
     */
    leftHeaderContent?: React.ReactNode;
    /**
     * Default header content, shown on the right side of the header with the PCB,
     * schematic, and CAD tabs.
     */
    showRightHeaderContent?: boolean;
    isRunningCode?: boolean;
    isStreaming?: boolean;
    hasCodeChangedSinceLastRun?: boolean;
    defaultActiveTab?: TabId;
    /**
     * Alias for defaultActiveTab
     */
    defaultTab?: TabId;
    /**
     * Tabs to display. Defaults to all
     */
    availableTabs?: TabId[];
    renderLog?: RenderLog | null;
    /**
     * Name of the currently running async effect from @tscircuit/core, if any
     */
    activeEffectName?: string;
    onEditEvent?: (editEvent: ManualEditEvent) => void;
    editEvents?: ManualEditEvent[];
    onPcbBoundsSelected?: (bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    }) => void;
    onActiveTabChange?: (tab: TabId) => any;
    autoRotate3dViewerDisabled?: boolean;
    showSchematicDebugGrid?: boolean;
    onChangeShowSchematicDebugGrid?: (show: boolean) => void;
    showSchematicPorts?: boolean;
    onChangeShowSchematicPorts?: (show: boolean) => void;
    onReportAutoroutingLog?: (name: string, data: {
        simpleRouteJson: any;
    }) => void;
    /**
     * Enable selecting older @tscircuit/eval versions
     */
    allowSelectingVersion?: boolean;
    /**
     * Whether to show the file menu
     */
    showFileMenu?: boolean;
    /**
     * Whether the preview is being embedded in a web page
     */
    isWebEmbedded?: boolean;
    /**
     * Whether the preview is running in the tscircuit CLI surface.
     */
    isCli?: boolean;
    /**
     * Project name to use for exports
     */
    projectName?: string;
    /**
     * Callback to rerun render with debug options
     */
    onRerunWithDebug?: (debugOption: string) => void;
    /**
     * List of solver started events tracked during circuit rendering
     */
    solverEvents?: SolverStartedEvent[];
    /** Captured routing inputs and outputs for the current circuit render. */
    autoroutingPhases?: AutoroutingPhase[];
}

declare global {
    interface Window {
        TSCIRCUIT_3D_OBJECT_REF: Object3D | undefined;
        /** Disable RunFrame telemetry before loading the viewer. */
        TSCIRCUIT_TELEMETRY_DISABLED?: boolean;
        /** Default for allowSelectingVersion; an explicit prop takes precedence. */
        TSCIRCUIT_ALLOW_SELECTING_EVAL_VERSION?: boolean;
    }
}

declare const CircuitJsonPreview: ({ platformConfig, code, fsMap, onRunClicked, errorMessage, errorStack, circuitJson, autoroutingGraphics, showRightHeaderContent, showCodeTab, codeTabContent, showJsonTab, showRenderLogTab, onActiveTabChange, renderLog, showImportAndFormatButtons, className, headerClassName, leftHeaderContent, readOnly, isStreaming, autoroutingLog, onReportAutoroutingLog, isRunningCode, hasCodeChangedSinceLastRun, onEditEvent, editEvents, defaultActiveTab, defaultTab, availableTabs, autoRotate3dViewerDisabled, showSchematicDebugGrid: showSchematicDebugGridProp, showSchematicPorts: showSchematicPortsProp, onChangeShowSchematicDebugGrid, onChangeShowSchematicPorts, showToggleFullScreen, defaultToFullScreen, activeEffectName, allowSelectingVersion, showFileMenu, isWebEmbedded, isCli, projectName, schematicSvgOptions, hideSchematicInAnalogSimulation, onRerunWithDebug, solverEvents, autoroutingPhases, onPcbBoundsSelected, }: PreviewContentProps) => react.JSX.Element;

interface BomTableProps {
    circuitJson: AnyCircuitElement[];
}

declare const BomTable: react__default.FC<BomTableProps>;

type PCBViewerProps = ComponentProps<typeof PCBViewer>;
declare const PcbViewerWithContainerHeight: ({ circuitJson, containerClassName, ...props }: {
    containerClassName?: string;
    circuitJson?: AnyCircuitElement[];
} & Omit<PCBViewerProps, "circuitJson">) => react.JSX.Element;

interface CliOrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    stage: "initial" | "progress" | "checkout";
    setStage: (stage: "initial" | "progress" | "checkout") => void;
    signIn?: () => void;
    isLoggedIn?: boolean;
}

interface OrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    stage: "initial" | "progress" | "checkout";
    setStage: (stage: "initial" | "progress" | "checkout") => void;
    circuitJson?: CircuitJson;
    packageReleaseId?: string;
    signIn?: () => void;
    isLoggedIn: boolean;
}
declare const OrderDialog: FC<OrderDialogProps>;

type OrderStage = "initial" | "progress" | "checkout";
declare const useOrderDialogCli: () => {
    isOpen: boolean;
    stage: OrderStage;
    open: () => void;
    close: () => void;
    setStage: react.Dispatch<react.SetStateAction<OrderStage>>;
    OrderDialog: react.FC<CliOrderDialogProps>;
};
declare const useOrderDialog: ({ onSignIn, isLoggedIn, packageReleaseId, }: {
    onSignIn: () => void;
    isLoggedIn: boolean;
    packageReleaseId: string;
}) => {
    isOpen: boolean;
    stage: OrderStage;
    open: () => void;
    close: () => void;
    setStage: react.Dispatch<react.SetStateAction<OrderStage>>;
    OrderDialog: (props: Omit<Parameters<typeof OrderDialog>[0], "signIn" | "isLoggedIn">) => react.JSX.Element;
};

interface ExportAccessoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    circuitJson: CircuitJson;
    projectName: string;
}
declare function ExportAccessoryDialog({ open, onOpenChange, circuitJson, projectName, }: ExportAccessoryDialogProps): react.JSX.Element;

export { type AutoroutingPhase, type AutoroutingPhaseEvent, BomTable, CircuitJsonPreview, ExportAccessoryDialog, type ExportAccessoryDialogProps, PcbViewerWithContainerHeight, type PreviewContentProps, type SolverStartedEvent, type TabId, useOrderDialog, useOrderDialogCli };
