import { TabId } from './preview.js';
export { AutoroutingPhase, AutoroutingPhaseEvent, BomTable, CircuitJsonPreview, ExportAccessoryDialog, ExportAccessoryDialogProps, PcbViewerWithContainerHeight, PreviewContentProps, SolverStartedEvent, useOrderDialog, useOrderDialogCli } from './preview.js';
export { CadViewer } from '@tscircuit/3d-viewer';
export { PCBViewer as PcbViewer, PcbViewerController, usePcbViewerController } from '@tscircuit/pcb-viewer';
export { SchematicViewer, ViewPcbComponentEvent, useSchematicViewerController } from '@tscircuit/schematic-viewer';
import * as react from 'react';
import { ManualEditEvent, PlatformConfig } from '@tscircuit/props';
import { Package } from '@tscircuit/fake-snippets/schema';
import { CircuitJson } from 'circuit-json';
import '@tscircuit/core';
import 'three';

interface RunCompletedPayload {
    errors?: Array<any>;
    hasExecutionError: boolean;
}

interface RunFrameProps {
    /**
     * Map of filenames to file contents that will be available in the worker
     */
    fsMap: Map<string, string> | Record<string, string>;
    /**
     * When true, indicates the file map is still loading and a loading state
     * should be displayed instead of attempting to execute any code.
     */
    isLoadingFiles?: boolean;
    /**
     * The entry point file that will be executed first. If not provided,
     * @tscircuit/eval will infer the entrypoint
     */
    entrypoint?: string;
    /**
     * The path to the main component that should be rendered. If not provided,
     * the default component from the entry point will be used.
     */
    mainComponentPath?: string;
    /**
     * Whether to show a run button that controls when code executes
     */
    showRunButton?: boolean;
    /**
     * Whether to show a full screen button
     */
    showToggleFullScreen?: boolean;
    /**
     * Whether to expand the preview to fill the available space by default
     */
    defaultToFullScreen?: boolean;
    /**
     * An optional left-side header, you can put a save button, a run button, or
     * a title here.
     */
    leftHeaderContent?: React.ReactNode;
    /**
     * Whether the run frame is embedded in a web page
     */
    isWebEmbedded?: boolean;
    /**
     * Whether the run frame is running in the tscircuit CLI surface.
     */
    isCli?: boolean;
    /**
     * Whether to show the file menu
     */
    showFileMenu?: boolean;
    /**
     * Called when the circuit JSON changes
     */
    onCircuitJsonChange?: (circuitJson: any) => void;
    /**
     * Called when rendering is finished
     */
    onRenderFinished?: (params: {
        circuitJson: any;
    }) => void;
    /**
     * Called when code execution and rendering have completed (even if errors occurred)
     */
    onRunCompleted?: (payload: RunCompletedPayload) => void;
    /**
     * Called when the initial render is finished (fast)
     */
    onInitialRender?: (params: {
        circuitJson: any;
    }) => void;
    /**
     * Called when rendering is started
     */
    onRenderStarted?: () => void;
    /**
     * Called for each render event
     */
    onRenderEvent?: (event: any) => void;
    /**
     * Called when an error occurs
     */
    onError?: (error: Error) => void;
    /**
     * Called when an edit event occurs
     */
    onEditEvent?: (editEvent: ManualEditEvent) => void;
    /**
     * Any edit events that have occurred and should be applied
     */
    editEvents?: ManualEditEvent[];
    onPcbBoundsSelected?: (bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    }) => void;
    /**
     * If true, turns on debug logging
     */
    debug?: boolean;
    defaultActiveTab?: TabId;
    /**
     * Alias for defaultActiveTab
     */
    defaultTab?: TabId;
    /**
     * Tabs to display. Defaults to all
     */
    availableTabs?: TabId[];
    schematicSvgOptions?: {
        css?: string;
        className?: string;
    };
    evalWebWorkerBlobUrl?: string;
    evalVersion?: string;
    forceLatestEvalVersion?: boolean;
    shouldLoadLatestEval?: boolean;
    onChangeShouldLoadLatestEval?: (shouldLoadLatestEval: boolean) => void;
    /**
     * Optional project URL whose pathname will be used when
     * reporting autorouting bugs
     */
    projectUrl?: string;
    /**
     * Base URL for the project, used in webworker platform config
     */
    projectBaseUrl?: string;
    /**
     * Shared circuit platform hooks, passed to the evaluator and preview viewers.
     */
    platformConfig?: PlatformConfig;
    onReportAutoroutingLog?: (name: string, data: {
        simpleRouteJson: any;
    }) => void;
    /**
     * Enable fetch proxy for the web worker (useful for standalone bundles)
     */
    enableFetchProxy?: boolean;
    /**
     * Called when an action requires authentication (e.g. reporting autorouting bugs)
     */
    onLoginRequired?: () => void;
    /**
     * The session token to used for the tscircuit registry
     */
    tscircuitSessionToken?: string;
    /**
     * Configuration for proxying EasyEDA API requests, used by the parts engine
     * when fetching part circuit JSON (e.g. for connector footprints).
     */
    easyEdaProxyConfig?: {
        proxyEndpointUrl: string;
        headers?: Record<string, string>;
    };
}

