import {
  API_BASE,
  BomTable,
  Button,
  CadViewer,
  CircuitJsonPreview,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ExportAccessoryDialog,
  FileMenuLeftHeader,
  ImportComponentDialog2,
  ImportComponentDialogForCli,
  Input,
  PCBViewer,
  PcbViewerWithContainerHeight,
  SchematicViewer,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  captureAutoroutingPhase,
  cn,
  createEasyEdaProxyFetch,
  debug_default,
  getRegistryKy,
  loadEasyedaBrowser,
  registryKy,
  toast,
  useLocalStorageState,
  useOrderDialog,
  useOrderDialogCli,
  usePcbViewerController,
  usePostHogActivity,
  useRunFrameStore,
  useRunnerStore,
  useSchematicViewerController,
  useStyles
} from "./chunk-SXWQJF4D.js";

// lib/components/RunFrame/RunFrame.tsx
import { createCircuitWebWorker } from "@tscircuit/eval/worker";
import Debug from "debug";
import { HTTPError } from "ky";
import { Loader2, Play, Square } from "lucide-react";
import { useEffect, useMemo as useMemo2, useReducer, useRef as useRef2, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

// lib/components/RunFrame/RunFrameErrorFallback.tsx
import { AlertTriangle } from "lucide-react";
import { jsx, jsxs } from "react/jsx-runtime";
var RunFrameErrorFallback = ({
  error,
  resetErrorBoundary,
  componentStack
}) => {
  const resolvedError = error instanceof Error ? error : new Error(String(error));
  return /* @__PURE__ */ jsx("section", { className: "rf-h-full rf-w-full rf-grid rf-place-items-center", children: /* @__PURE__ */ jsx("div", { className: "rf-min-h-full rf-flex rf-items-center rf-justify-center rf-px-4", children: /* @__PURE__ */ jsxs("div", { className: "rf-max-w-lg rf-w-full rf-text-center", children: [
    /* @__PURE__ */ jsxs("div", { className: "rf-mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "rf-inline-flex rf-items-center rf-justify-center rf-w-20 rf-h-20 rf-bg-red-100 rf-rounded-full rf-mb-6", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "rf-w-10 rf-h-10 rf-text-red-600" }) }),
      /* @__PURE__ */ jsx("h1", { className: "rf-text-2xl rf-font-bold rf-text-gray-900 rf-mb-3", children: "Oops! Something went wrong" }),
      /* @__PURE__ */ jsx("p", { className: "rf-text-gray-600 rf-mb-4", children: "RunFrame encountered an unexpected error." }),
      /* @__PURE__ */ jsx("pre", { className: "rf-text-xs no-scrollbar rf-font-mono rf-text-left rf-whitespace-pre-wrap rf-text-red-600 rf-bg-red-50 rf-border rf-border-red-200 rf-p-3 rf-rounded-lg rf-mb-4 rf-overflow-auto rf-max-h-[120px]", children: resolvedError.message }),
      resolvedError.stack && /* @__PURE__ */ jsxs("details", { className: "rf-text-center rf-mb-6", children: [
        /* @__PURE__ */ jsx("summary", { className: "rf-text-xs rf-text-gray-500 rf-cursor-pointer hover:rf-text-gray-700", children: "View stack trace" }),
        /* @__PURE__ */ jsx("pre", { className: "rf-text-xs rf-font-mono no-scrollbar rf-whitespace-pre-wrap rf-text-gray-500 rf-bg-gray-100 rf-p-3 rf-rounded-lg rf-mt-2 rf-overflow-auto rf-text-left rf-max-h-[150px]", children: resolvedError.stack })
      ] }),
      componentStack && /* @__PURE__ */ jsxs("details", { className: "rf-text-center rf-mb-6", children: [
        /* @__PURE__ */ jsx("summary", { className: "rf-text-xs rf-text-gray-500 rf-cursor-pointer hover:rf-text-gray-700", children: "View component stack" }),
        /* @__PURE__ */ jsx("pre", { className: "rf-text-xs rf-font-mono no-scrollbar rf-whitespace-pre-wrap rf-text-gray-500 rf-bg-gray-100 rf-p-3 rf-rounded-lg rf-mt-2 rf-overflow-auto rf-text-left rf-max-h-[150px]", children: componentStack })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "rf-flex rf-flex-col rf-gap-2 rf-justify-center", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "destructive",
          size: "lg",
          onClick: () => window.location.reload(),
          children: "Refresh Dev Server"
        }
      ),
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "lg", onClick: resetErrorBoundary, children: "Try Again" })
    ] })
  ] }) }) });
};

// lib/components/RunFrame/RunFrame.tsx
import {
  orderedRenderPhases as orderedRenderPhases2
} from "@tscircuit/core";

// lib/render-logging/getPhaseTimingsFromRenderEvents.ts
import { orderedRenderPhases } from "@tscircuit/core";
var getPhaseTimingsFromRenderEvents = (renderEvents) => {
  const phaseTimings = {};
  if (!renderEvents) return phaseTimings;
  for (const renderPhase of orderedRenderPhases) {
    phaseTimings[renderPhase] = 0;
  }
  const startEvents = /* @__PURE__ */ new Map();
  for (const event of renderEvents) {
    const [, , phase, eventType] = event.type.split(":");
    if (eventType === "start") {
      startEvents.set(`${phase}:${event.renderId}`, event);
      continue;
    }
    if (eventType === "end") {
      const startEvent = startEvents.get(`${phase}:${event.renderId}`);
      if (startEvent) {
        const duration = event.createdAt - startEvent.createdAt;
        phaseTimings[phase] = (phaseTimings[phase] || 0) + duration;
      }
    }
  }
  return phaseTimings;
};

// lib/utils/file-filters.ts
var isCircuitJsonFile = (filename) => {
  const normalizedFilename = filename.toLowerCase();
  const basename = normalizedFilename.split("/").pop();
  return normalizedFilename.endsWith(".circuit.json") || basename === "circuit.json";
};
var getUiFileFilter = () => (filename) => {
  return filename.endsWith(".tsx") || isCircuitJsonFile(filename) || filename.endsWith(".jsx");
};
var DEFAULT_UI_FILE_FILTER = getUiFileFilter();

// lib/hooks/use-circuit-json-file.ts
import { useMemo } from "react";
var useCircuitJsonFile = ({
  mainComponentPath,
  fsMap
}) => {
  const isStaticCircuitJson = mainComponentPath != null && isCircuitJsonFile(mainComponentPath);
  const circuitJsonContent = mainComponentPath ? fsMap.get(mainComponentPath) : void 0;
  return useMemo(() => {
    if (!isStaticCircuitJson) {
      return { isStaticCircuitJson: false, circuitJson: null, error: null };
    }
    if (!circuitJsonContent) {
      return {
        isStaticCircuitJson: true,
        circuitJson: null,
        error: `Circuit JSON file not found: ${mainComponentPath}`
      };
    }
    try {
      const parsed = JSON.parse(circuitJsonContent);
      return { isStaticCircuitJson: true, circuitJson: parsed, error: null };
    } catch (e) {
      return {
        isStaticCircuitJson: true,
        circuitJson: null,
        error: `Failed to parse circuit.json: ${e instanceof Error ? e.message : String(e)}`
      };
    }
  }, [mainComponentPath, circuitJsonContent]);
};

// lib/utils/getChangesBetweenFsMaps.tsx
var getChangesBetweenFsMaps = (fsMap1, fsMap2) => {
  const changes = {};
  for (const [path, oldContent] of fsMap1.entries()) {
    const newContent = fsMap2.get(path);
    if (newContent !== oldContent) {
      changes[path] = {
        old: oldContent,
        new: newContent
      };
    }
  }
  for (const [path, newContent] of fsMap2.entries()) {
    if (!fsMap1.has(path)) {
      changes[path] = {
        old: void 0,
        new: newContent
      };
    }
  }
  return changes;
};

// lib/components/ui/LoadingSkeleton.tsx
import { jsx as jsx2, jsxs as jsxs2 } from "react/jsx-runtime";
var LoadingSkeleton = ({
  message = "Loading files..."
}) => {
  return /* @__PURE__ */ jsxs2("div", { className: "rf-flex rf-flex-col rf-w-full rf-h-full", children: [
    /* @__PURE__ */ jsxs2("div", { className: "rf-flex rf-items-center rf-gap-4 rf-p-2 rf-border-b", children: [
      /* @__PURE__ */ jsx2("div", { className: "rf-w-20 rf-h-9 rf-bg-gray-200 dark:rf-bg-gray-700 rf-rounded-md rf-animate-pulse" }),
      /* @__PURE__ */ jsx2("div", { className: "rf-flex rf-gap-6 rf-ml-auto", children: ["PCB", "Schematic", "3D"].map((_, i) => /* @__PURE__ */ jsx2(
        "div",
        {
          className: "rf-h-6 rf-w-20 rf-bg-gray-200 dark:rf-bg-gray-700 rf-rounded rf-animate-pulse"
        },
        i
      )) })
    ] }),
    /* @__PURE__ */ jsx2("div", { className: "rf-flex-1 rf-p-4", children: /* @__PURE__ */ jsx2("div", { className: "rf-w-full rf-h-full rf-rounded-lg rf-bg-gray-100 dark:rf-bg-gray-800 rf-animate-pulse rf-flex rf-items-center rf-justify-center", children: /* @__PURE__ */ jsx2("div", { className: "rf-flex rf-flex-col rf-items-center rf-gap-4", children: /* @__PURE__ */ jsx2("div", { className: "rf-text-sm rf-text-gray-400 dark:rf-text-gray-500", children: message }) }) }) })
  ] });
};

// lib/components/RunFrame/get-run-frame-project-config.ts
var getRunFrameProjectConfig = ({
  projectBaseUrl,
  enablePartOrientationAnalysis
}) => ({
  projectBaseUrl,
  enablePartOrientationAnalysis: enablePartOrientationAnalysis ?? true
});

// lib/components/RunFrame/run-completion.ts
var isCircuitJsonError = (entry) => {
  if (!entry || typeof entry !== "object") return false;
  if ("error_type" in entry) return true;
  if (typeof entry.type === "string" && entry.type.includes("error"))
    return true;
  return false;
};
var serializeError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }
  if (typeof error === "string") {
    return { message: error };
  }
  if (error && typeof error === "object") {
    return error;
  }
  return { message: String(error) };
};
var extractCircuitJsonErrors = (circuitJson) => {
  if (!Array.isArray(circuitJson)) return [];
  return circuitJson.filter(isCircuitJsonError);
};
var buildRunCompletedPayload = ({
  circuitJson,
  executionError
}) => {
  const errors = [];
  if (executionError) {
    errors.push(serializeError(executionError));
  }
  const circuitJsonErrors = extractCircuitJsonErrors(circuitJson);
  errors.push(...circuitJsonErrors);
  return {
    hasExecutionError: Boolean(executionError),
    ...errors.length > 0 ? { errors } : {}
  };
};

// lib/components/RunFrame/useMutex.tsx
import { useCallback, useRef } from "react";
function useMutex() {
  const lockRef = useRef(Promise.resolve());
  const isLockedRef = useRef(false);
  const currentExecutionRef = useRef(null);
  const runWithMutex = useCallback(
    async (fn) => {
      await lockRef.current;
      const executionContext = { cancelled: false };
      currentExecutionRef.current = executionContext;
      let releaseLock;
      const newLock = new Promise((resolve) => {
        releaseLock = resolve;
      });
      try {
        lockRef.current = newLock;
        isLockedRef.current = true;
        return await fn();
      } catch (error) {
        if (!executionContext.cancelled) {
          throw error;
        }
      } finally {
        isLockedRef.current = false;
        currentExecutionRef.current = null;
        releaseLock();
      }
    },
    []
  );
  const cancel = useCallback(() => {
    if (currentExecutionRef.current) {
      currentExecutionRef.current.cancelled = true;
    }
    lockRef.current = Promise.resolve();
    isLockedRef.current = false;
  }, []);
  const isLocked = useCallback(() => isLockedRef.current, []);
  return { runWithMutex, isLocked, cancel };
}

// lib/components/RunFrame/RunFrame.tsx
import { Fragment, jsx as jsx3, jsxs as jsxs3 } from "react/jsx-runtime";
var numRenderPhases = 26;
var debug = Debug("run-frame:RunFrame");
var fetchLatestEvalVersion = async () => {
  try {
    const response = await fetch(
      "https://data.jsdelivr.com/v1/package/npm/@tscircuit/eval"
    );
    if (response.ok) {
      const data = await response.json();
      return data.tags?.latest;
    }
  } catch (err) {
    console.error("Failed to fetch latest eval version", err);
  }
  return void 0;
};
var resolveEvalVersion = async (evalVersionProp, forceLatest) => {
  if (evalVersionProp) return evalVersionProp;
  if (forceLatest || !window.TSCIRCUIT_LATEST_EVAL_VERSION) {
    const latest = await fetchLatestEvalVersion();
    if (latest) {
      window.TSCIRCUIT_LATEST_EVAL_VERSION = latest;
      return latest;
    }
  }
  if (window.TSCIRCUIT_LATEST_EVAL_VERSION) {
    return window.TSCIRCUIT_LATEST_EVAL_VERSION;
  }
  return "latest";
};
var RunFrame = (props) => {
  useStyles();
  const isStaticCircuitJson = props.mainComponentPath != null && isCircuitJsonFile(props.mainComponentPath);
  const circuitJson = useRunFrameStore((s) => s.circuitJson);
  const setCircuitJson = useRunFrameStore((s) => s.setCircuitJson);
  const [error, setError] = useState(null);
  const [componentStack, setComponentStack] = useState(null);
  const cancelExecutionRef = useRef2(null);
  const componentActiveRef = useRef2(true);
  const workerCreationRef = useRef2(null);
  const [autoroutingGraphics, setAutoroutingGraphics] = useState(null);
  const [runCountTrigger, incRunCountTrigger] = useReducer(
    (acc, s) => acc + 1,
    0
  );
  const setLastRunEvalVersion = useRunnerStore((s) => s.setLastRunEvalVersion);
  const lastRunCountTriggerRef = useRef2(0);
  const runMutex = useMutex();
  const [isRunning, setIsRunning] = useState(false);
  const [dependenciesLoaded, setDependenciesLoaded] = useState(false);
  const [activeAsyncEffects, setActiveAsyncEffects] = useState({});
  const [currentDebugOption, setCurrentDebugOption] = useState("");
  const [showSchematicDebugGrid, setShowSchematicDebugGrid] = useState(false);
  const [showSchematicPorts, setShowSchematicPorts] = useState(false);
  useEffect(() => {
    componentActiveRef.current = true;
    return () => {
      componentActiveRef.current = false;
      cancelExecutionRef.current?.();
      const pending = workerCreationRef.current;
      void pending?.then(({ worker }) => {
        if (!componentActiveRef.current && globalThis.runFrameWorker !== worker) {
          return worker.kill();
        }
      }).catch(() => {
      });
    };
  }, []);
  const getWorker = () => {
    if (workerCreationRef.current) return workerCreationRef.current;
    const pending = (async () => {
      const evalVersion = await resolveEvalVersion(
        props.evalVersion,
        !globalThis.runFrameWorker && props.forceLatestEvalVersion
      );
      const partsEngineOptions = {
        jlcSearchBaseUrl: window.TSCIRCUIT_JLCSEARCH_BASE_URL,
        datasheetApiBaseUrl: window.TSCIRCUIT_DATASHEET_API_BASE_URL
      };
      const hasPartsEngineBaseUrls = partsEngineOptions.jlcSearchBaseUrl !== void 0 || partsEngineOptions.datasheetApiBaseUrl !== void 0;
      const worker = globalThis.runFrameWorker ?? await createCircuitWebWorker({
        evalVersion,
        webWorkerBlobUrl: props.evalWebWorkerBlobUrl,
        projectConfig: getRunFrameProjectConfig({
          enablePartOrientationAnalysis: props.platformConfig?.enablePartOrientationAnalysis,
          projectBaseUrl: props.projectBaseUrl ?? props.platformConfig?.projectBaseUrl ?? `${API_BASE}/files/static`
        }),
        ...props.platformConfig && { platform: props.platformConfig },
        verbose: true,
        ...props.enableFetchProxy && {
          enableFetchProxy: props.enableFetchProxy
        },
        ...window.TSCIRCUIT_USE_RUNFRAME_FOR_CLI && {
          disableCdnLoading: true
        },
        ...props.tscircuitSessionToken && {
          tscircuitSessionToken: props.tscircuitSessionToken
        },
        ...props.easyEdaProxyConfig && {
          easyEdaProxyConfig: props.easyEdaProxyConfig
        },
        ...hasPartsEngineBaseUrls && { partsEngineOptions }
      });
      return { worker, evalVersion };
    })();
    workerCreationRef.current = pending;
    const clearPending = () => {
      if (workerCreationRef.current === pending)
        workerCreationRef.current = null;
    };
    void pending.then(clearPending, clearPending);
    return pending;
  };
  const activeEffectName = Object.values(activeAsyncEffects).sort(
    (a, b) => a.startTime - b.startTime
  )[0]?.effectName;
  const emitRunCompleted = (payload) => {
    props.onRunCompleted?.(payload);
  };
  useEffect(() => {
    if (isStaticCircuitJson) return;
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isRunning) {
        e.preventDefault();
        e.stopPropagation();
        incRunCountTrigger(1);
      }
    };
    window.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
  }, [isRunning, isStaticCircuitJson]);
  useEffect(() => {
    if (isStaticCircuitJson) return;
    let cancelled = false;
    const load = async () => {
      try {
        if (!globalThis.runFrameWorker) {
          const { worker, evalVersion } = await getWorker();
          if (cancelled || !componentActiveRef.current) return;
          globalThis.runFrameWorker = worker;
          setLastRunEvalVersion(evalVersion);
        }
        if (!cancelled) setDependenciesLoaded(true);
      } catch (err) {
        if (!cancelled && componentActiveRef.current) {
          console.error("Failed to preload eval worker", err);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [
    isStaticCircuitJson,
    props.evalVersion,
    props.evalWebWorkerBlobUrl,
    props.forceLatestEvalVersion,
    props.tscircuitSessionToken
  ]);
  const [renderLog, setRenderLog] = useState(null);
  const [autoroutingLog, setAutoroutingLog] = useState({});
  const [solverEvents, setSolverEvents] = useState([]);
  const [autoroutingPhases, setAutoroutingPhases] = useState([]);
  const autoroutingCaptureGeneration = useRef2(0);
  const [activeTab, setActiveTab] = useState(
    props.defaultActiveTab ?? props.defaultTab ?? "pcb"
  );
  usePostHogActivity({
    source: "runframe",
    component: "RunFrame",
    isWebEmbedded: props.isWebEmbedded,
    activeTab
  });
  useEffect(() => {
    if (props.debug) Debug.enable("run-frame*");
  }, [props.debug]);
  const fsMap = useMemo2(
    () => props.fsMap instanceof Map ? props.fsMap : new Map(Object.entries(props.fsMap ?? {})),
    [props.fsMap]
  );
  const lastFsMapRef = useRef2(null);
  const lastEntrypointRef = useRef2(null);
  const lastStaticResultRef = useRef2(null);
  const {
    circuitJson: circuitJsonFileParsedContent,
    error: circuitJsonFileError
  } = useCircuitJsonFile({
    mainComponentPath: props.mainComponentPath,
    fsMap
  });
  useEffect(() => {
    if (!isStaticCircuitJson) {
      lastStaticResultRef.current = null;
      return;
    }
    if (props.isLoadingFiles) return;
    const result = circuitJsonFileParsedContent ?? circuitJsonFileError;
    if (result === lastStaticResultRef.current) return;
    lastStaticResultRef.current = result;
    if (circuitJsonFileParsedContent) {
      props.onRenderStarted?.();
      setCircuitJson(circuitJsonFileParsedContent);
      setError(null);
      props.onCircuitJsonChange?.(circuitJsonFileParsedContent);
      props.onInitialRender?.({ circuitJson: circuitJsonFileParsedContent });
      emitRunCompleted(
        buildRunCompletedPayload({ circuitJson: circuitJsonFileParsedContent })
      );
      props.onRenderFinished?.({ circuitJson: circuitJsonFileParsedContent });
    } else if (circuitJsonFileError) {
      setCircuitJson(null);
      setError({ error: circuitJsonFileError, stack: "" });
      const error2 = new Error(circuitJsonFileError);
      props.onError?.(error2);
      emitRunCompleted(buildRunCompletedPayload({ executionError: error2 }));
    }
  }, [
    isStaticCircuitJson,
    circuitJsonFileParsedContent,
    circuitJsonFileError,
    props.isLoadingFiles
  ]);
  useEffect(() => {
    if (isStaticCircuitJson || props.isLoadingFiles) {
      autoroutingCaptureGeneration.current += 1;
      cancelExecutionRef.current?.();
      cancelExecutionRef.current = null;
      setIsRunning(false);
      setActiveAsyncEffects({});
      if (props.isLoadingFiles) setCircuitJson(null);
      return;
    }
    const fsMapObj = fsMap instanceof Map ? Object.fromEntries(fsMap.entries()) : fsMap;
    if (!fsMapObj || Object.keys(fsMapObj).length === 0) {
      setCircuitJson(null);
      setError({
        error: "No files provided. Please provide at least one file with code to execute.",
        stack: ""
      });
      setIsRunning(false);
      return;
    }
    const wasTriggeredByRunButton = runCountTrigger !== lastRunCountTriggerRef.current;
    if (lastFsMapRef.current && circuitJson) {
      const changes = getChangesBetweenFsMaps(lastFsMapRef.current, fsMap);
      if (Object.keys(changes).length > 0) {
        debug("code changes detected");
      } else if (lastEntrypointRef.current !== props.entrypoint) {
        debug("render triggered by entrypoint change");
      } else if (!wasTriggeredByRunButton) {
        debug("render triggered without changes to fsMap, skipping");
        return;
      }
    }
    if (props.showRunButton && runCountTrigger === lastRunCountTriggerRef.current) {
      return;
    }
    lastFsMapRef.current = fsMap;
    lastEntrypointRef.current = props.entrypoint ?? null;
    lastRunCountTriggerRef.current = runCountTrigger;
    setIsRunning(true);
    let cancelled = false;
    const captureGeneration = ++autoroutingCaptureGeneration.current;
    const isCurrentRun = () => componentActiveRef.current && !cancelled && captureGeneration === autoroutingCaptureGeneration.current;
    let renderResult;
    const runWorker = async () => {
      if (!isCurrentRun()) return;
      debug("running render worker");
      setError(null);
      setRenderLog(null);
      setActiveAsyncEffects({});
      setSolverEvents([]);
      setAutoroutingPhases([]);
      const renderLog2 = { progress: 0, debugOutputs: [] };
      cancelExecutionRef.current = () => {
        cancelled = true;
      };
      const { worker, evalVersion: resolvedEvalVersion } = await getWorker();
      if (!isCurrentRun()) return;
      debug("resolvedEvalVersion", resolvedEvalVersion);
      globalThis.runFrameWorker = worker;
      setLastRunEvalVersion(resolvedEvalVersion);
      await worker.clearEventListeners();
      if (!isCurrentRun()) return;
      if (currentDebugOption?.trim()) {
        worker.enableDebug(currentDebugOption.replace("DEBUG=", ""));
      }
      debug("Starting render...");
      props.onRenderStarted?.();
      const fsMapObj2 = fsMap instanceof Map ? Object.fromEntries(fsMap.entries()) : fsMap;
      let lastRenderLogSet = Date.now();
      worker.on("asyncEffect:start", (event) => {
        const id = `${event.phase}|${event.componentDisplayName ?? ""}|${event.effectName}`;
        setActiveAsyncEffects((effects) => ({
          ...effects,
          [id]: { ...event, startTime: Date.now() }
        }));
      });
      worker.on("asyncEffect:end", (event) => {
        const id = `${event.phase}|${event.componentDisplayName ?? ""}|${event.effectName}`;
        setActiveAsyncEffects((effects) => {
          const { [id]: _removed, ...rest } = effects;
          return rest;
        });
      });
      let phaseCaptures = [];
      const capturePhase = (event) => {
        if (cancelled || captureGeneration !== autoroutingCaptureGeneration.current)
          return;
        phaseCaptures = captureAutoroutingPhase(phaseCaptures, event);
        setAutoroutingPhases(phaseCaptures);
      };
      worker.on(
        "autorouting:end",
        (event) => capturePhase({ ...event, type: "autorouting:end" })
      );
      worker.on(
        "autorouting:error",
        (event) => capturePhase({ ...event, type: "autorouting:error" })
      );
      worker.on("autorouting:start", (event) => {
        capturePhase({ ...event, type: "autorouting:start" });
        setAutoroutingLog({
          ...autoroutingLog,
          [event.componentDisplayName]: {
            simpleRouteJson: event.simpleRouteJson,
            createdAt: Date.now()
          }
        });
      });
      worker.on("solver:started", (event) => {
        debug("solver:started", event);
        setSolverEvents((prev) => {
          const id = `${event.componentName}-${event.solverName}`;
          const exists = prev.some(
            (e) => `${e.componentName}-${e.solverName}` === id
          );
          if (exists) return prev;
          return [...prev, event];
        });
      });
      worker.on("board:renderPhaseStarted", (event) => {
        renderLog2.lastRenderEvent = event;
        renderLog2.eventsProcessed = (renderLog2.eventsProcessed ?? 0) + 1;
        const hasProcessedEnoughToEstimateProgress = renderLog2.eventsProcessed > 2;
        const estProgressLinear = orderedRenderPhases2.indexOf(event.phase) / numRenderPhases * 0.75 + renderLog2.eventsProcessed / 1e3 * 0.25;
        const estProgress = 1 - Math.exp(-estProgressLinear * 3);
        renderLog2.progress = estProgress;
        if (!cancelled) {
          setRenderLog({ ...renderLog2 });
        }
      });
      if (activeTab === "render_log") {
        worker.on("renderable:renderLifecycle:anyEvent", (event) => {
          renderLog2.renderEvents = renderLog2.renderEvents ?? [];
          event.createdAt = Date.now();
          renderLog2.renderEvents.push(event);
          if (Date.now() - lastRenderLogSet > 500) {
            renderLog2.phaseTimings = getPhaseTimingsFromRenderEvents(
              renderLog2.renderEvents ?? []
            );
            lastRenderLogSet = Date.now();
          }
          if (!cancelled) {
            setRenderLog({ ...renderLog2 });
          }
        });
      }
      worker.on("autorouting:progress", (event) => {
        setAutoroutingGraphics(event.debugGraphics);
      });
      worker.on("debug:logOutput", (event) => {
        renderLog2.debugOutputs = renderLog2.debugOutputs ?? [];
        renderLog2.debugOutputs.push({
          type: "debug",
          name: event.name,
          content: event.content
        });
        if (!cancelled) {
          setRenderLog({ ...renderLog2 });
        }
      });
      debug("Executing fsMap...");
      await worker.executeWithFsMap({
        entrypoint: props.entrypoint,
        fsMap: fsMapObj2,
        ...props.mainComponentPath ? { mainComponentPath: props.mainComponentPath } : {}
      });
      if (!isCurrentRun()) return;
      debug("worker call started");
      const settlement = worker.renderUntilSettled().then(
        () => ({ success: true }),
        (error2) => ({ success: false, error: error2 })
      );
      renderResult = settlement;
      debug("waiting for initial circuit json...");
      let circuitJson2 = await worker.getCircuitJson();
      if (!isCurrentRun()) return;
      if (!circuitJson2) throw new Error("Eval worker returned no Circuit JSON");
      debug("got initial circuit json");
      setCircuitJson(circuitJson2);
      props.onCircuitJsonChange?.(circuitJson2);
      props.onInitialRender?.({ circuitJson: circuitJson2 });
      const settled = await settlement;
      if (!isCurrentRun()) return;
      if (!settled.success) throw settled.error;
      debug("getting final circuit json");
      circuitJson2 = await worker.getCircuitJson();
      if (!isCurrentRun()) return;
      props.onCircuitJsonChange?.(circuitJson2);
      setCircuitJson(circuitJson2);
      emitRunCompleted(buildRunCompletedPayload({ circuitJson: circuitJson2 }));
      props.onRenderFinished?.({ circuitJson: circuitJson2 });
      setAutoroutingGraphics({});
      if (activeTab === "render_log") {
        renderLog2.phaseTimings = getPhaseTimingsFromRenderEvents(
          renderLog2.renderEvents ?? []
        );
      }
      renderLog2.progress = 1;
      if (!cancelled) {
        setRenderLog({ ...renderLog2 });
      }
      setIsRunning(false);
      setActiveAsyncEffects({});
      setCurrentDebugOption("");
      cancelExecutionRef.current = null;
    };
    void runMutex.runWithMutex(async () => {
      try {
        await runWorker();
      } finally {
        await renderResult;
      }
    }).catch((failure) => {
      if (!isCurrentRun()) return;
      const error2 = failure instanceof Error ? failure : new Error(String(failure));
      debug("worker execution failed", error2);
      props.onError?.(error2);
      emitRunCompleted(buildRunCompletedPayload({ executionError: error2 }));
      setCircuitJson(null);
      setError({
        error: error2.message.replace("Error: ", ""),
        stack: error2.stack
      });
      setRenderLog(null);
      setIsRunning(false);
      setActiveAsyncEffects({});
      setCurrentDebugOption("");
      cancelExecutionRef.current = null;
    });
  }, [
    props.fsMap,
    props.entrypoint,
    runCountTrigger,
    props.evalVersion,
    props.mainComponentPath,
    props.isLoadingFiles,
    currentDebugOption,
    isStaticCircuitJson
  ]);
  const lastEditEventRef = useRef2(null);
  const dragTimeout = useRef2(null);
  const handleEditEvent = (event) => {
    if (!event || event === null) {
      console.warn(
        "[RunFrame] handleEditEvent received null or undefined event."
      );
      return;
    }
    if (event.in_progress) {
      lastEditEventRef.current = event;
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current);
        dragTimeout.current = null;
      }
    } else {
      if (dragTimeout.current) {
        clearTimeout(dragTimeout.current);
      }
      dragTimeout.current = setTimeout(() => {
        const eventToSend = event || lastEditEventRef.current;
        props.onEditEvent?.(eventToSend);
        lastEditEventRef.current = null;
        dragTimeout.current = null;
      }, 100);
    }
  };
  const handleReportAutoroutingLog = async (name, data) => {
    let urlPath = "";
    const softwareMetadata = Array.isArray(circuitJson) && circuitJson.find(
      (el) => el.type === "software_project_metadata"
    );
    const projectUrl = props.projectUrl ?? softwareMetadata?.project_url;
    if (projectUrl) {
      try {
        urlPath = new URL(projectUrl).pathname;
      } catch {
        urlPath = projectUrl;
      }
    }
    const title = urlPath ? `${urlPath} - ${name}` : name;
    await registryKy.post("autorouting/bug_reports/create", {
      json: {
        title,
        simple_route_json: data.simpleRouteJson
      }
    }).json().then(({ autorouting_bug_report }) => {
      window.open(
        `https://api.tscircuit.com/autorouting/bug_reports/view?autorouting_bug_report_id=${autorouting_bug_report.autorouting_bug_report_id}`,
        "_blank"
      );
    }).catch((error2) => {
      console.error("Failed to report autorouting bug", error2);
      const isUnauthorized = error2 instanceof HTTPError && error2.response?.status === 401;
      const isPayloadTooLarge = error2 instanceof HTTPError && error2.response?.status === 413;
      if (isUnauthorized) {
        if (props.onLoginRequired) {
          props.onLoginRequired();
        } else {
          alert("You must be logged in to report autorouting bugs");
        }
        return;
      }
      if (isPayloadTooLarge) {
        alert(
          "This autorouting log is too large to report online. Download the log and attach it to a GitHub issue."
        );
        return;
      }
      const message = error2 instanceof Error ? error2.message : "Failed to report autorouting bug";
      alert(`Failed to report autorouting bug: ${message}`);
    });
  };
  if (props.isLoadingFiles) {
    return /* @__PURE__ */ jsx3(LoadingSkeleton, {});
  }
  return /* @__PURE__ */ jsx3(
    ErrorBoundary,
    {
      onError: (_error, info) => {
        setComponentStack(info.componentStack ?? null);
      },
      onReset: () => setComponentStack(null),
      fallbackRender: (fallbackProps) => /* @__PURE__ */ jsx3(
        RunFrameErrorFallback,
        {
          ...fallbackProps,
          componentStack
        }
      ),
      children: /* @__PURE__ */ jsx3(
        CircuitJsonPreview,
        {
          platformConfig: props.platformConfig,
          code: fsMap.get(props.entrypoint ?? props.mainComponentPath ?? ""),
          fsMap,
          defaultActiveTab: props.defaultActiveTab ?? props.defaultTab,
          defaultTab: props.defaultTab,
          availableTabs: props.availableTabs,
          schematicSvgOptions: props.schematicSvgOptions,
          showToggleFullScreen: props.showToggleFullScreen,
          autoroutingGraphics,
          autoroutingLog,
          onReportAutoroutingLog: props.onReportAutoroutingLog || handleReportAutoroutingLog,
          leftHeaderContent: /* @__PURE__ */ jsxs3(Fragment, { children: [
            props.showRunButton && /* @__PURE__ */ jsx3(TooltipProvider, { children: /* @__PURE__ */ jsxs3(Tooltip, { children: [
              /* @__PURE__ */ jsx3(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsxs3("div", { className: "rf-relative rf-inline-flex", children: [
                /* @__PURE__ */ jsxs3(
                  "button",
                  {
                    type: "button",
                    onClick: () => {
                      incRunCountTrigger(1);
                    },
                    className: "rf-flex rf-items-center rf-gap-2 rf-px-4 rf-py-2 rf-bg-blue-600 hover:rf-bg-blue-700 rf-text-white rf-rounded-md disabled:rf-opacity-50 transition-colors duration-200",
                    disabled: isRunning || !dependenciesLoaded,
                    children: [
                      "Run",
                      " ",
                      isRunning || !dependenciesLoaded ? /* @__PURE__ */ jsx3(Loader2, { className: "rf-w-3 rf-h-3 rf-animate-spin" }) : /* @__PURE__ */ jsx3(Play, { className: "rf-w-3 rf-h-3" })
                    ]
                  }
                ),
                isRunning && /* @__PURE__ */ jsx3("div", { className: "rf-flex rf-items-center rf-ml-1", children: /* @__PURE__ */ jsx3(
                  Button,
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      setIsRunning(false);
                      setRenderLog(null);
                      setError(null);
                      if (cancelExecutionRef.current) {
                        cancelExecutionRef.current();
                        cancelExecutionRef.current = null;
                      }
                      runMutex.cancel();
                      setActiveAsyncEffects({});
                      if (globalThis.runFrameWorker) {
                        globalThis.runFrameWorker.kill();
                        globalThis.runFrameWorker = null;
                      }
                    },
                    variant: "ghost",
                    size: "icon",
                    className: "rf-text-red-300 hover:rf-text-red-400 hover:!rf-bg-transparent [&>svg]:rf-text-red-300 [&>svg]:hover:rf-text-red-400 rf-flex rf-items-center rf-justify-center",
                    children: /* @__PURE__ */ jsx3(
                      Square,
                      {
                        className: "!rf-h-2.5 !rf-w-2.5",
                        fill: "currentColor",
                        stroke: "currentColor"
                      }
                    )
                  }
                ) })
              ] }) }),
              /* @__PURE__ */ jsx3(
                TooltipContent,
                {
                  sideOffset: 8,
                  className: "rf-p-0 rf-bg-transparent rf-border-none rf-shadow-none rf-pointer-events-none",
                  children: /* @__PURE__ */ jsxs3("div", { className: "rf-flex rf-items-center rf-gap-2 rf-px-2.5 rf-py-1.5 rf-bg-slate-900 rf-rounded-md rf-shadow-xl rf-border rf-border-slate-800/60", children: [
                    /* @__PURE__ */ jsx3("kbd", { className: "rf-bg-slate-800 rf-px-1.5 rf-py-0.5 rf-rounded rf-text-[10px] rf-font-sans rf-font-medium rf-border rf-border-slate-700 rf-text-slate-200 rf-leading-none", children: "Ctrl" }),
                    /* @__PURE__ */ jsx3("span", { className: "rf-text-slate-500 rf-text-[11px] rf-font-medium rf-leading-none", children: "+" }),
                    /* @__PURE__ */ jsx3("kbd", { className: "rf-bg-slate-800 rf-px-1.5 rf-py-0.5 rf-rounded rf-text-[10px] rf-font-sans rf-font-medium rf-border rf-border-slate-700 rf-text-slate-200 rf-leading-none", children: "Enter" })
                  ] })
                }
              )
            ] }) }),
            props.showFileMenu !== false && /* @__PURE__ */ jsx3(
              FileMenuLeftHeader,
              {
                isWebEmbedded: props.isWebEmbedded,
                onLoginRequired: props.onLoginRequired,
                showSchematicDebugGrid,
                onChangeShowSchematicDebugGrid: setShowSchematicDebugGrid,
                showSchematicPorts,
                onChangeShowSchematicPorts: setShowSchematicPorts,
                autoroutingLog,
                onReportAutoroutingLog: props.onReportAutoroutingLog || handleReportAutoroutingLog,
                shouldLoadLatestEval: props.shouldLoadLatestEval,
                onChangeShouldLoadLatestEval: props.onChangeShouldLoadLatestEval
              }
            ),
            props.leftHeaderContent
          ] }),
          onActiveTabChange: setActiveTab,
          circuitJson,
          renderLog,
          activeEffectName,
          isRunningCode: isRunning,
          errorMessage: error?.error,
          errorStack: error?.stack,
          onEditEvent: handleEditEvent,
          editEvents: props.editEvents,
          onPcbBoundsSelected: props.onPcbBoundsSelected,
          defaultToFullScreen: props.defaultToFullScreen,
          onRerunWithDebug: (debugOption) => {
            setCurrentDebugOption(debugOption || "");
            incRunCountTrigger(1);
          },
          solverEvents,
          autoroutingPhases: isStaticCircuitJson ? [] : autoroutingPhases,
          isCli: props.isCli,
          showSchematicDebugGrid,
          showSchematicPorts,
          onChangeShowSchematicDebugGrid: setShowSchematicDebugGrid,
          onChangeShowSchematicPorts: setShowSchematicPorts
        }
      )
    }
  );
};