declare global {
    var runFrameWorker: any;
    interface Window {
        TSCIRCUIT_USE_RUNFRAME_FOR_CLI?: boolean;
        TSCIRCUIT_JLCSEARCH_BASE_URL?: string;
        TSCIRCUIT_DATASHEET_API_BASE_URL?: string;
    }
}

declare const RunFrame: (props: RunFrameProps) => react.JSX.Element;

declare const guessEntrypoint: (files: string[]) => string | undefined;
declare const guessManualEditsFilePath: (files: string[]) => string | undefined;
interface RunFrameWithApiProps {
    /**
     * Base URL for the API endpoints
     */
    apiBaseUrl?: string;
    evalVersion?: string;
    forceLatestEvalVersion?: boolean;
    debug?: boolean;
    leftHeaderContent?: React.ReactNode;
    shouldLoadLatestEval?: boolean;
    onChangeShouldLoadLatestEval?: (shouldLoadLatestEval: boolean) => void;
    defaultToFullScreen?: boolean;
    showToggleFullScreen?: boolean;
    showFilesSwitch?: boolean;
    workerBlobUrl?: string;
    evalWebWorkerBlobUrl?: string;
    showFileMenu?: boolean;
    schematicSvgOptions?: RunFrameProps["schematicSvgOptions"];
    platformConfig?: RunFrameProps["platformConfig"];
    isCli?: boolean;
    /**
     * Enable fetch proxy for the web worker (useful for standalone bundles)
     */
    enableFetchProxy?: boolean;
    /**
     * The main component path that should be selected initially when available.
     */
    initialMainComponentPath?: string;
    /**
     * Callback invoked whenever the selected main component path changes.
     */
    onMainComponentPathChange?: (path: string) => void;
    /**
     * File filter function to determine which files are valid for display in UI.
     */
    fileFilter?: (filename: string) => boolean;
    /**
     * Called when an action requires authentication (e.g. reporting autorouting bugs)
     */
    onLoginRequired?: () => void;
}
declare const RunFrameWithApi: (props: RunFrameWithApiProps) => react.JSX.Element;

interface RunFrameForCliProps {
    debug?: boolean;
    scenarioSelectorContent?: React.ReactNode;
    workerBlobUrl?: string;
    evalWebWorkerBlobUrl?: string;
    enableFetchProxy?: boolean;
    apiBaseUrl?: string;
    platformConfig?: RunFrameWithApiProps["platformConfig"];
}
declare const RunFrameForCli: (props: RunFrameForCliProps) => react.JSX.Element;

interface ComponentSearchResult {
    id: string;
    name: string;
    description?: string;
    source: "tscircuit.com" | "jlcpcb" | "kicad";
    partNumber?: string;
    package?: string;
    price?: number;
    code?: string;
    owner?: string;
}
interface ImportComponentDialogProps$1 {
    isOpen: boolean;
    onClose: () => void;
    proxyRequestHeaders?: Record<string, string>;
    onImport?: (component: ComponentSearchResult) => void;
}
declare const ImportComponentDialog: ({ isOpen, onClose, proxyRequestHeaders, onImport, }: ImportComponentDialogProps$1) => react.JSX.Element;

/**
 * JLC API service for fetching component data from the JLC search API
 */
interface JLCComponent {
    description: string;
    lcsc: number;
    mfr: string;
    package: string;
    price: number;
}
/**
 * Search for components in the JLC database
 * @param query Search query string
 * @param limit Maximum number of results to return (default: 10)
 * @returns Promise with search results
 */
declare const searchJLCComponents: (query: string, limit?: number) => Promise<JLCComponent[]>;
/**
 * Map JLC component data to the ComponentSearchResult format used in the ImportComponentDialog
 * @param jlcComponent JLC component data
 * @returns Formatted component data for the UI
 */
declare const mapJLCComponentToSearchResult: (jlcComponent: JLCComponent) => {
    id: string;
    name: string;
    description: string;
    source: "jlcpcb";
    partNumber: string;
    package: string;
    price: number;
};

/**
 * tscircuit Registry API service for fetching component data from the tscircuit registry API
 */

/**
 * Search for components in the tscircuit registry
 * @param query Search query string
 * @param limit Maximum number of results to return (default: 10)
 * @returns Promise with search results
 */
declare const searchTscircuitComponents: (query: string) => Promise<Package[]>;
/**
 * Map tscircuit component data to the ComponentSearchResult format used in the ImportComponentDialog
 * @param tscircuitSnippet tscircuit component data
 * @returns Formatted component data for the UI
 */
declare const mapTscircuitSnippetToSearchResult: (tscircuitSnippet: Package) => ComponentSearchResult;