// lib/components/RunFrameWithApi/RunFrameWithApi.tsx
import { applyEditEventsToManualEditsFile } from "@tscircuit/core";
import Debug3 from "debug";

// lib/hooks/use-edit-event-controller.ts
import { useState as useState2, useCallback as useCallback2, useEffect as useEffect2 } from "react";
var debug2 = debug_default.extend("useEditEventController");
var useEditEventController = () => {
  const applyEditEventsAndUpdateManualEditsJson = useRunFrameStore(
    (s) => s.applyEditEventsAndUpdateManualEditsJson
  );
  const [editEvents, setEditEvents] = useState2([]);
  const [isRendering, setIsRendering] = useState2(false);
  const unappliedEditEvents = editEvents.filter((ee) => !ee._applied);
  const appliedEditEvents = editEvents.filter((ee) => ee._applied);
  const editEventsForRender = isRendering ? editEvents : unappliedEditEvents;
  const pushEditEvent = useCallback2((ee) => {
    setEditEvents((prev) => [...prev, { ...ee, _applied: false }]);
  }, []);
  const markEditEventApplied = useCallback2((ee) => {
    setEditEvents(
      (prev) => prev.map(
        (event) => event === ee ? { ...event, _applied: true } : event
      )
    );
  }, []);
  const markAllEditEventsApplied = useCallback2(() => {
    setEditEvents((prev) => prev.map((ee) => ({ ...ee, _applied: true })));
  }, []);
  const markRenderStarted = useCallback2(() => {
    setIsRendering(true);
    if (editEvents.length === 0) return;
    debug2("removing edit events that are applied");
    setEditEvents((prev) => prev.filter((ee) => !ee._applied));
  }, [editEvents]);
  const markRenderComplete = useCallback2(() => {
    setIsRendering(false);
  }, []);
  useEffect2(() => {
    if (editEvents.filter((ee) => !ee._applied).length === 0) return;
    const timeout = setTimeout(() => {
      markAllEditEventsApplied();
      applyEditEventsAndUpdateManualEditsJson(
        editEvents
        //.filter((ee) => !ee._applied),
      );
    }, 1e3);
    return () => clearTimeout(timeout);
  }, [editEvents]);
  return {
    unappliedEditEvents,
    appliedEditEvents,
    editEventsForRender,
    pushEditEvent,
    markEditEventApplied,
    markRenderStarted,
    markRenderComplete,
    markAllEditEventsApplied
  };
};

// lib/hooks/use-has-received-initial-files-loaded.ts
import { useState as useState3, useEffect as useEffect3 } from "react";
import Debug2 from "debug";
var debug3 = Debug2("run-frame:useHasReceivedInitialFilesLoaded");
var useHasReceivedInitialFilesLoaded = () => {
  const [hasReceived, setHasReceived] = useState3(false);
  const recentEvents = useRunFrameStore((s) => s.recentEvents);
  const loadInitialFiles = useRunFrameStore((s) => s.loadInitialFiles);
  useEffect3(() => {
    const initialize = async () => {
      await loadInitialFiles();
      try {
        const res = await fetch(
          `${API_BASE}/events/list?event_type=INITIAL_FILES_UPLOADED`
        );
        if (res.ok) {
          const { event_list } = await res.json();
          if (event_list.length > 0) {
            debug3("INITIAL_FILES_UPLOADED found in history. Assuming ready.");
            setHasReceived(true);
            return;
          }
        }
      } catch (e) {
        console.error("Failed to check for event history", e);
      }
      debug3("No INITIAL_FILES_UPLOADED in history, waiting for polling.");
    };
    initialize();
  }, [loadInitialFiles]);
  useEffect3(() => {
    if (hasReceived) return;
    if (recentEvents.some((e) => e.event_type === "INITIAL_FILES_UPLOADED")) {
      debug3("INITIAL_FILES_UPLOADED received via polling. Assuming ready.");
      setHasReceived(true);
    }
  }, [recentEvents, hasReceived]);
  return hasReceived;
};

// lib/hooks/use-sync-page-title.ts
import { useEffect as useEffect4 } from "react";
var useSyncPageTitle = () => {
  const fsMap = useRunFrameStore((s) => s.fsMap);
  useEffect4(() => {
    if (!document || !fsMap) return;
    const fileKeys = Array.from(fsMap.keys());
    const entrypoint = guessEntrypoint(fileKeys);
    const packageJsonContent = fsMap.get("package.json");
    try {
      if (packageJsonContent) {
        const parsedPackageJson = JSON.parse(packageJsonContent);
        if (parsedPackageJson?.name) {
          document.title = parsedPackageJson.name;
          return;
        }
      }
    } catch (e) {
    }
    if (entrypoint) {
      document.title = entrypoint;
    }
  }, [fsMap]);
};

// lib/components/RunFrameWithApi/RunFrameWithApi.tsx
import { useCallback as useCallback4, useEffect as useEffect7, useMemo as useMemo5, useState as useState6 } from "react";

// lib/utils/get-board-files-from-config.ts
import { projectConfig } from "@tscircuit/props";
import { Minimatch } from "minimatch";
var DEFAULT_BOARD_FILE_FILTER = (filename) => (filename.endsWith(".tsx") || filename.endsWith(".ts") || filename.endsWith(".jsx") || filename.endsWith(".js") || isCircuitJsonFile(filename)) && !filename.endsWith(".d.ts");
var parseProjectConfig = (configContent) => {
  if (!configContent) return null;
  try {
    const parsedJson = JSON.parse(configContent);
    return projectConfig.parse(parsedJson);
  } catch (error) {
    console.warn("Failed to parse tscircuit.config.json", error);
    return null;
  }
};
var getBoardFilesFromConfig = (files, configContent) => {
  const parsedConfig = parseProjectConfig(configContent);
  const includeBoardFiles = parsedConfig?.includeBoardFiles?.filter(Boolean);
  if (includeBoardFiles && includeBoardFiles.length > 0) {
    const matchers = includeBoardFiles.map(
      (pattern) => new Minimatch(pattern, { dot: true })
    );
    return files.filter(
      (file) => matchers.some((matcher) => matcher.match(file))
    );
  }
  return files.filter(DEFAULT_BOARD_FILE_FILTER);
};

// lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox/EnhancedFileSelectorCombobox.tsx
import {
  ArrowUp,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Code,
  File,
  FileText,
  Folder,
  Save
} from "lucide-react";
import { useCallback as useCallback3, useEffect as useEffect6, useMemo as useMemo4, useRef as useRef3, useState as useState5 } from "react";

// lib/components/ui/command.tsx
import * as React from "react";
import "@radix-ui/react-dialog";
import { Command as CommandPrimitive } from "cmdk";
import { Search } from "lucide-react";
import { jsx as jsx4, jsxs as jsxs4 } from "react/jsx-runtime";
var Command = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx4(
  CommandPrimitive,
  {
    ref,
    className: cn(
      "rf-flex rf-h-full rf-w-full rf-flex-col rf-overflow-hidden rf-rounded-md rf-bg-white rf-text-zinc-950 dark:rf-bg-zinc-950 dark:rf-text-zinc-50",
      className
    ),
    ...props
  }
));
Command.displayName = CommandPrimitive.displayName;
var CommandInput = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs4(
  "div",
  {
    className: "rf-flex rf-items-center rf-border-b rf-px-3",
    "cmdk-input-wrapper": "",
    children: [
      /* @__PURE__ */ jsx4(Search, { className: "rf-mr-2 rf-h-4 rf-w-4 rf-shrink-0 rf-opacity-50" }),
      /* @__PURE__ */ jsx4(
        CommandPrimitive.Input,
        {
          ref,
          className: cn(
            "rf-flex rf-h-10 rf-w-full rf-rounded-md rf-bg-transparent rf-py-3 rf-text-sm rf-outline-none placeholder:rf-text-zinc-500 disabled:rf-cursor-not-allowed disabled:rf-opacity-50 dark:placeholder:rf-text-zinc-400",
            className
          ),
          ...props
        }
      )
    ]
  }
));
CommandInput.displayName = CommandPrimitive.Input.displayName;
var CommandList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx4(
  CommandPrimitive.List,
  {
    ref,
    className: cn(
      "rf-max-h-[300px] rf-overflow-y-auto rf-overflow-x-hidden rf-py-1",
      className
    ),
    ...props
  }
));
CommandList.displayName = CommandPrimitive.List.displayName;
var CommandEmpty = React.forwardRef((props, ref) => /* @__PURE__ */ jsx4(
  CommandPrimitive.Empty,
  {
    ref,
    className: "rf-py-6 rf-text-center rf-text-sm",
    ...props
  }
));
CommandEmpty.displayName = CommandPrimitive.Empty.displayName;
var CommandGroup = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx4(
  CommandPrimitive.Group,
  {
    ref,
    className: cn(
      "rf-overflow-hidden rf-px-1 rf-py-0 rf-text-zinc-950 [&_[cmdk-group-heading]]:rf-px-2 [&_[cmdk-group-heading]]:rf-py-1.5 [&_[cmdk-group-heading]]:rf-text-xs [&_[cmdk-group-heading]]:rf-font-medium [&_[cmdk-group-heading]]:rf-text-zinc-500 dark:rf-text-zinc-50 dark:[&_[cmdk-group-heading]]:rf-text-zinc-400",
      className
    ),
    ...props
  }
));
CommandGroup.displayName = CommandPrimitive.Group.displayName;
var CommandSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx4(
  CommandPrimitive.Separator,
  {
    ref,
    className: cn(
      "rf--mx-1 rf-h-px rf-bg-zinc-200 dark:rf-bg-zinc-800",
      className
    ),
    ...props
  }
));
CommandSeparator.displayName = CommandPrimitive.Separator.displayName;
var CommandItem = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx4(
  CommandPrimitive.Item,
  {
    ref,
    className: cn(
      "rf-relative rf-flex rf-cursor-default rf-gap-2 rf-select-none rf-items-center rf-rounded-sm rf-px-2 rf-py-1.5 rf-text-sm rf-outline-none data-[disabled=true]:rf-pointer-events-none data-[selected=true]:rf-bg-zinc-100 data-[selected=true]:rf-text-zinc-900 data-[disabled=true]:rf-opacity-50 [&_svg]:rf-pointer-events-none [&_svg]:rf-size-4 [&_svg]:rf-shrink-0 dark:data-[selected=true]:rf-bg-zinc-800 dark:data-[selected=true]:rf-text-zinc-50",
      className
    ),
    ...props
  }
));
CommandItem.displayName = CommandPrimitive.Item.displayName;
var CommandShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ jsx4(
    "span",
    {
      className: cn(
        "rf-ml-auto rf-text-xs rf-tracking-widest rf-text-zinc-500 dark:rf-text-zinc-400",
        className
      ),
      ...props
    }
  );
};
CommandShortcut.displayName = "CommandShortcut";

// lib/components/ui/popover.tsx
import * as React2 from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { jsx as jsx5 } from "react/jsx-runtime";
var Popover = PopoverPrimitive.Root;
var PopoverTrigger = PopoverPrimitive.Trigger;
var PopoverContent = React2.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx5(PopoverPrimitive.Portal, { children: /* @__PURE__ */ jsx5(
  PopoverPrimitive.Content,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "rf-z-50 rf-w-72 rf-rounded-md rf-border rf-border-zinc-200 rf-bg-white rf-p-4 rf-text-zinc-950 rf-shadow-md rf-outline-none data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[side=bottom]:rf-slide-in-from-top-2 data-[side=left]:rf-slide-in-from-right-2 data-[side=right]:rf-slide-in-from-left-2 data-[side=top]:rf-slide-in-from-bottom-2 rf-origin-[--radix-popover-content-transform-origin] dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:rf-text-zinc-50",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

// lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox/naturalSort.ts
function naturalSort(a, b) {
  const extA = a.lastIndexOf(".");
  const extB = b.lastIndexOf(".");
  const baseA = extA > 0 ? a.substring(0, extA) : a;
  const baseB = extB > 0 ? b.substring(0, extB) : b;
  if (baseA !== baseB && a.substring(extA) === b.substring(extB)) {
    if (baseA.startsWith(baseB)) {
      return 1;
    }
    if (baseB.startsWith(baseA)) {
      return -1;
    }
  }
  return a.localeCompare(b, void 0, { numeric: true, sensitivity: "base" });
}

// lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox/parseFilesToTree.ts
function parseFilesToTree(files) {
  const root = [];
  const nodeMap = /* @__PURE__ */ new Map();
  nodeMap.set("", { name: "", path: "", type: "folder", children: root });
  for (const filePath of files) {
    const parts = filePath.split("/");
    let currentPath = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      if (!nodeMap.has(currentPath)) {
        const isFile = i === parts.length - 1;
        const node = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: isFile ? void 0 : []
        };
        nodeMap.set(currentPath, node);
        const parent = nodeMap.get(parentPath);
        if (parent && parent.children) {
          parent.children.push(node);
        }
      }
    }
  }
  return root;
}
function findNode(nodes, path) {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNode(node.children, path);
      if (found) return found;
    }
  }
  return null;
}
function getCurrentFolderContents(tree, currentFolder) {
  let targetNode;
  if (!currentFolder) {
    targetNode = { name: "", path: "", type: "folder", children: tree };
  } else {
    targetNode = findNode(tree, currentFolder);
  }
  if (!targetNode || !targetNode.children) {
    return { files: [], folders: [] };
  }
  const files = targetNode.children.filter((node) => node.type === "file");
  const folders = targetNode.children.filter((node) => node.type === "folder");
  files.sort((a, b) => naturalSort(a.name, b.name));
  folders.sort((a, b) => naturalSort(a.name, b.name));
  return { files, folders };
}

// lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox/getFilePickerDisplayName.ts
var getFilePickerDisplayName = (filename) => {
  const basename = filename.split("/").pop() || "";
  if (basename.endsWith(".py.tsx")) {
    return basename.slice(0, -".tsx".length);
  }
  return basename;
};

// lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox/useCurrentFolder.ts
import { useState as useState4, useEffect as useEffect5 } from "react";
function getDirectoryPath(filePath) {
  const lastSlashIndex = filePath.lastIndexOf("/");
  if (lastSlashIndex === -1) return "/";
  return filePath.substring(0, lastSlashIndex);
}
function useCurrentFolder({
  currentFile,
  files
}) {
  const [hasManuallyNavigated, setHasManuallyNavigated] = useState4(false);
  const [currentFolder, setCurrentFolder] = useState4(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.slice(1));
      const urlFile = searchParams.get("file") ?? hashParams.get("file");
      if (urlFile && files.includes(urlFile)) {
        const fileDir = getDirectoryPath(urlFile);
        return fileDir === "/" ? null : fileDir;
      }
    }
    if (currentFile && files.includes(currentFile)) {
      const fileDir = getDirectoryPath(currentFile);
      return fileDir === "/" ? null : fileDir;
    }
    return null;
  });
  useEffect5(() => {
    if (currentFile && !hasManuallyNavigated && files.includes(currentFile)) {
      const fileDir = getDirectoryPath(currentFile);
      setCurrentFolder(fileDir === "/" ? null : fileDir);
    }
  }, [currentFile, hasManuallyNavigated, files]);
  const navigateToFolder = (folderPath) => {
    setCurrentFolder(folderPath);
    setHasManuallyNavigated(true);
  };
  const resetManualNavigation = () => {
    setHasManuallyNavigated(false);
  };
  return {
    currentFolder,
    navigateToFolder,
    resetManualNavigation
  };
}

// lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox/EnhancedFileSelectorCombobox.tsx
import { Fragment as Fragment2, jsx as jsx6, jsxs as jsxs5 } from "react/jsx-runtime";
var defaultFileIcon = (fileName) => {
  if (fileName.endsWith(".tsx") || fileName.endsWith(".jsx")) {
    return /* @__PURE__ */ jsx6(Code, { className: "rf-h-4 rf-w-4 rf-text-blue-500" });
  }
  if (fileName.endsWith(".md") || fileName.endsWith(".txt")) {
    return /* @__PURE__ */ jsx6(FileText, { className: "rf-h-4 rf-w-4 rf-text-gray-600" });
  }
  return /* @__PURE__ */ jsx6(File, { className: "rf-h-4 rf-w-4 rf-text-gray-500" });
};
var defaultFileFilter = (filename) => {
  return filename.endsWith(".tsx") || isCircuitJsonFile(filename) || filename.endsWith(".jsx");
};
var defaultDisplayName = (filename) => {
  return getFilePickerDisplayName(filename);
};
var getDirectoryPath2 = (filePath) => {
  return filePath.substring(0, filePath.lastIndexOf("/")) || "/";
};
var EnhancedFileSelectorCombobox = ({
  files,
  onFileChange,
  currentFile,
  fileFilter = defaultFileFilter,
  getDisplayName = defaultDisplayName,
  placeholder = "Select file",
  searchPlaceholder = "Search for file",
  emptyMessage = "No files found in this directory.",
  pinnedFiles = [],
  onToggleFavorite,
  recentlySavedFiles = []
}) => {
  const [open, setOpen] = useState5(false);
  const [file, setFile] = useState5(currentFile);
  const { currentFolder, navigateToFolder, resetManualNavigation } = useCurrentFolder({ currentFile: file, files });
  const [currentFileIndex, setCurrentFileIndex] = useState5(0);
  const [searchValue, setSearchValue] = useState5("");
  const [recentlyViewedFiles, setRecentlyViewedFiles] = useLocalStorageState("runframe:recentlyViewed", []);
  const [showRecents, setShowRecents] = useLocalStorageState(
    "runframe:showRecents",
    false
  );
  useEffect6(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  const filteredFiles = files.filter(fileFilter);
  const debounceTimerRef = useRef3(null);
  useEffect6(() => {
    const clearDebounceTimer = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
    setFile(currentFile);
    if (currentFile && filteredFiles.includes(currentFile)) {
      clearDebounceTimer();
      debounceTimerRef.current = setTimeout(() => {
        setRecentlyViewedFiles((prev) => {
          if (prev[0] === currentFile) return prev;
          const filtered = prev.filter((f) => f !== currentFile);
          return [currentFile, ...filtered].slice(0, 10);
        });
      }, 500);
    }
    return clearDebounceTimer;
  }, [currentFile, filteredFiles, setRecentlyViewedFiles]);
  const fileTree = parseFilesToTree(filteredFiles);
  const { files: currentFiles, folders: currentFolders } = getCurrentFolderContents(fileTree, currentFolder || "");
  const getSearchResults = () => {
    if (!searchValue.trim()) return { currentDirResults: [], globalResults: [] };
    const searchTerm = searchValue.toLowerCase();
    const allFiles = filteredFiles.map((path) => {
      const fileName = path.split("/").pop() || "";
      return { path, fileName };
    });
    const matchingFiles = allFiles.filter(
      (file2) => file2.fileName.toLowerCase().includes(searchTerm) || file2.path.toLowerCase().includes(searchTerm)
    );
    const currentDirResults = matchingFiles.filter((file2) => {
      if (!currentFolder) {
        return !file2.path.includes("/");
      }
      const fileDir = file2.path.substring(0, file2.path.lastIndexOf("/"));
      return fileDir === currentFolder;
    });
    const globalResults = matchingFiles.filter((file2) => {
      if (!currentFolder) {
        return file2.path.includes("/");
      }
      const fileDir = file2.path.substring(0, file2.path.lastIndexOf("/"));
      return fileDir !== currentFolder;
    });
    return { currentDirResults, globalResults };
  };
  const searchResults = getSearchResults();
  const isSearching = searchValue.trim().length > 0;
  const handleNavigateToFolder = (folderPath) => {
    navigateToFolder(folderPath);
    setCurrentFileIndex(0);
  };
  const navigateUp = useCallback3(() => {
    if (!currentFolder) return;
    const lastSlashIndex = currentFolder.lastIndexOf("/");
    const parentPath = lastSlashIndex === -1 ? null : currentFolder.substring(0, lastSlashIndex);
    handleNavigateToFolder(parentPath);
  }, [currentFolder, handleNavigateToFolder]);
  useEffect6(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowUp") {
        e.preventDefault();
        navigateUp();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, navigateUp]);
  const selectFile = useCallback3(
    (filePath, index, updateFolder = false) => {
      setFile(filePath);
      setCurrentFileIndex(index);
      setOpen(false);
      onFileChange(filePath);
      if (updateFolder) {
        const lastSlashIndex = filePath.lastIndexOf("/");
        const fileDir = lastSlashIndex === -1 ? null : filePath.substring(0, lastSlashIndex);
        handleNavigateToFolder(fileDir);
      }
    },
    [onFileChange, handleNavigateToFolder]
  );
  useEffect6(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        e.preventDefault();
        if (!currentFile || currentFiles.length === 0) return;
        const currentIndex = currentFiles.findIndex(
          (f) => f.path === currentFile
        );
        if (currentIndex === -1) return;
        let newIndex;
        if (e.key === "ArrowLeft") {
          newIndex = currentIndex === 0 ? currentFiles.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex === currentFiles.length - 1 ? 0 : currentIndex + 1;
        }
        const newFile = currentFiles[newIndex];
        if (newFile) {
          selectFile(newFile.path, newIndex);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFile, currentFiles, selectFile]);
  useEffect6(() => {
    if (currentFiles.length > 0) {
      const fileInCurrentFolder = currentFiles.findIndex(
        (f) => f.path === currentFile
      );
      if (fileInCurrentFolder >= 0) {
        setCurrentFileIndex(fileInCurrentFolder);
      }
    }
  }, [currentFiles, currentFile]);
  const recentFiles = useMemo4(() => {
    const validSavedFiles = recentlySavedFiles.filter(
      (file2) => filteredFiles.includes(file2)
    );
    const validViewedFiles = recentlyViewedFiles.filter(
      (file2) => filteredFiles.includes(file2)
    );
    const combinedRecent = [];
    if (validSavedFiles.length > 0) {
      combinedRecent.push({ path: validSavedFiles[0], type: "saved" });
    }
    for (const viewedFile of validViewedFiles) {
      if (combinedRecent.length >= 3) break;
      if (!combinedRecent.some((item) => item.path === viewedFile)) {
        combinedRecent.push({ path: viewedFile, type: "viewed" });
      }
    }
    return combinedRecent;
  }, [recentlySavedFiles, recentlyViewedFiles, filteredFiles]);
  const displayPath = currentFolder ?? "/";
  const shortDisplayPath = displayPath.length > 25 ? "..." + displayPath.slice(-22) : displayPath;
  const getDropdownWidth = () => {
    const maxWidth = isSearching ? "rf-max-w-[600px]" : "rf-max-w-[1000px]";
    return `rf-w-full rf-min-w-[600px] ${maxWidth}`;
  };
  return /* @__PURE__ */ jsx6("div", { className: "rf-flex rf-items-center rf-gap-1", children: /* @__PURE__ */ jsxs5(
    Popover,
    {
      open,
      onOpenChange: (newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          setSearchValue("");
          resetManualNavigation();
        }
      },
      children: [
        /* @__PURE__ */ jsx6(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs5(
          Button,
          {
            variant: "outline",
            role: "combobox",
            "aria-expanded": open,
            className: "rf-w-fit rf-min-w-32 rf-max-w-100 rf-justify-center rf-items-center rf-gap-1 !rf-font-normal",
            children: [
              /* @__PURE__ */ jsx6("span", { className: "rf-truncate rf-text-left", children: file ? getDisplayName(file) : placeholder }),
              /* @__PURE__ */ jsx6(ChevronsUpDown, { className: "rf-opacity-50 rf-flex-shrink-0" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx6(
          PopoverContent,
          {
            className: cn(
              "!rf-p-0 !rf-overflow-y-auto !rf-max-h-[80vh] !rf-z-[200]",
              getDropdownWidth()
            ),
            children: /* @__PURE__ */ jsxs5(Command, { shouldFilter: false, children: [
              /* @__PURE__ */ jsx6(
                CommandInput,
                {
                  placeholder: searchPlaceholder,
                  className: "rf-h-9 rf-w-full",
                  value: searchValue,
                  onValueChange: setSearchValue
                }
              ),
              recentFiles.length > 0 && /* @__PURE__ */ jsxs5("div", { className: "rf-border-b rf-border-gray-200", children: [
                /* @__PURE__ */ jsxs5(
                  "button",
                  {
                    onClick: () => setShowRecents(!showRecents),
                    className: "rf-w-full rf-px-3 rf-py-2 rf-flex rf-items-center rf-justify-between rf-text-xs rf-text-slate-600 hover:rf-bg-slate-50 rf-bg-transparent rf-border-none rf-cursor-pointer",
                    children: [
                      /* @__PURE__ */ jsx6("span", { className: "rf-font-medium", children: "Recent Files" }),
                      /* @__PURE__ */ jsx6(
                        ChevronDown,
                        {
                          className: cn(
                            "rf-h-4 rf-w-4 rf-transition-transform",
                            !showRecents && "-rf-rotate-90"
                          )
                        }
                      )
                    ]
                  }
                ),
                showRecents && /* @__PURE__ */ jsx6("div", { className: "rf-pb-1", children: recentFiles.map((item, index) => /* @__PURE__ */ jsxs5(
                  "div",
                  {
                    onClick: () => selectFile(item.path, index, true),
                    className: cn(
                      "rf-flex rf-items-center rf-px-3 rf-py-1.5 rf-cursor-pointer hover:rf-bg-slate-100",
                      item.path === currentFile && "rf-font-medium"
                    ),
                    children: [
                      item.type === "saved" ? /* @__PURE__ */ jsx6("span", { title: "Recently saved", children: /* @__PURE__ */ jsx6(Save, { className: "rf-mr-2 rf-h-4 rf-w-4 rf-text-green-500" }) }) : /* @__PURE__ */ jsx6("span", { title: "Recently viewed", children: /* @__PURE__ */ jsx6(Clock, { className: "rf-mr-2 rf-h-4 rf-w-4 rf-text-blue-500" }) }),
                      /* @__PURE__ */ jsx6("span", { className: "rf-text-sm", children: getDisplayName(item.path.split("/").pop() || "") }),
                      /* @__PURE__ */ jsx6("span", { className: "rf-text-xs rf-text-muted-foreground rf-ml-2 rf-truncate rf-max-w-[40%]", children: getDirectoryPath2(item.path) }),
                      /* @__PURE__ */ jsx6(
                        Check,
                        {
                          className: cn(
                            "rf-ml-auto rf-h-4 rf-w-4",
                            item.path === currentFile ? "rf-opacity-100" : "rf-opacity-0"
                          )
                        }
                      )
                    ]
                  },
                  item.path
                )) })
              ] }),
              /* @__PURE__ */ jsxs5("div", { className: "rf-px-3 rf-py-2 rf-bg-slate-50 rf-flex rf-items-center rf-justify-between rf-gap-2", children: [
                /* @__PURE__ */ jsx6("div", { className: "rf-flex rf-items-center rf-text-xs rf-text-slate-600 rf-min-w-0 rf-flex-1", children: /* @__PURE__ */ jsxs5("div", { className: "rf-flex rf-items-center rf-min-w-0", children: [
                  /* @__PURE__ */ jsx6(
                    "button",
                    {
                      onClick: () => handleNavigateToFolder(null),
                      className: "rf-text-blue-600 hover:rf-text-blue-800 rf-underline rf-cursor-pointer rf-bg-transparent rf-border-none rf-p-0 rf-flex-shrink-0",
                      children: "root"
                    }
                  ),
                  currentFolder?.split("/").filter(Boolean).map((segment, index, array) => {
                    const pathToSegment = array.slice(0, index + 1).join("/");
                    return /* @__PURE__ */ jsxs5(
                      "span",
                      {
                        className: "rf-flex rf-items-center rf-min-w-0",
                        children: [
                          /* @__PURE__ */ jsx6("span", { className: "rf-mx-1 rf-flex-shrink-0", children: "/" }),
                          index === array.length - 1 ? /* @__PURE__ */ jsx6(
                            "span",
                            {
                              className: "rf-text-slate-800 rf-truncate rf-max-w-[200px]",
                              title: segment,
                              children: segment
                            }
                          ) : /* @__PURE__ */ jsx6(
                            "button",
                            {
                              onClick: () => handleNavigateToFolder(pathToSegment),
                              className: "rf-text-blue-600 hover:rf-text-blue-800 rf-underline rf-cursor-pointer rf-bg-transparent rf-border-none rf-p-0 rf-truncate rf-max-w-[150px]",
                              title: segment,
                              children: segment
                            }
                          )
                        ]
                      },
                      pathToSegment
                    );
                  })
                ] }) }),
                /* @__PURE__ */ jsx6("div", { className: "rf-flex rf-items-center rf-gap-2 rf-flex-shrink-0", children: currentFolder && /* @__PURE__ */ jsxs5(
                  "button",
                  {
                    onClick: navigateUp,
                    className: "rf-flex rf-items-center rf-gap-1 rf-text-slate-600 hover:rf-text-slate-800 rf-bg-transparent rf-border-none rf-p-1 rf-rounded hover:rf-bg-slate-200 rf-transition-colors",
                    title: "Go up one level",
                    children: [
                      /* @__PURE__ */ jsx6(ArrowUp, { className: "rf-h-3 rf-w-3" }),
                      /* @__PURE__ */ jsx6("span", { className: "rf-text-xs rf-font-medium", children: "Up" })
                    ]
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsx6(CommandList, { className: "rf-overflow-visible rf-max-h-none", children: !isSearching ? /* @__PURE__ */ jsxs5(Fragment2, { children: [
                /* @__PURE__ */ jsx6(CommandEmpty, { children: emptyMessage }),
                currentFiles.length > 0 && /* @__PURE__ */ jsx6(CommandGroup, { children: currentFiles.map((fileNode, index) => /* @__PURE__ */ jsxs5(
                  CommandItem,
                  {
                    value: `current:${fileNode.path}`,
                    onSelect: () => selectFile(fileNode.path, index),
                    className: cn(
                      fileNode.path === currentFile && "rf-font-medium",
                      "rf-group"
                    ),
                    children: [
                      /* @__PURE__ */ jsx6("span", { className: "rf-mr-2", children: defaultFileIcon(fileNode.name) }),
                      getDisplayName(fileNode.name),
                      /* @__PURE__ */ jsx6("div", { className: "rf-ml-auto rf-flex rf-items-center rf-gap-1", children: /* @__PURE__ */ jsx6(
                        Check,
                        {
                          className: cn(
                            "rf-h-4 rf-w-4",
                            fileNode.path === currentFile ? "rf-opacity-100" : "rf-opacity-0"
                          )
                        }
                      ) })
                    ]
                  },
                  fileNode.path
                )) }),
                currentFolders.length > 0 && /* @__PURE__ */ jsx6(CommandGroup, { children: currentFolders.map((folderNode) => /* @__PURE__ */ jsxs5(
                  CommandItem,
                  {
                    value: `folder-${folderNode.path}`,
                    onSelect: () => handleNavigateToFolder(folderNode.path),
                    className: "rf-text-slate-600 hover:rf-text-slate-900",
                    children: [
                      /* @__PURE__ */ jsx6(Folder, { className: "rf-mr-2 rf-h-4 rf-w-4 rf-text-blue-600" }),
                      folderNode.name,
                      /* @__PURE__ */ jsx6(ChevronRight, { className: "rf-ml-auto rf-h-4 rf-w-4" })
                    ]
                  },
                  folderNode.path
                )) }),
                currentFiles.length === 0 && currentFolders.length === 0 && /* @__PURE__ */ jsx6("div", { className: "rf-p-4 rf-text-center rf-text-slate-500 rf-text-sm", children: "No files or folders in this directory" })
              ] }) : /* @__PURE__ */ jsx6(Fragment2, { children: searchResults.currentDirResults.length === 0 && searchResults.globalResults.length === 0 ? /* @__PURE__ */ jsxs5(CommandEmpty, { children: [
                'No files found matching "',
                searchValue,
                '".'
              ] }) : /* @__PURE__ */ jsxs5(Fragment2, { children: [
                searchResults.currentDirResults.length > 0 && /* @__PURE__ */ jsx6(CommandGroup, { children: searchResults.currentDirResults.map(
                  (file2, index) => /* @__PURE__ */ jsxs5(
                    CommandItem,
                    {
                      value: `search-current:${file2.path}`,
                      onSelect: () => {
                        setFile(file2.path);
                        setOpen(false);
                        onFileChange(file2.path);
                      },
                      className: cn(
                        file2.path === currentFile && "rf-font-medium",
                        "rf-group"
                      ),
                      children: [
                        /* @__PURE__ */ jsx6("span", { className: "rf-mr-2", children: defaultFileIcon(file2.fileName) }),
                        /* @__PURE__ */ jsxs5("div", { className: "rf-flex rf-items-center rf-w-full rf-min-w-0", children: [
                          /* @__PURE__ */ jsx6("span", { className: "rf-truncate rf-flex-1", children: getDisplayName(file2.fileName) }),
                          /* @__PURE__ */ jsx6("span", { className: "rf-text-xs rf-text-muted-foreground rf-ml-2 rf-truncate rf-max-w-[40%]", children: currentFolder || "/" }),
                          file2.path === currentFile && /* @__PURE__ */ jsx6(Check, { className: "rf-ml-2 rf-h-4 rf-w-4 rf-flex-shrink-0" })
                        ] })
                      ]
                    },
                    file2.path
                  )
                ) }),
                searchResults.globalResults.length > 0 && /* @__PURE__ */ jsx6(CommandGroup, { children: searchResults.globalResults.map((file2) => /* @__PURE__ */ jsxs5(
                  CommandItem,
                  {
                    value: `search-global:${file2.path}`,
                    onSelect: () => {
                      setFile(file2.path);
                      setOpen(false);
                      onFileChange(file2.path);
                    },
                    className: cn(
                      file2.path === currentFile && "rf-font-medium",
                      "rf-group"
                    ),
                    children: [
                      /* @__PURE__ */ jsx6("span", { className: "rf-mr-2", children: defaultFileIcon(file2.fileName) }),
                      /* @__PURE__ */ jsxs5("div", { className: "rf-flex rf-items-center rf-w-full rf-min-w-0", children: [
                        /* @__PURE__ */ jsx6("span", { className: "rf-truncate rf-flex-1", children: getDisplayName(file2.fileName) }),
                        /* @__PURE__ */ jsx6("span", { className: "rf-text-xs rf-text-muted-foreground rf-ml-2 rf-truncate rf-max-w-[40%]", children: getDirectoryPath2(file2.path) }),
                        file2.path === currentFile && /* @__PURE__ */ jsx6(Check, { className: "rf-ml-2 rf-h-4 rf-w-4 rf-flex-shrink-0" })
                      ] })
                    ]
                  },
                  file2.path
                )) })
              ] }) }) })
            ] })
          }
        )
      ]
    }
  ) });
};

// lib/components/RunFrameWithApi/RunFrameWithApi.tsx
import { jsx as jsx7, jsxs as jsxs6 } from "react/jsx-runtime";
var debug4 = Debug3("run-frame:RunFrameWithApi");
var ApiStatusIndicator = () => {
  const error = useRunFrameStore((s) => s.error);
  const isError = !!error;
  const connectionStatusTooltipText = isError ? "Dev server disconnected" : "Dev server connected";
  return /* @__PURE__ */ jsx7(TooltipProvider, { children: /* @__PURE__ */ jsxs6(Tooltip, { children: [
    /* @__PURE__ */ jsx7(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx7(
      "button",
      {
        type: "button",
        "aria-label": connectionStatusTooltipText,
        className: "rf-inline-flex rf-items-center rf-justify-center rf-p-2 rf-rounded-full rf-outline-none",
        children: /* @__PURE__ */ jsx7(
          "span",
          {
            className: cn(
              "rf-inline-flex rf-size-2 rf-rounded-full rf-flex-shrink-0",
              isError ? "rf-bg-red-600" : "rf-bg-green-600 rf-opacity-50"
            ),
            "aria-hidden": "true"
          }
        )
      }
    ) }),
    /* @__PURE__ */ jsx7(TooltipContent, { side: "right", children: connectionStatusTooltipText })
  ] }) });
};
var guessEntrypoint = (files) => files.find((file) => file.includes("entrypoint.")) ?? files.find((file) => file.includes("index.")) ?? files.find((file) => file.includes("main.")) ?? files.find((file) => file.endsWith(".tsx"));
var guessManualEditsFilePath = (files) => files.find((file) => file.includes("manual-edits.")) ?? files.find((file) => file.includes("manual-edit.")) ?? files.find((file) => file.endsWith(".json"));
var RunFrameWithApi = (props) => {
  const { apiBaseUrl, leftHeaderContent } = props;
  useEffect7(() => {
    if (props.debug) Debug3.enable("run-frame*");
  }, [props.debug]);
  const startPolling = useRunFrameStore((s) => s.startPolling);
  const stopPolling = useRunFrameStore((s) => s.stopPolling);
  const setCurrentMainComponentPath = useRunFrameStore(
    (s) => s.setCurrentMainComponentPath
  );
  const pushEvent = useRunFrameStore((s) => s.pushEvent);
  const hasReceivedInitialFiles = useHasReceivedInitialFilesLoaded();
  const fsMap = useRunFrameStore((s) => s.fsMap);
  const recentlySavedFiles = useRunFrameStore((s) => s.recentlySavedFiles);
  const allFiles = useMemo5(() => Array.from(fsMap.keys()), [fsMap]);
  const projectConfigContent = useMemo5(() => {
    const rawConfig = fsMap.get("tscircuit.config.json");
    return typeof rawConfig === "string" ? rawConfig : void 0;
  }, [fsMap]);
  const boardFiles = useMemo5(
    () => getBoardFilesFromConfig(allFiles, projectConfigContent),
    [allFiles, projectConfigContent]
  );
  const circuitJson = useRunFrameStore((s) => s.circuitJson);
  const [componentPath, setComponentPath] = useState6(() => {
    if (typeof window === "undefined")
      return props.initialMainComponentPath ?? "";
    const params = new URLSearchParams(window.location.hash.slice(1));
    return params.get("file") ?? props.initialMainComponentPath ?? "";
  });
  const [favorites, setFavorites] = useLocalStorageState(
    "runframe:favorites",
    []
  );
  const isLoadingFiles = !hasReceivedInitialFiles;
  const handleToggleFavorite = useCallback4(
    (filePath) => {
      setFavorites(
        (prev) => prev.includes(filePath) ? prev.filter((f) => f !== filePath) : [...prev, filePath]
      );
    },
    [setFavorites]
  );
  const activeFileFilter = props.fileFilter ?? DEFAULT_UI_FILE_FILTER;
  const visibleBoardFiles = useMemo5(
    () => boardFiles.filter(activeFileFilter),
    [boardFiles, activeFileFilter]
  );
  useEffect7(() => {
    if (componentPath && (visibleBoardFiles.includes(componentPath) || boardFiles.includes(componentPath))) {
      return;
    }
    if (componentPath) {
      const currentDir = componentPath.includes("/") ? componentPath.substring(0, componentPath.lastIndexOf("/")) : "";
      const fileInSameDir = visibleBoardFiles.find((file) => {
        const fileDir = file.includes("/") ? file.substring(0, file.lastIndexOf("/")) : "";
        return fileDir === currentDir;
      });
      if (fileInSameDir) {
        setComponentPath(fileInSameDir);
        return;
      }
    }
    const defaultPath = window?.TSCIRCUIT_DEFAULT_MAIN_COMPONENT_PATH;
    const candidatePaths = [props.initialMainComponentPath, defaultPath].filter(
      (value) => Boolean(value)
    );
    for (const candidate of candidatePaths) {
      if (visibleBoardFiles.includes(candidate)) {
        setComponentPath(candidate);
        return;
      }
    }
    const filesToConsider = visibleBoardFiles.length > 0 ? visibleBoardFiles : boardFiles;
    const firstMatch = filesToConsider[0];
    if (firstMatch) {
      setComponentPath(firstMatch);
    }
  }, [
    visibleBoardFiles,
    boardFiles,
    props.initialMainComponentPath,
    componentPath
  ]);
  const updateFileHash = useCallback4((filePath) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("file") === filePath) return;
    params.set("file", filePath);
    const newHash = params.toString();
    const newUrl = `${window.location.pathname}${window.location.search}${newHash.length > 0 ? `#${newHash}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, []);
  useEffect7(() => {
    if (!componentPath) return;
    updateFileHash(componentPath);
    props.onMainComponentPathChange?.(componentPath);
    setCurrentMainComponentPath(componentPath);
  }, [
    componentPath,
    props.onMainComponentPathChange,
    updateFileHash,
    setCurrentMainComponentPath
  ]);
  useSyncPageTitle();
  const {
    editEventsForRender,
    pushEditEvent,
    markRenderStarted,
    markRenderComplete
  } = useEditEventController();
  useEffect7(() => {
    if (apiBaseUrl) {
      window.TSCIRCUIT_FILESERVER_API_BASE_URL = apiBaseUrl;
    }
  }, [apiBaseUrl]);
  useEffect7(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);
  const componentProp = useMemo5(
    () => String(componentPath).length > 0 ? {
      mainComponentPath: componentPath
    } : {},
    [componentPath]
  );
  const handleRunCompleted = useCallback4(
    async (payload) => {
      try {
        await pushEvent({
          event_type: "RUN_COMPLETED",
          initiator: "runframe",
          ...payload
        });
      } catch (err) {
        debug4("Failed to push RUN_COMPLETED event", err);
      }
    },
    [pushEvent]
  );
  return /* @__PURE__ */ jsx7(
    RunFrame,
    {
      fsMap,
      showFileMenu: props.showFileMenu,
      shouldLoadLatestEval: props.shouldLoadLatestEval,
      onChangeShouldLoadLatestEval: props.onChangeShouldLoadLatestEval,
      isCli: props.isCli,
      schematicSvgOptions: props.schematicSvgOptions,
      isLoadingFiles,
      evalVersion: props.evalVersion,
      forceLatestEvalVersion: props.forceLatestEvalVersion,
      evalWebWorkerBlobUrl: props.evalWebWorkerBlobUrl ?? props.workerBlobUrl,
      platformConfig: props.platformConfig,
      enableFetchProxy: props.enableFetchProxy,
      leftHeaderContent: /* @__PURE__ */ jsxs6("div", { className: "rf-flex rf-items-center rf-justify-between rf-w-full", children: [
        /* @__PURE__ */ jsxs6("div", { className: "rf-flex rf-items-center rf-gap-2", children: [
          props.leftHeaderContent,
          /* @__PURE__ */ jsx7(ApiStatusIndicator, {})
        ] }),
        props.showFilesSwitch && /* @__PURE__ */ jsx7("div", { className: "rf-absolute rf-left-1/2 rf-transform rf--translate-x-1/2", children: /* @__PURE__ */ jsx7(
          EnhancedFileSelectorCombobox,
          {
            currentFile: componentPath,
            files: visibleBoardFiles,
            onFileChange: (value) => {
              if (typeof fsMap.get(value) === "string") {
                setComponentPath(value);
              }
            },
            pinnedFiles: favorites,
            onToggleFavorite: handleToggleFavorite,
            fileFilter: activeFileFilter,
            recentlySavedFiles
          }
        ) })
      ] }),
      defaultToFullScreen: props.defaultToFullScreen,
      showToggleFullScreen: props.showToggleFullScreen,
      onInitialRender: () => {
        debug4("onInitialRender / markRenderStarted");
        markRenderStarted();
      },
      onRenderFinished: () => {
        debug4("onRenderFinished / markRenderComplete");
        markRenderComplete();
      },
      onRunCompleted: handleRunCompleted,
      editEvents: editEventsForRender,
      onEditEvent: (ee) => {
        pushEditEvent(ee);
        fetch(`${API_BASE}/events/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "USER_CREATED_MANUAL_EDIT",
            ...ee
          })
        });
        const manualEditsFilePath = guessManualEditsFilePath(Array.from(fsMap.keys())) ?? "manual-edits.json";
        const manualEditsFile = fsMap.get(manualEditsFilePath);
        const updatedManualEdits = JSON.parse(
          manualEditsFile ?? "{}"
        );
        applyEditEventsToManualEditsFile({
          circuitJson,
          editEvents: [ee],
          manualEditsFile: updatedManualEdits
        });
        fetch(`${API_BASE}/files/upsert`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: manualEditsFilePath,
            text_content: JSON.stringify(updatedManualEdits),
            initiator: "runframe"
          })
        });
      },
      onLoginRequired: props.onLoginRequired,
      easyEdaProxyConfig: {
        proxyEndpointUrl: `${API_BASE}/proxy`
      },
      ...componentProp
    }
  );
};

// lib/components/RunFrameForCli/RunFrameForCli.tsx
import { useCallback as useCallback6, useMemo as useMemo6, useState as useState8 } from "react";

// lib/components/RunFrameForCli/LoginDialog.tsx
import { useCallback as useCallback5, useEffect as useEffect8, useRef as useRef4, useState as useState7 } from "react";
import { jsx as jsx8, jsxs as jsxs7 } from "react/jsx-runtime";
var delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var LoginDialog = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [loginState, setLoginState] = useState7("idle");
  const [loginUrl, setLoginUrl] = useState7(null);
  const [errorMessage, setErrorMessage] = useState7(null);
  const pushEvent = useRunFrameStore((state) => state.pushEvent);
  const abortControllerRef = useRef4(null);
  useEffect8(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  const handleSignIn = useCallback5(async () => {
    setLoginState("creating");
    setErrorMessage(null);
    abortControllerRef.current = new AbortController();
    try {
      const ky2 = getRegistryKy();
      const { login_page } = await ky2.post("sessions/login_page/create", {
        json: {},
        signal: abortControllerRef.current?.signal
      }).json();
      setLoginUrl(login_page.url);
      setLoginState("waiting");
      const urlWithAutoclose = new URL(login_page.url);
      urlWithAutoclose.searchParams.set("autoclose", "true");
      window.open(urlWithAutoclose.toString(), "_blank");
      while (!abortControllerRef.current?.signal.aborted) {
        const { login_page: updatedLoginPage } = await ky2.post("sessions/login_page/get", {
          json: {
            login_page_id: login_page.login_page_id
          },
          headers: {
            Authorization: `Bearer ${login_page.login_page_auth_token}`
          },
          signal: abortControllerRef.current?.signal
        }).json();
        if (updatedLoginPage.was_login_successful) {
          setLoginState("exchanging");
          break;
        }
        if (updatedLoginPage.is_expired) {
          throw new Error("Login page expired. Please try again.");
        }
        await delay(1e3);
      }
      if (abortControllerRef.current?.signal.aborted) {
        setLoginState("idle");
        return;
      }
      const { session } = await ky2.post("sessions/login_page/exchange_for_cli_session", {
        json: {
          login_page_id: login_page.login_page_id
        },
        headers: {
          Authorization: `Bearer ${login_page.login_page_auth_token}`
        },
        signal: abortControllerRef.current?.signal
      }).json();
      if (typeof window !== "undefined") {
        window.TSCIRCUIT_REGISTRY_TOKEN = session.token;
      }
      await pushEvent({
        event_type: "TOKEN_UPDATED",
        registry_token: session.token
      });
      setLoginState("success");
      toast.success("Successfully logged in!");
      onLoginSuccess?.();
      setTimeout(() => {
        onClose();
        setLoginState("idle");
        setLoginUrl(null);
      }, 1e3);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setLoginState("idle");
        return;
      }
      console.error("Login error:", error);
      const message = error instanceof Error ? error.message : "Failed to complete login";
      setErrorMessage(message);
      setLoginState("error");
      toast.error(message);
    }
  }, [pushEvent, onLoginSuccess, onClose]);
  const handleCancel = useCallback5(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoginState("idle");
    setLoginUrl(null);
    setErrorMessage(null);
    onClose();
  }, [onClose]);
  const isLoading = loginState === "creating" || loginState === "waiting" || loginState === "exchanging";
  const getStatusMessage = () => {
    switch (loginState) {
      case "creating":
        return "Creating login page...";
      case "waiting":
        return "Waiting for you to complete login in the browser...";
      case "exchanging":
        return "Generating token...";
      case "success":
        return "Successfully logged in!";
      case "error":
        return errorMessage || "An error occurred";
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsx8(
    Dialog,
    {
      open: isOpen,
      onOpenChange: (open) => !open && !isLoading && handleCancel(),
      children: /* @__PURE__ */ jsxs7(DialogContent, { className: "rf-max-w-md", children: [
        /* @__PURE__ */ jsxs7(DialogHeader, { children: [
          /* @__PURE__ */ jsx8(DialogTitle, { children: "Sign In Required" }),
          /* @__PURE__ */ jsx8(DialogDescription, { children: loginState === "idle" || loginState === "error" ? "Sign in to continue. A new browser window will open for authentication." : "Complete the login process in the opened browser window." })
        ] }),
        /* @__PURE__ */ jsxs7("div", { className: "rf-flex rf-flex-col rf-items-center rf-gap-4 rf-py-4", children: [
          loginState === "idle" || loginState === "error" ? /* @__PURE__ */ jsx8(Button, { onClick: handleSignIn, className: "rf-w-full", children: "Sign In" }) : /* @__PURE__ */ jsxs7("div", { className: "rf-flex rf-flex-col rf-items-center rf-gap-3 rf-w-full", children: [
            loginState !== "success" && /* @__PURE__ */ jsx8("div", { className: "rf-animate-spin rf-w-6 rf-h-6 rf-border-2 rf-border-gray-300 rf-border-t-blue-600 rf-rounded-full" }),
            /* @__PURE__ */ jsx8("p", { className: "rf-text-sm rf-text-gray-600 rf-text-center", children: getStatusMessage() }),
            loginUrl && loginState === "waiting" && /* @__PURE__ */ jsx8(
              "a",
              {
                href: loginUrl,
                target: "_blank",
                rel: "noreferrer",
                className: "rf-text-xs rf-text-blue-600 hover:rf-underline",
                children: "Click here if the window didn't open"
              }
            )
          ] }),
          errorMessage && loginState === "error" && /* @__PURE__ */ jsx8("p", { className: "rf-text-sm rf-text-red-600 rf-text-center", children: errorMessage }),
          isLoading && /* @__PURE__ */ jsx8(
            Button,
            {
              variant: "outline",
              onClick: handleCancel,
              className: "rf-w-full",
              children: "Cancel"
            }
          )
        ] })
      ] })
    }
  );
};
var useLoginDialog = () => {
  const [isOpen, setIsOpen] = useState7(false);
  const openLoginDialog = useCallback5(() => {
    setIsOpen(true);
  }, []);
  const closeLoginDialog = useCallback5(() => {
    setIsOpen(false);
  }, []);
  const handleLoginSuccess = useCallback5(() => {
    setIsOpen(false);
  }, []);
  return {
    LoginDialog: /* @__PURE__ */ jsx8(
      LoginDialog,
      {
        isOpen,
        onClose: closeLoginDialog,
        onLoginSuccess: handleLoginSuccess
      }
    ),
    openLoginDialog
  };
};

// lib/components/RunFrameForCli/create-cli-local-cache-engine.ts
var createCliLocalCacheEngine = ({
  apiBaseUrl,
  fetchImpl = globalThis.fetch.bind(globalThis)
}) => {
  const cacheApiUrl = `${apiBaseUrl.replace(/\/$/, "")}/cache`;
  return {
    getItem: async (key) => {
      try {
        const response = await fetchImpl(
          `${cacheApiUrl}?key=${encodeURIComponent(key)}`
        );
        if (!response.ok) return null;
        return await response.text();
      } catch {
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        await fetchImpl(`${cacheApiUrl}?key=${encodeURIComponent(key)}`, {
          method: "POST",
          headers: { "Content-Type": "text/plain; charset=utf-8" },
          body: value
        });
      } catch {
      }
    }
  };
};

// lib/components/RunFrameForCli/RunFrameForCli.tsx
import { Fragment as Fragment3, jsx as jsx9, jsxs as jsxs8 } from "react/jsx-runtime";
var RunFrameForCli = (props) => {
  const [shouldLoadLatestEval, setLoadLatestEval] = useLocalStorageState(
    "load-latest-eval",
    true
  );
  const evalWebWorkerBlobUrl = props.evalWebWorkerBlobUrl ?? props.workerBlobUrl;
  const cacheApiBaseUrl = props.apiBaseUrl ?? API_BASE;
  const platformConfig = useMemo6(
    () => ({
      ...props.platformConfig,
      localCacheEngine: props.platformConfig?.localCacheEngine ?? createCliLocalCacheEngine({ apiBaseUrl: cacheApiBaseUrl })
    }),
    [cacheApiBaseUrl, props.platformConfig]
  );
  const [initialMainComponentPath] = useState8(() => {
    if (typeof window === "undefined") return void 0;
    const params = new URLSearchParams(window.location.hash.slice(1));
    return params.get("main_component") ?? void 0;
  });
  const updateMainComponentHash = useCallback6((mainComponentPath) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("main_component") === mainComponentPath) return;
    params.set("main_component", mainComponentPath);
    const newHash = params.toString();
    const newUrl = `${window.location.pathname}${window.location.search}${newHash.length > 0 ? `#${newHash}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, []);
  const { LoginDialog: LoginDialog2, openLoginDialog } = useLoginDialog();
  return /* @__PURE__ */ jsxs8(Fragment3, { children: [
    LoginDialog2,
    /* @__PURE__ */ jsx9(
      RunFrameWithApi,
      {
        debug: props.debug,
        forceLatestEvalVersion: !evalWebWorkerBlobUrl && shouldLoadLatestEval,
        defaultToFullScreen: true,
        showToggleFullScreen: false,
        evalWebWorkerBlobUrl,
        apiBaseUrl: props.apiBaseUrl,
        platformConfig,
        isCli: true,
        showFilesSwitch: true,
        enableFetchProxy: props.enableFetchProxy,
        initialMainComponentPath,
        onLoginRequired: openLoginDialog,
        onMainComponentPathChange: updateMainComponentHash,
        shouldLoadLatestEval: !evalWebWorkerBlobUrl && shouldLoadLatestEval,
        onChangeShouldLoadLatestEval: (newShouldLoadLatestEval) => {
          setLoadLatestEval(newShouldLoadLatestEval);
          globalThis.runFrameWorker = null;
        },
        leftHeaderContent: /* @__PURE__ */ jsx9("div", { className: "rf-flex rf-items-center rf-justify-between", children: props.scenarioSelectorContent })
      }
    )
  ] });
};

// lib/components/ImportComponentDialog/ImportComponentDialog.tsx
import "react";
import { useState as useState9, useEffect as useEffect9 } from "react";
import { Loader2 as Loader22, Search as Search2, ExternalLink } from "lucide-react";

// lib/components/ImportComponentDialog/jlc-api.ts
var searchJLCComponents = async (query, limit = 10) => {
  try {
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(
      `https://jlcsearch.tscircuit.com/api/search?limit=${limit}&q=${encodedQuery}`
    );
    if (!response.ok) {
      throw new Error(
        `JLC API error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    return data.components || [];
  } catch (error) {
    console.error("Error searching JLC components:", error);
    throw error;
  }
};
var mapJLCComponentToSearchResult = (jlcComponent) => {
  return {
    id: `jlc-${jlcComponent.lcsc}`,
    name: jlcComponent.mfr,
    description: jlcComponent.description,
    source: "jlcpcb",
    partNumber: `C${jlcComponent.lcsc}`,
    package: jlcComponent.package,
    price: jlcComponent.price
  };
};

// lib/components/ImportComponentDialog/kicad-api.ts
import Fuse from "fuse.js";
var KICAD_FOOTPRINTS = null;
var KICAD_FOOTPRINTS_PROMISE = null;
var getKicadFootprints = async () => {
  if (KICAD_FOOTPRINTS) return KICAD_FOOTPRINTS;
  if (KICAD_FOOTPRINTS_PROMISE) return KICAD_FOOTPRINTS_PROMISE;
  KICAD_FOOTPRINTS_PROMISE = fetch(
    "https://kicad-mod-cache.tscircuit.com/kicad_files.json"
  ).then((r) => r.json()).then((footprints) => {
    KICAD_FOOTPRINTS = footprints;
    KICAD_FOOTPRINTS_PROMISE = null;
    return footprints;
  });
  return KICAD_FOOTPRINTS_PROMISE;
};
var fuse = null;
var searchKicadFootprints = async (query, limit = 20) => {
  const footprints = await getKicadFootprints();
  if (!fuse) {
    fuse = new Fuse(footprints);
  }
  return fuse.search(query).slice(0, limit).map((r) => r.item);
};
var mapKicadFootprintToSearchResult = (footprintPath) => {
  const cleanedFootprint = footprintPath.replace(".pretty/", "/").replace(".kicad_mod", "");
  const footprintString = `kicad:${cleanedFootprint}`;
  return {
    id: `kicad-${footprintPath}`,
    name: footprintString,
    description: cleanedFootprint,
    source: "kicad"
  };
};

// lib/components/ImportComponentDialog/tscircuit-registry-api.ts
var searchTscircuitComponents = async (query) => {
  try {
    const response = await fetch(
      "https://registry-api.tscircuit.com/packages/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      }
    );
    if (!response.ok) {
      throw new Error(
        `tscircuit Registry API error: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    return data.packages || [];
  } catch (error) {
    console.error("Error searching tscircuit components:", error);
    throw error;
  }
};
var mapTscircuitSnippetToSearchResult = (tscircuitSnippet) => {
  return {
    id: `tscircuit-${tscircuitSnippet.package_id}`,
    name: tscircuitSnippet.unscoped_name,
    description: tscircuitSnippet.description || `Component by ${tscircuitSnippet.org_owner_tscircuit_handle}`,
    source: "tscircuit.com",
    partNumber: tscircuitSnippet.name,
    owner: String(tscircuitSnippet.org_owner_tscircuit_handle)
  };
};

// lib/optional-features/importing/import-component-from-jlcpcb.ts
import ky from "ky";
var importComponentFromJlcpcb = async (jlcpcbPartNumber, opts) => {
  const { fetchEasyEDAComponent, convertRawEasyToTsx } = await loadEasyedaBrowser();
  const component = await fetchEasyEDAComponent(jlcpcbPartNumber, {
    fetch: createEasyEdaProxyFetch({ headers: opts?.headers })
  });
  const tsx = await convertRawEasyToTsx({ rawEasy: component });
  const fileName = tsx.match(/export const (\w+) = .*/)?.[1];
  if (!fileName) {
    console.error("COULD NOT DETERMINE FILE NAME OF CONVERTED COMPONENT:", tsx);
    throw new Error(`Could not determine file name of converted component`);
  }
  const filePath = `imports/${fileName}.tsx`;
  await ky.post(`${API_BASE}/files/upsert`, {
    json: {
      file_path: filePath,
      text_content: tsx
    }
  });
  return { filePath };
};

// lib/components/ImportComponentDialog/ImportComponentDialog.tsx
import Debug4 from "debug";
import { Fragment as Fragment4, jsx as jsx10, jsxs as jsxs9 } from "react/jsx-runtime";
var debug5 = Debug4("run-frame:ImportComponentDialog");
var currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});
var formatPrice = (value) => value == null ? null : currencyFormatter.format(value);
var ImportComponentDialog = ({
  isOpen,
  onClose,
  proxyRequestHeaders,
  onImport
}) => {
  const [searchQuery, setSearchQuery] = useState9("");
  const [searchResults, setSearchResults] = useState9(
    []
  );
  const [hasSearched, setHasSearched] = useState9(false);
  const [isLoading, setIsLoading] = useState9(false);
  const [selectedComponent, setSelectedComponent] = useState9(null);
  const [activeTab, setActiveTab] = useState9("tscircuit.com");
  const [detailsOpen, setDetailsOpen] = useState9(false);
  const [detailsComponent, setDetailsComponent] = useState9(null);
  const [packageDetails, setPackageDetails] = useState9(null);
  const [packageDetailsLoading, setPackageDetailsLoading] = useState9(false);
  const [previewActiveTab, setPreviewActiveTab] = useState9(
    "pcb"
  );
  const pushEvent = useRunFrameStore((s) => s.pushEvent);
  const handleImport = onImport ? (component) => onImport(component) : (component) => {
    toast.promise(
      async () => {
        if (component.source === "tscircuit.com") {
          await pushEvent({
            event_type: "INSTALL_PACKAGE",
            full_package_name: `@tsci/${component.owner}.${component.name}`
          });
          throw new Error("Not implemented");
        } else if (component.source === "jlcpcb") {
          const { filePath } = await importComponentFromJlcpcb(
            component.partNumber,
            { headers: proxyRequestHeaders }
          );
          return { filePath };
        } else if (component.source === "kicad") {
          await navigator.clipboard.writeText(component.name);
          return { footprint: component.name };
        }
      },
      {
        loading: `Importing component: "${component.name}"`,
        error: (error) => {
          console.error("IMPORT ERROR", error);
          return `Error importing component: "${component.name}": ${error.toString()}`;
        },
        success: (data) => {
          if (data?.footprint) {
            return `Copied "${data.footprint}" to clipboard`;
          }
          return data?.filePath ? `Imported to "${data.filePath}"` : "Import Successful";
        }
      }
    );
  };
  const fetchPackageDetails = async (owner, name) => {
    setPackageDetailsLoading(true);
    try {
      const response = await fetch(
        `https://registry-api.tscircuit.com/packages/get?name=${encodeURIComponent(`${owner}/${name}`)}`
      );
      if (response.ok) {
        const data = await response.json();
        setPackageDetails(data.package || null);
      }
    } catch (error) {
      console.error("Error fetching package details:", error);
      setPackageDetails(null);
    } finally {
      setPackageDetailsLoading(false);
    }
  };
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    const isJlcPartNumber = /^C\d+/.test(searchQuery);
    try {
      if (activeTab === "jlcpcb") {
        const query = isJlcPartNumber ? searchQuery.substring(1) : searchQuery;
        const jlcComponents = await searchJLCComponents(query, 10);
        const mappedResults = jlcComponents.map(mapJLCComponentToSearchResult);
        setSearchResults(mappedResults);
      } else if (activeTab === "kicad") {
        const kicadFootprints = await searchKicadFootprints(searchQuery, 20);
        const mappedResults = kicadFootprints.map(
          mapKicadFootprintToSearchResult
        );
        setSearchResults(mappedResults);
      } else {
        const tscircuitComponents = await searchTscircuitComponents(searchQuery);
        const mappedResults = tscircuitComponents.map(
          mapTscircuitSnippetToSearchResult
        );
        setSearchResults(mappedResults);
      }
    } catch (error) {
      console.error("Error searching components:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
      setHasSearched(true);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  useEffect9(() => {
    setSearchResults([]);
    setSelectedComponent(null);
  }, [activeTab]);
  const showDetails = (component) => {
    setDetailsComponent(component);
    setDetailsOpen(true);
    setPackageDetails(null);
    setPreviewActiveTab("pcb");
    if (component.source === "tscircuit.com" && component.owner) {
      const packageName = component.name.split("/").pop() || component.name;
      fetchPackageDetails(component.owner, packageName);
    }
  };
  return /* @__PURE__ */ jsxs9(Dialog, { open: isOpen, onOpenChange: () => onClose(), children: [
    /* @__PURE__ */ jsxs9(
      DialogContent,
      {
        style: {
          width: "calc(100vw - 2rem)"
        },
        className: "rf-rounded-sm rf-max-h-[90vh] rf-overflow-y-auto rf-flex rf-flex-col",
        children: [
          /* @__PURE__ */ jsxs9(DialogHeader, { children: [
            /* @__PURE__ */ jsx10(DialogTitle, { className: "rf-text-lg sm:rf-text-xl", children: "Import Component" }),
            /* @__PURE__ */ jsx10(DialogDescription, { className: "rf-text-sm", children: "Search for components from tscircuit.com or JLCPCB parts library." })
          ] }),
          /* @__PURE__ */ jsxs9(
            Tabs,
            {
              value: activeTab,
              onValueChange: (value) => setActiveTab(value),
              children: [
                /* @__PURE__ */ jsxs9(TabsList, { className: "rf-grid rf-w-full rf-grid-cols-1 sm:rf-grid-cols-3 rf-h-auto", children: [
                  /* @__PURE__ */ jsx10(
                    TabsTrigger,
                    {
                      value: "tscircuit.com",
                      className: "rf-text-xs sm:rf-text-sm",
                      children: "tscircuit.com"
                    }
                  ),
                  /* @__PURE__ */ jsx10(TabsTrigger, { value: "jlcpcb", className: "rf-text-xs sm:rf-text-sm", children: "JLCPCB Parts" }),
                  /* @__PURE__ */ jsx10(TabsTrigger, { value: "kicad", className: "rf-text-xs sm:rf-text-sm", children: "KiCad" })
                ] }),
                /* @__PURE__ */ jsxs9("div", { className: "rf-flex rf-items-center rf-gap-2 rf-mt-4", children: [
                  /* @__PURE__ */ jsxs9("div", { className: "rf-relative rf-flex-grow", children: [
                    /* @__PURE__ */ jsx10(Search2, { className: "rf-absolute rf-left-2 rf-top-2.5 rf-h-4 rf-w-4 rf-text-muted-foreground" }),
                    /* @__PURE__ */ jsx10(
                      Input,
                      {
                        placeholder: activeTab === "tscircuit.com" ? "Search components..." : activeTab === "kicad" ? "Search KiCad footprints..." : "Search JLCPCB parts (e.g. C14663)...",
                        className: "rf-pl-8",
                        spellCheck: false,
                        autoComplete: "off",
                        value: searchQuery,
                        onChange: (e) => setSearchQuery(e.target.value),
                        onKeyDown: handleKeyDown
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx10(
                    Button,
                    {
                      onClick: handleSearch,
                      disabled: isLoading || searchQuery.trim().length < 1,
                      className: "sm:rf-px-4 rf-px-3",
                      children: isLoading ? /* @__PURE__ */ jsx10(Loader22, { className: "rf-h-4 rf-w-4 rf-animate-spin" }) : /* @__PURE__ */ jsxs9(Fragment4, { children: [
                        /* @__PURE__ */ jsx10(Search2, { className: "rf-h-4 rf-w-4 sm:rf-hidden" }),
                        /* @__PURE__ */ jsx10("span", { className: "rf-hidden sm:rf-inline", children: "Search" })
                      ] })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx10("div", { className: "rf-mt-4 rf-flex-1 rf-min-h-[200px] !rf-max-h-[40vh] !rf-overflow-y-auto rf-border rf-rounded-md", children: searchResults.length > 0 ? /* @__PURE__ */ jsx10("div", { className: "rf-divide-y", children: searchResults.map((result) => /* @__PURE__ */ jsxs9(
                  "div",
                  {
                    className: `rf-p-3 rf-flex rf-flex-col sm:rf-grid sm:rf-grid-cols-[1fr_auto] rf-items-start sm:rf-items-center rf-cursor-pointer hover:rf-bg-zinc-100 rf-gap-2 ${selectedComponent?.id === result.id ? "rf-bg-zinc-100" : ""}`,
                    onClick: () => setSelectedComponent(result),
                    children: [
                      /* @__PURE__ */ jsxs9("div", { className: "rf-min-w-0 rf-overflow-hidden", children: [
                        /* @__PURE__ */ jsx10("div", { className: "rf-font-medium rf-text-sm rf-truncate", children: result.name }),
                        /* @__PURE__ */ jsxs9("div", { className: "rf-text-xs rf-text-zinc-500 rf-truncate", children: [
                          result.partNumber && /* @__PURE__ */ jsx10("span", { className: "rf-mr-2", children: result.partNumber }),
                          result.description
                        ] }),
                        result.price != null && /* @__PURE__ */ jsxs9("div", { className: "rf-text-xs rf-text-zinc-500", children: [
                          "Price: ",
                          formatPrice(result.price)
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx10("div", { className: "rf-flex rf-gap-2 rf-flex-shrink-0 rf-w-full sm:rf-w-auto", children: result.source === "tscircuit.com" && /* @__PURE__ */ jsx10(
                        Button,
                        {
                          variant: "outline",
                          size: "sm",
                          className: "rf-text-xs rf-w-full sm:rf-w-auto",
                          onClick: (e) => {
                            e.stopPropagation();
                            showDetails(result);
                          },
                          children: "See Details"
                        }
                      ) })
                    ]
                  },
                  result.id
                )) }) : isLoading ? /* @__PURE__ */ jsxs9("div", { className: "rf-p-8 rf-text-center rf-text-zinc-500", children: [
                  /* @__PURE__ */ jsx10(Loader22, { className: "rf-h-8 rf-w-8 rf-animate-spin rf-mx-auto rf-mb-2" }),
                  /* @__PURE__ */ jsx10("p", { children: "Searching..." })
                ] }) : /* @__PURE__ */ jsx10("div", { className: "rf-p-8 rf-text-center rf-text-zinc-500", children: hasSearched ? "No results found" : "Enter a search term to find components" }) })
              ]
            }
          ),
          /* @__PURE__ */ jsxs9(DialogFooter, { className: "rf-flex rf-flex-col sm:rf-flex-row rf-gap-2", children: [
            /* @__PURE__ */ jsx10(
              Button,
              {
                variant: "outline",
                onClick: onClose,
                className: "rf-order-2 sm:rf-order-1",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx10(
              Button,
              {
                onClick: () => {
                  if (selectedComponent) {
                    handleImport(selectedComponent);
                    onClose();
                  }
                },
                disabled: !selectedComponent,
                children: selectedComponent?.source === "kicad" ? "Copy Footprint" : "Import Component"
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx10(Dialog, { open: detailsOpen, onOpenChange: setDetailsOpen, children: /* @__PURE__ */ jsxs9(
      DialogContent,
      {
        showOverlay: false,
        style: {
          width: "calc(100vw - 2rem)"
        },
        className: "rf-max-w-5xl !rf-overflow-y-auto rf-max-h-[90vh] rf-overflow-hidden rf-flex rf-flex-col rf-rounded-sm",
        children: [
          /* @__PURE__ */ jsx10(DialogHeader, { className: "rf-pb-4 rf-border-b", children: /* @__PURE__ */ jsx10("div", { className: "rf-flex rf-items-start rf-justify-between rf-gap-4", children: /* @__PURE__ */ jsx10("div", { className: "rf-flex-1 rf-min-w-0", children: /* @__PURE__ */ jsx10(DialogTitle, { className: "rf-text-xl rf-font-semibold rf-truncate", children: detailsComponent?.source === "kicad" ? detailsComponent?.name : /* @__PURE__ */ jsx10(
            "a",
            {
              href: `https://tscircuit.com/${detailsComponent?.owner}/${detailsComponent?.name}`,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "rf-text-black hover:rf-underline",
              children: detailsComponent?.name?.split("/").pop() || detailsComponent?.name
            }
          ) }) }) }) }),
          /* @__PURE__ */ jsx10("div", { className: "rf-flex-1 rf-overflow-y-auto rf-py-4 rf-space-y-6", children: detailsComponent?.source === "tscircuit.com" ? /* @__PURE__ */ jsxs9(Fragment4, { children: [
            /* @__PURE__ */ jsx10("div", { children: /* @__PURE__ */ jsx10("div", { className: "rf-space-y-3", children: detailsComponent?.owner && /* @__PURE__ */ jsxs9("div", { children: [
              /* @__PURE__ */ jsx10("label", { className: "rf-text-xs rf-font-medium rf-text-gray-500 rf-uppercase rf-tracking-wide", children: "Created by" }),
              /* @__PURE__ */ jsx10("div", { className: "rf-mt-1 rf-text-sm rf-font-medium", children: /* @__PURE__ */ jsx10(
                "a",
                {
                  href: `https://tscircuit.com/${detailsComponent?.owner}`,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "rf-text-black hover:rf-underline",
                  children: detailsComponent?.owner
                }
              ) })
            ] }) }) }),
            /* @__PURE__ */ jsxs9("div", { children: [
              /* @__PURE__ */ jsx10("h3", { className: "rf-text-lg rf-font-semibold rf-mb-4", children: "Preview" }),
              /* @__PURE__ */ jsxs9(
                Tabs,
                {
                  value: previewActiveTab,
                  onValueChange: (value) => setPreviewActiveTab(value),
                  children: [
                    /* @__PURE__ */ jsxs9(TabsList, { className: "rf-inline-flex rf-h-9 rf-items-center rf-justify-center rf-rounded-lg rf-bg-zinc-100 rf-p-1 rf-text-zinc-500 dark:rf-bg-zinc-800 dark:rf-text-zinc-400", children: [
                      /* @__PURE__ */ jsx10(
                        TabsTrigger,
                        {
                          value: "pcb",
                          className: "rf-inline-flex rf-items-center rf-justify-center rf-whitespace-nowrap rf-rounded-md rf-px-3 rf-py-1 rf-text-sm rf-font-medium rf-ring-offset-white rf-transition-all focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-zinc-950 focus-visible:rf-ring-offset-2 disabled:rf-pointer-events-none disabled:rf-opacity-50 data-[state=active]:rf-bg-white data-[state=active]:rf-text-zinc-950 data-[state=active]:rf-shadow dark:rf-ring-offset-zinc-950 dark:focus-visible:rf-ring-zinc-300 dark:data-[state=active]:rf-bg-zinc-950 dark:data-[state=active]:rf-text-zinc-50",
                          children: "PCB"
                        }
                      ),
                      /* @__PURE__ */ jsx10(
                        TabsTrigger,
                        {
                          value: "schematic",
                          className: "rf-inline-flex rf-items-center rf-justify-center rf-whitespace-nowrap rf-rounded-md rf-px-3 rf-py-1 rf-text-sm rf-font-medium rf-ring-offset-white rf-transition-all focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-zinc-950 focus-visible:rf-ring-offset-2 disabled:rf-pointer-events-none disabled:rf-opacity-50 data-[state=active]:rf-bg-white data-[state=active]:rf-text-zinc-950 data-[state=active]:rf-shadow dark:rf-ring-offset-zinc-950 dark:focus-visible:rf-ring-zinc-300 dark:data-[state=active]:rf-bg-zinc-950 dark:data-[state=active]:rf-text-zinc-50",
                          children: "Schematic"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs9("div", { className: "rf-mt-4", children: [
                      /* @__PURE__ */ jsx10(
                        TabsContent,
                        {
                          value: "pcb",
                          className: "rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50",
                          children: detailsComponent?.owner && detailsComponent?.name ? /* @__PURE__ */ jsx10("div", { className: "rf-w-full rf-h-fit rf-min-h-[300px] rf-bg-white rf-flex rf-items-center rf-justify-center rf-p-4", children: /* @__PURE__ */ jsx10(
                            "img",
                            {
                              src: `https://registry-api.tscircuit.com/packages/images/${detailsComponent.owner}/${detailsComponent.name}/pcb.png`,
                              alt: `${detailsComponent.name} PCB preview`,
                              className: "rf-max-w-full rf-max-h-full rf-object-contain rf-rounded",
                              onError: (e) => {
                                const target = e.target;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="rf-text-center rf-text-gray-500"><div class="rf-text-sm rf-font-medium">PCB preview not available</div><div class="rf-text-xs rf-mt-1">Preview cannot be generated</div></div>';
                                }
                              }
                            }
                          ) }) : /* @__PURE__ */ jsx10("div", { className: "rf-h-[400px] rf-flex rf-items-center rf-justify-center rf-text-gray-500", children: /* @__PURE__ */ jsxs9("div", { className: "rf-text-center", children: [
                            /* @__PURE__ */ jsx10("div", { className: "rf-text-sm rf-font-medium", children: "No PCB preview available" }),
                            /* @__PURE__ */ jsx10("div", { className: "rf-text-xs rf-mt-1", children: "Preview cannot be generated" })
                          ] }) })
                        }
                      ),
                      /* @__PURE__ */ jsx10(
                        TabsContent,
                        {
                          value: "schematic",
                          className: "rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50",
                          children: detailsComponent?.owner && detailsComponent?.name ? /* @__PURE__ */ jsx10("div", { className: "rf-w-full rf-h-fit rf-min-h-[300px] rf-bg-white rf-flex rf-items-center rf-justify-center rf-p-4", children: /* @__PURE__ */ jsx10(
                            "img",
                            {
                              src: `https://registry-api.tscircuit.com/packages/images/${detailsComponent.owner}/${detailsComponent.name}/schematic.png`,
                              alt: `${detailsComponent.name} schematic preview`,
                              className: "rf-max-w-full rf-max-h-full rf-object-contain rf-rounded",
                              onError: (e) => {
                                const target = e.target;
                                target.style.display = "none";
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '<div class="rf-text-center rf-text-gray-500"><div class="rf-text-sm rf-font-medium">Schematic preview not available</div><div class="rf-text-xs rf-mt-1">Preview cannot be generated</div></div>';
                                }
                              }
                            }
                          ) }) : /* @__PURE__ */ jsx10("div", { className: "rf-h-[400px] rf-flex rf-items-center rf-justify-center rf-text-gray-500", children: /* @__PURE__ */ jsxs9("div", { className: "rf-text-center", children: [
                            /* @__PURE__ */ jsx10("div", { className: "rf-text-sm rf-font-medium", children: "No schematic preview available" }),
                            /* @__PURE__ */ jsx10("div", { className: "rf-text-xs rf-mt-1", children: "Preview cannot be generated" })
                          ] }) })
                        }
                      )
                    ] })
                  ]
                }
              )
            ] }),
            packageDetails?.ai_description && /* @__PURE__ */ jsxs9("div", { children: [
              /* @__PURE__ */ jsx10("h3", { className: "rf-text-lg rf-font-semibold rf-mb-3", children: "AI Description" }),
              /* @__PURE__ */ jsx10("div", { className: "rf-bg-gray-50 rf-border rf-border-gray-200 rf-rounded-lg rf-p-4", children: /* @__PURE__ */ jsx10("p", { className: "rf-text-sm rf-text-gray-700 rf-leading-relaxed", children: packageDetails.ai_description }) })
            ] }),
            packageDetails?.ai_usage_instructions && /* @__PURE__ */ jsxs9("div", { children: [
              /* @__PURE__ */ jsx10("h3", { className: "rf-text-lg rf-font-semibold rf-mb-3", children: "Usage Instructions" }),
              /* @__PURE__ */ jsx10("div", { className: "rf-bg-gray-50 rf-border rf-border-gray-200 rf-rounded-lg rf-p-4", children: /* @__PURE__ */ jsx10("p", { className: "rf-text-sm rf-text-gray-700 rf-leading-relaxed rf-whitespace-pre-wrap", children: packageDetails.ai_usage_instructions }) })
            ] }),
            packageDetailsLoading && /* @__PURE__ */ jsxs9("div", { className: "rf-flex rf-justify-center rf-text-center rf-items-center rf-gap-2 rf-text-gray-500", children: [
              /* @__PURE__ */ jsx10(Loader22, { className: "rf-h-4 rf-w-4 rf-animate-spin" }),
              /* @__PURE__ */ jsx10("span", { className: "rf-text-sm", children: "Loading package details..." })
            ] })
          ] }) : null }),
          /* @__PURE__ */ jsxs9(DialogFooter, { className: "rf-pt-4 rf-border-t rf-flex rf-flex-col sm:rf-flex-row rf-justify-between rf-items-stretch sm:rf-items-center rf-gap-2", children: [
            /* @__PURE__ */ jsx10("div", { className: "rf-flex-1 rf-order-3 sm:rf-order-1", children: detailsComponent?.source === "tscircuit.com" && /* @__PURE__ */ jsxs9(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "rf-gap-2 rf-w-full sm:rf-w-auto",
                onClick: () => {
                  const url = `https://tscircuit.com/${detailsComponent?.owner}/${detailsComponent?.name.split("/").pop()}`;
                  window.open(url, "_blank");
                },
                children: [
                  /* @__PURE__ */ jsx10(ExternalLink, { className: "rf-h-4 rf-w-4" }),
                  "View on tscircuit.com"
                ]
              }
            ) }),
            /* @__PURE__ */ jsxs9("div", { className: "rf-flex rf-flex-col sm:rf-flex-row rf-gap-2 sm:rf-gap-3 rf-order-1 sm:rf-order-2", children: [
              /* @__PURE__ */ jsx10(
                Button,
                {
                  variant: "outline",
                  onClick: () => setDetailsOpen(false),
                  className: "rf-order-2 sm:rf-order-1",
                  children: "Close"
                }
              ),
              /* @__PURE__ */ jsx10(
                Button,
                {
                  onClick: () => {
                    setDetailsOpen(false);
                    if (detailsComponent) {
                      handleImport(detailsComponent);
                      onClose();
                    }
                  },
                  className: "rf-bg-blue-600 hover:rf-bg-blue-700 rf-order-1 sm:rf-order-2",
                  children: detailsComponent?.source === "kicad" ? "Copy Footprint" : "Import Component"
                }
              )
            ] })
          ] })
        ]
      }
    ) })
  ] });
};

// lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer.tsx
import { useCallback as useCallback8, useEffect as useEffect11, useState as useState12 } from "react";

// lib/components/RunFrameStaticBuildViewer/CircuitJsonFileSelectorCombobox.tsx
import { jsx as jsx11 } from "react/jsx-runtime";
var CircuitJsonFileSelectorCombobox = ({
  files,
  onFileChange,
  currentFile
}) => {
  return /* @__PURE__ */ jsx11(
    EnhancedFileSelectorCombobox,
    {
      files,
      onFileChange,
      currentFile,
      fileFilter: () => true,
      placeholder: "Select circuit",
      searchPlaceholder: "Search for circuit file",
      emptyMessage: "No circuit files found in this directory."
    }
  );
};

// lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer.tsx
import { ErrorBoundary as ErrorBoundary2 } from "react-error-boundary";

// lib/components/RunFrameStaticBuildViewer/use-static-circuit-json-path-hash.ts
import { useCallback as useCallback7, useState as useState10 } from "react";
var isEnabledFlag = (value) => value !== null && !["0", "false", "off", "no"].includes(value.toLowerCase());
var hasGalleryFlag = ({
  hash,
  search = ""
}) => {
  const hashParams = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash
  );
  const searchParams = new URLSearchParams(
    search.startsWith("?") ? search.slice(1) : search
  );
  return isEnabledFlag(hashParams.get("gallery")) || isEnabledFlag(searchParams.get("gallery"));
};
var getInitialCircuitJsonPath = ({
  hash,
  initialCircuitPath
}) => {
  const params = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash
  );
  return params.get("file") ?? params.get("main_component") ?? initialCircuitPath ?? "";
};
var getUpdatedCircuitJsonPathHash = ({
  hash,
  filePath
}) => {
  const params = new URLSearchParams(
    hash.startsWith("#") ? hash.slice(1) : hash
  );
  if (params.get("file") === filePath && !params.has("gallery") && (!params.has("main_component") || params.get("main_component") === filePath)) {
    return hash.startsWith("#") ? hash : hash ? `#${hash}` : "";
  }
  params.delete("gallery");
  params.set("file", filePath);
  if (params.has("main_component")) {
    params.set("main_component", filePath);
  }
  const nextHash = params.toString();
  return nextHash ? `#${nextHash}` : "";
};
var useStaticCircuitJsonPathHash = (initialCircuitPath, defaultToGallery = false) => {
  const [currentCircuitJsonPath, setCurrentCircuitJsonPath] = useState10(
    () => {
      if (typeof window === "undefined") return initialCircuitPath ?? "";
      return getInitialCircuitJsonPath({
        hash: window.location.hash,
        initialCircuitPath
      });
    }
  );
  const [isGalleryVisible, setIsGalleryVisible] = useState10(() => {
    if (typeof window === "undefined") return defaultToGallery;
    return defaultToGallery || hasGalleryFlag({
      hash: window.location.hash,
      search: window.location.search
    });
  });
  const updateGalleryUrl = useCallback7((visible) => {
    if (typeof window === "undefined") return;
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search.slice(1));
    if (visible) {
      hashParams.set("gallery", "true");
    } else {
      hashParams.delete("gallery");
      searchParams.delete("gallery");
    }
    const search = searchParams.toString();
    const hash = hashParams.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`
    );
  }, []);
  const showGallery = useCallback7(() => {
    setIsGalleryVisible(true);
    updateGalleryUrl(true);
  }, [updateGalleryUrl]);
  const hideGallery = useCallback7(() => {
    setIsGalleryVisible(false);
    updateGalleryUrl(false);
  }, [updateGalleryUrl]);
  const updateFileHash = useCallback7((filePath) => {
    if (typeof window === "undefined") return;
    const newHash = getUpdatedCircuitJsonPathHash({
      hash: window.location.hash,
      filePath
    });
    const searchParams = new URLSearchParams(window.location.search.slice(1));
    searchParams.delete("gallery");
    const search = searchParams.toString();
    const newUrl = `${window.location.pathname}${search ? `?${search}` : ""}${newHash}`;
    if (newHash === window.location.hash && `${search ? `?${search}` : ""}` === window.location.search)
      return;
    window.history.replaceState(null, "", newUrl);
  }, []);
  return {
    currentCircuitJsonPath,
    setCurrentCircuitJsonPath,
    updateFileHash,
    isGalleryVisible,
    showGallery,
    hideGallery
  };
};

// lib/components/RunFrameStaticBuildViewer/CircuitGallery.tsx
import { ArrowLeft, ImageIcon } from "lucide-react";
import { useEffect as useEffect10, useState as useState11 } from "react";
import { jsx as jsx12, jsxs as jsxs10 } from "react/jsx-runtime";
var getCircuitPreviewImageUrls = (fileRef) => {
  const assetUrl = fileRef.fileStaticAssetUrl;
  const queryOrHashIndex = assetUrl.search(/[?#]/);
  const path = queryOrHashIndex === -1 ? assetUrl : assetUrl.slice(0, queryOrHashIndex);
  const suffix = queryOrHashIndex === -1 ? "" : assetUrl.slice(queryOrHashIndex);
  const directory = path.includes("/") ? path.slice(0, path.lastIndexOf("/") + 1) : "";
  return ["3d.png", "pcb.png", "pcb.svg", "schematic.png", "schematic.svg"].map(
    (fileName) => `${directory}${fileName}${suffix}`
  );
};
var getCircuitDisplayName = (filePath) => {
  const fileName = filePath.split("/").pop() ?? filePath;
  return fileName.replace(/(\.board|\.circuit)?\.(tsx|jsx|json)$/i, "");
};
var CircuitGalleryPreviewImage = ({
  fileRef
}) => {
  const previewUrls = getCircuitPreviewImageUrls(fileRef);
  const [previewIndex, setPreviewIndex] = useState11(0);
  if (previewIndex >= previewUrls.length) {
    return /* @__PURE__ */ jsx12("div", { className: "rf-flex rf-h-full rf-w-full rf-items-center rf-justify-center rf-bg-zinc-100 rf-text-zinc-400", children: /* @__PURE__ */ jsx12(ImageIcon, { className: "rf-h-8 rf-w-8", "aria-hidden": "true" }) });
  }
  return /* @__PURE__ */ jsx12(
    "img",
    {
      src: previewUrls[previewIndex],
      alt: `Preview of ${getCircuitDisplayName(fileRef.filePath)}`,
      className: "rf-h-full rf-w-full rf-object-contain rf-transition-transform rf-duration-200 group-hover:rf-scale-[1.03]",
      loading: "lazy",
      onError: () => setPreviewIndex((index) => index + 1)
    }
  );
};
var CircuitGallery = ({
  files,
  projectName,
  onSelectFile,
  onClose
}) => {
  useEffect10(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  return /* @__PURE__ */ jsx12("main", { className: "rf-h-full rf-w-full rf-overflow-y-auto rf-bg-zinc-50", children: /* @__PURE__ */ jsxs10("div", { className: "rf-mx-auto rf-w-full rf-max-w-7xl rf-px-5 rf-py-8 sm:rf-px-8 sm:rf-py-10", children: [
    /* @__PURE__ */ jsxs10("div", { className: "rf-mb-7 rf-flex rf-items-start rf-justify-between rf-gap-4", children: [
      /* @__PURE__ */ jsxs10("div", { children: [
        /* @__PURE__ */ jsx12("p", { className: "rf-mb-1 rf-text-xs rf-font-medium rf-uppercase rf-tracking-wider rf-text-zinc-500", children: projectName ?? "tscircuit project" }),
        /* @__PURE__ */ jsx12("h1", { className: "rf-text-2xl rf-font-semibold rf-tracking-tight rf-text-zinc-950 sm:rf-text-3xl", children: "Circuit gallery" }),
        /* @__PURE__ */ jsxs10("p", { className: "rf-mt-2 rf-text-sm rf-text-zinc-600", children: [
          "Explore ",
          files.length,
          " ",
          files.length === 1 ? "board" : "boards",
          ". Select one to open its interactive preview."
        ] })
      ] }),
      /* @__PURE__ */ jsxs10(Button, { type: "button", variant: "outline", onClick: onClose, children: [
        /* @__PURE__ */ jsx12(ArrowLeft, { className: "rf-h-4 rf-w-4" }),
        "Back to circuit"
      ] })
    ] }),
    /* @__PURE__ */ jsx12("div", { className: "rf-grid rf-grid-cols-1 rf-gap-5 sm:rf-grid-cols-2 lg:rf-grid-cols-3", children: files.map((fileRef) => /* @__PURE__ */ jsxs10(
      "button",
      {
        type: "button",
        onClick: () => onSelectFile(fileRef.filePath),
        className: "group rf-overflow-hidden rf-rounded-xl rf-border rf-border-zinc-200 rf-bg-white rf-text-left rf-shadow-sm rf-transition-all hover:rf--translate-y-0.5 hover:rf-border-zinc-300 hover:rf-shadow-md focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-zinc-900 focus-visible:rf-ring-offset-2",
        children: [
          /* @__PURE__ */ jsx12("div", { className: "rf-aspect-[4/3] rf-w-full rf-overflow-hidden rf-bg-white rf-p-3", children: /* @__PURE__ */ jsx12(CircuitGalleryPreviewImage, { fileRef }) }),
          /* @__PURE__ */ jsxs10("div", { className: "rf-border-t rf-border-zinc-100 rf-px-4 rf-py-3", children: [
            /* @__PURE__ */ jsx12("div", { className: "rf-truncate rf-text-sm rf-font-medium rf-text-zinc-900", children: getCircuitDisplayName(fileRef.filePath) }),
            /* @__PURE__ */ jsx12("div", { className: "rf-mt-0.5 rf-truncate rf-text-xs rf-text-zinc-500", children: fileRef.filePath })
          ] })
        ]
      },
      fileRef.filePath
    )) })
  ] }) });
};

// lib/components/RunFrameStaticBuildViewer/RunFrameStaticBuildViewer.tsx
import { LayoutGrid } from "lucide-react";
import { Fragment as Fragment5, jsx as jsx13, jsxs as jsxs11 } from "react/jsx-runtime";
var getErrorMessage = (error) => error instanceof Error ? error.message : "An unknown error occurred";
var RunFrameStaticBuildViewer = (props) => {
  useStyles();
  const {
    currentCircuitJsonPath,
    setCurrentCircuitJsonPath,
    updateFileHash,
    isGalleryVisible,
    showGallery,
    hideGallery
  } = useStaticCircuitJsonPathHash(
    props.initialCircuitPath,
    props.defaultToGallery
  );
  const [circuitJson, setCircuitJson] = useState12(null);
  const [isLoadingCurrentFile, setIsLoadingCurrentFile] = useState12(false);
  const [fileCache, setFileCache] = useState12({});
  const [loadingFiles, setLoadingFiles] = useState12(/* @__PURE__ */ new Set());
  const [failedFiles, setFailedFiles] = useState12(/* @__PURE__ */ new Set());
  const fileReferences = props.files;
  const availableFiles = fileReferences.map((f) => f.filePath);
  const defaultFetchFile = useCallback8(
    async (fileRef) => {
      if (!fileRef.fileStaticAssetUrl) {
        throw new Error(
          `No fileStaticAssetUrl provided for ${fileRef.filePath}`
        );
      }
      const response = await fetch(fileRef.fileStaticAssetUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch ${fileRef.filePath}: ${response.statusText}`
        );
      }
      return await response.json();
    },
    []
  );
  const loadCircuitJsonFile = useCallback8(
    async (filePath) => {
      if (fileCache[filePath]) {
        setCircuitJson(fileCache[filePath]);
        updateFileHash(filePath);
        props.onCircuitJsonPathChange?.(filePath);
        return;
      }
      if (failedFiles.has(filePath)) {
        console.warn(`Skipping failed file: ${filePath}`);
        setCircuitJson(null);
        return;
      }
      if (loadingFiles.has(filePath)) {
        return;
      }
      setLoadingFiles((prev) => new Set(prev).add(filePath));
      setIsLoadingCurrentFile(true);
      setCircuitJson(null);
      try {
        const fileRef = fileReferences.find((f) => f.filePath === filePath);
        if (!fileRef) {
          throw new Error(`File reference not found for ${filePath}`);
        }
        const fetchFn = props.onFetchFile || defaultFetchFile;
        const circuitJsonData = await fetchFn(fileRef);
        setFileCache((prev) => ({ ...prev, [filePath]: circuitJsonData }));
        setCircuitJson(circuitJsonData);
        updateFileHash(filePath);
        props.onCircuitJsonPathChange?.(filePath);
        setFailedFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(filePath);
          return newSet;
        });
      } catch (error) {
        console.error(`Failed to load circuit JSON file ${filePath}:`, error);
        setFailedFiles((prev) => new Set(prev).add(filePath));
        setCircuitJson(null);
      } finally {
        setLoadingFiles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(filePath);
          return newSet;
        });
        setIsLoadingCurrentFile(false);
      }
    },
    [
      fileReferences,
      fileCache,
      loadingFiles,
      failedFiles,
      props.onFetchFile,
      props.onCircuitJsonPathChange,
      defaultFetchFile,
      updateFileHash
    ]
  );
  useEffect11(() => {
    if (availableFiles.length === 0 || isGalleryVisible) return;
    let selectedPath = currentCircuitJsonPath;
    if (!selectedPath || !availableFiles.includes(selectedPath)) {
      selectedPath = guessEntrypoint(availableFiles) ?? availableFiles[0];
      setCurrentCircuitJsonPath(selectedPath);
    }
    if (selectedPath && availableFiles.includes(selectedPath)) {
      loadCircuitJsonFile(selectedPath);
    }
  }, [currentCircuitJsonPath, isGalleryVisible]);
  const handleFileChange = useCallback8(
    (newPath) => {
      hideGallery();
      setCurrentCircuitJsonPath(newPath);
    },
    [hideGallery]
  );
  const retryFailedFile = useCallback8(
    (filePath) => {
      setFailedFiles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(filePath);
        return newSet;
      });
      loadCircuitJsonFile(filePath);
    },
    [loadCircuitJsonFile]
  );
  if (availableFiles.length === 0) {
    return /* @__PURE__ */ jsx13("div", { className: "rf-flex rf-flex-col rf-w-full rf-h-full rf-items-center rf-justify-center", children: /* @__PURE__ */ jsxs11("div", { className: "rf-text-center rf-p-8", children: [
      /* @__PURE__ */ jsx13("h3", { className: "rf-text-lg rf-font-semibold rf-text-gray-800 rf-mb-2", children: "No Circuit JSON Files Found" }),
      /* @__PURE__ */ jsx13("p", { className: "rf-text-sm rf-text-gray-600", children: "Please provide circuit JSON files to view." })
    ] }) });
  }
  if (isGalleryVisible) {
    return /* @__PURE__ */ jsx13(
      CircuitGallery,
      {
        files: fileReferences,
        projectName: props.projectName,
        onSelectFile: handleFileChange,
        onClose: hideGallery
      }
    );
  }
  const fileNavigation = availableFiles.length > 1 ? /* @__PURE__ */ jsxs11(Fragment5, { children: [
    /* @__PURE__ */ jsx13(
      CircuitJsonFileSelectorCombobox,
      {
        currentFile: currentCircuitJsonPath,
        files: availableFiles,
        onFileChange: handleFileChange
      }
    ),
    /* @__PURE__ */ jsx13(
      Button,
      {
        type: "button",
        variant: "outline",
        size: "icon",
        onClick: showGallery,
        "aria-label": `Browse all ${availableFiles.length} circuits as a gallery`,
        title: "Open circuit gallery",
        children: /* @__PURE__ */ jsx13(LayoutGrid, { className: "rf-h-4 rf-w-4" })
      }
    )
  ] }) : null;
  const currentFileFailed = failedFiles.has(currentCircuitJsonPath);
  return /* @__PURE__ */ jsx13(
    ErrorBoundary2,
    {
      fallbackRender: ({ error }) => /* @__PURE__ */ jsx13("div", { className: "rf-mt-4 rf-mx-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200", children: /* @__PURE__ */ jsxs11("div", { className: "rf-p-4", children: [
        /* @__PURE__ */ jsx13("h3", { className: "rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-3", children: "Error loading Circuit JSON Preview" }),
        /* @__PURE__ */ jsx13("p", { className: "rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600 rf-mt-2", children: getErrorMessage(error) })
      ] }) }),
      children: currentFileFailed ? /* @__PURE__ */ jsxs11("div", { className: "rf-w-full rf-h-full rf-flex rf-flex-col", children: [
        /* @__PURE__ */ jsxs11("div", { className: "rf-flex rf-items-center rf-justify-between rf-w-full rf-p-4 rf-border-b rf-border-gray-200", children: [
          (props.showFileMenu ?? true) && /* @__PURE__ */ jsx13(
            FileMenuLeftHeader,
            {
              isWebEmbedded: true,
              circuitJson: null,
              projectName: props.projectName
            }
          ),
          availableFiles.length > 1 && /* @__PURE__ */ jsx13("div", { className: "rf-absolute rf-left-1/2 rf-transform rf--translate-x-1/2 rf-flex rf-items-center rf-gap-2", children: fileNavigation })
        ] }),
        /* @__PURE__ */ jsx13("div", { className: "rf-flex-1 rf-flex rf-items-center rf-justify-center", children: /* @__PURE__ */ jsxs11("div", { className: "rf-text-center rf-p-8", children: [
          /* @__PURE__ */ jsx13("h3", { className: "rf-text-lg rf-font-semibold rf-text-red-600 rf-mb-2", children: "Failed to Load Circuit File" }),
          /* @__PURE__ */ jsxs11("p", { className: "rf-text-sm rf-text-gray-600 rf-mb-4", children: [
            "Could not load: ",
            currentCircuitJsonPath
          ] }),
          /* @__PURE__ */ jsxs11("div", { className: "rf-flex rf-flex-col rf-items-center rf-gap-2", children: [
            /* @__PURE__ */ jsx13(
              "button",
              {
                onClick: () => retryFailedFile(currentCircuitJsonPath),
                className: "rf-px-4 rf-py-2 rf-bg-blue-500 rf-text-white rf-rounded rf-hover:bg-blue-600",
                children: "Retry"
              }
            ),
            availableFiles.length > 1 && /* @__PURE__ */ jsx13("p", { className: "rf-text-xs rf-text-gray-500", children: "Or select a different file from the dropdown above" })
          ] })
        ] }) })
      ] }) : /* @__PURE__ */ jsx13(
        CircuitJsonPreview,
        {
          circuitJson,
          defaultToFullScreen: props.defaultToFullScreen,
          showToggleFullScreen: props.showToggleFullScreen,
          showFileMenu: false,
          isWebEmbedded: false,
          projectName: props.projectName,
          defaultActiveTab: props.tabSelected,
          leftHeaderContent: /* @__PURE__ */ jsxs11("div", { className: "rf-flex rf-items-center rf-justify-between rf-w-full", children: [
            (props.showFileMenu ?? true) && /* @__PURE__ */ jsx13(
              FileMenuLeftHeader,
              {
                isWebEmbedded: true,
                circuitJson,
                projectName: props.projectName
              }
            ),
            availableFiles.length > 1 && /* @__PURE__ */ jsx13(
              "div",
              {
                className: `rf-absolute rf-left-1/2 rf-transform rf--translate-x-1/2 rf-flex rf-items-center rf-gap-2 ${isLoadingCurrentFile ? "rf-opacity-50" : ""}`,
                children: fileNavigation
              }
            )
          ] })
        }
      )
    }
  );
};
export {
  BomTable,
  CadViewer,
  CircuitGallery,
  CircuitJsonFileSelectorCombobox,
  CircuitJsonPreview,
  ExportAccessoryDialog,
  ImportComponentDialog,
  ImportComponentDialog2,
  ImportComponentDialogForCli,
  PCBViewer as PcbViewer,
  PcbViewerWithContainerHeight,
  RunFrame,
  RunFrameForCli,
  RunFrameStaticBuildViewer,
  RunFrameWithApi,
  SchematicViewer,
  getCircuitPreviewImageUrls,
  guessEntrypoint,
  guessManualEditsFilePath,
  mapJLCComponentToSearchResult,
  mapTscircuitSnippetToSearchResult,
  searchJLCComponents,
  searchTscircuitComponents,
  useOrderDialog,
  useOrderDialogCli,
  usePcbViewerController,
  useSchematicViewerController
};