type ImportSource = "tscircuit.com" | "jlcpcb" | "kicad";
interface TscircuitPackageDetails {
    ai_description?: string;
    ai_usage_instructions?: string;
    [key: string]: unknown;
}
interface TscircuitPackageSearchResult {
    source: "tscircuit.com";
    package: Package;
}
interface JlcpcbComponentSummary {
    lcscId: number;
    manufacturer: string;
    partNumber: string;
    description: string;
    package: string;
    price?: number;
    stock?: number;
    isBasic?: boolean;
    isDirectLookup?: boolean;
}
interface JlcpcbComponentSearchResult {
    source: "jlcpcb";
    component: JlcpcbComponentSummary;
}
interface KicadFootprintSummary {
    path: string;
    qualifiedName: string;
    description?: string;
}
interface KicadFootprintSearchResult {
    source: "kicad";
    footprint: KicadFootprintSummary;
}
type ImportComponentDialogSearchResult = TscircuitPackageSearchResult | JlcpcbComponentSearchResult | KicadFootprintSearchResult;
interface ImportComponentDialog2Props {
    isOpen: boolean;
    onClose: () => void;
    jlcpcbProxyRequestHeaders?: Record<string, string>;
    jlcpcbProxyApiBase?: string;
    tscircuitSessionToken?: string;
    onKicadStringSelected?: (payload: KicadStringSelectedPayload) => void | Promise<void>;
    onTscircuitPackageSelected?: (payload: TscircuitPackageSelectedPayload) => void | Promise<void>;
    onJlcpcbComponentTsxLoaded?: (payload: JlcpcbComponentTsxLoadedPayload) => void | Promise<void>;
}
type ImportComponentDialogProps = ImportComponentDialog2Props;
interface KicadStringSelectedPayload {
    result: KicadFootprintSearchResult;
    footprint: string;
}
interface TscircuitPackageSelectedPayload {
    result: TscircuitPackageSearchResult;
    fullPackageName: string;
}
interface JlcpcbComponentTsxLoadedPayload {
    result: JlcpcbComponentSearchResult;
    tsx: string;
}

declare const ImportComponentDialog2: ({ isOpen, onClose, jlcpcbProxyRequestHeaders, onKicadStringSelected, onTscircuitPackageSelected, onJlcpcbComponentTsxLoaded, jlcpcbProxyApiBase, tscircuitSessionToken, }: ImportComponentDialog2Props) => react.JSX.Element;

type CliImportDialogProps = Omit<ImportComponentDialog2Props, "onKicadStringSelected" | "onTscircuitPackageSelected" | "onJlcpcbComponentTsxLoaded">;
declare const ImportComponentDialogForCli: {
    (props: CliImportDialogProps): react.JSX.Element;
    displayName: string;
};

interface CircuitJsonFileReference {
    filePath: string;
    fileStaticAssetUrl: string;
}
interface RunFrameStaticBuildViewerProps {
    debug?: boolean;
    files: CircuitJsonFileReference[];
    onFetchFile?: (fileRef: CircuitJsonFileReference) => Promise<CircuitJson>;
    initialCircuitPath?: string;
    onCircuitJsonPathChange?: (path: string) => void;
    defaultToFullScreen?: boolean;
    showToggleFullScreen?: boolean;
    projectName?: string;
    showFileMenu?: boolean;
    tabSelected?: TabId;
    /** Open the visual circuit gallery on the initial render. */
    defaultToGallery?: boolean;
}
declare const RunFrameStaticBuildViewer: (props: RunFrameStaticBuildViewerProps) => react.JSX.Element;

declare const CircuitJsonFileSelectorCombobox: ({ files, onFileChange, currentFile, }: {
    files: string[];
    currentFile: string;
    onFileChange: (value: string) => void;
}) => react.JSX.Element;

declare const getCircuitPreviewImageUrls: (fileRef: CircuitJsonFileReference) => string[];
declare const CircuitGallery: ({ files, projectName, onSelectFile, onClose, }: {
    files: CircuitJsonFileReference[];
    projectName?: string;
    onSelectFile: (filePath: string) => void;
    onClose: () => void;
}) => react.JSX.Element;

export { CircuitGallery, CircuitJsonFileSelectorCombobox, type ComponentSearchResult, ImportComponentDialog, ImportComponentDialog2, type ImportComponentDialog2Props, ImportComponentDialogForCli, type ImportComponentDialogProps, type ImportComponentDialogSearchResult, type ImportSource, type JlcpcbComponentSearchResult, type JlcpcbComponentSummary, type JlcpcbComponentTsxLoadedPayload, type KicadFootprintSearchResult, type KicadFootprintSummary, type KicadStringSelectedPayload, RunFrame, RunFrameForCli, type RunFrameForCliProps, type RunFrameProps, RunFrameStaticBuildViewer, type RunFrameStaticBuildViewerProps, RunFrameWithApi, type RunFrameWithApiProps, TabId, type TscircuitPackageDetails, type TscircuitPackageSearchResult, type TscircuitPackageSelectedPayload, getCircuitPreviewImageUrls, guessEntrypoint, guessManualEditsFilePath, mapJLCComponentToSearchResult, mapTscircuitSnippetToSearchResult, searchJLCComponents, searchTscircuitComponents };
