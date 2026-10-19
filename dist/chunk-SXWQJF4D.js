// lib/components/ui/tabs.tsx
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

// lib/utils/index.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// lib/utils/posthog.ts
import posthog from "posthog-js";

// lib/utils/get-registry-ky.ts
import ky, { HTTPError } from "ky";
var RegistryHTTPError = class extends HTTPError {
  constructor(response, request, options, message) {
    super(response, request, options);
    this.name = "RegistryHTTPError";
    this.message = message;
  }
};
function getWindowVar(name) {
  return typeof window !== "undefined" ? window[name] : null;
}
function getRegistryKy() {
  const registryApiBaseUrl = getWindowVar("TSCIRCUIT_REGISTRY_API_BASE_URL") || import.meta.env.VITE_TSCIRCUIT_REGISTRY_API_BASE_URL || "https://registry-api.tscircuit.com";
  const registryToken = getWindowVar("TSCIRCUIT_REGISTRY_TOKEN");
  return ky.create({
    prefixUrl: registryApiBaseUrl,
    headers: {
      Authorization: `Bearer ${registryToken}`
    },
    timeout: 3e4,
    hooks: {
      afterResponse: [
        async (request, options, response) => {
          if (response.ok) return response;
          let serverError = null;
          try {
            serverError = await response.clone().json();
          } catch (jsonError) {
            console.error("Failed to parse registry error response", jsonError);
          }
          const errorMessage = serverError?.error?.message ?? serverError?.error?.error_message ?? serverError?.message;
          const errorCode = serverError?.error?.error_code ?? serverError?.error_code;
          const url = new URL(response.url);
          const requestPath = `${url.pathname}${url.search}`;
          const detailedMessageParts = [
            `Registry request failed for ${requestPath} (${response.status})`
          ];
          if (errorMessage) {
            detailedMessageParts.push(`Server message: ${errorMessage}`);
          }
          if (errorCode) {
            detailedMessageParts.push(`Error code: ${errorCode}`);
          }
          throw new RegistryHTTPError(
            response,
            request,
            options,
            detailedMessageParts.join(" | ")
          );
        }
      ]
    }
  });
}
function hasRegistryToken() {
  return Boolean(getWindowVar("TSCIRCUIT_REGISTRY_TOKEN"));
}
var registryKy = {
  get: (url, options) => getRegistryKy().get(url, options),
  post: (url, options) => getRegistryKy().post(url, options),
  put: (url, options) => getRegistryKy().put(url, options),
  delete: (url, options) => getRegistryKy().delete(url, options),
  patch: (url, options) => getRegistryKy().patch(url, options)
};

// lib/utils/posthog.ts
var POSTHOG_PROJECT_API_KEY = "phc_htd8AQjSfVEsFCLQMAiUooG4Q0DKBCjqYuQglc9V3Wo";
var POSTHOG_API_HOST = "https://postpig.tscircuit.com";
var RUNFRAME_ANONYMOUS_ID_STORAGE_KEY = "runframe:anonymous-id";
var isBrowser = () => typeof window !== "undefined";
var isLocalHost = (hostname) => hostname.includes("localhost") || hostname.includes("127.0.0.1");
var getHostnameFromUrl = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
};
var getRunFrameEmbedDomain = () => {
  if (!isBrowser()) return null;
  let referrerHostname = null;
  if (document.referrer) {
    referrerHostname = getHostnameFromUrl(document.referrer);
  }
  return referrerHostname ?? window.location.hostname;
};
var createRunFrameAnonymousId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
};
var getRunFrameAnonymousId = () => {
  if (!isBrowser()) return null;
  try {
    const storedId = window.localStorage.getItem(
      RUNFRAME_ANONYMOUS_ID_STORAGE_KEY
    );
    if (storedId) return storedId;
    const newId = createRunFrameAnonymousId();
    window.localStorage.setItem(RUNFRAME_ANONYMOUS_ID_STORAGE_KEY, newId);
    return newId;
  } catch {
    return null;
  }
};
var shouldTrackOnLocalhost = () => getWindowVar("TSCIRCUIT_USE_RUNFRAME_FOR_CLI") === true;
var initPostHog = () => {
  if (!isBrowser()) return false;
  if (getWindowVar("TSCIRCUIT_TELEMETRY_DISABLED") === true) return false;
  if (isLocalHost(window.location.hostname) && !shouldTrackOnLocalhost()) {
    return false;
  }
  if (posthog.__loaded) return true;
  posthog.init(POSTHOG_PROJECT_API_KEY, {
    api_host: POSTHOG_API_HOST,
    person_profiles: "always"
  });
  return true;
};
var getRunFrameIdentity = () => {
  if (!initPostHog()) return null;
  const embedDomain = getRunFrameEmbedDomain();
  const shouldUseDomainIdentity = embedDomain != null && !isLocalHost(embedDomain);
  let anonymousId = null;
  if (!shouldUseDomainIdentity) {
    anonymousId = getRunFrameAnonymousId();
  }
  let distinctId;
  let identityType;
  if (shouldUseDomainIdentity) {
    distinctId = `domain:${embedDomain}`;
    identityType = "domain";
  } else {
    distinctId = void 0;
    if (anonymousId) {
      distinctId = `anonymous:${anonymousId}`;
    }
    identityType = "anonymous_id";
  }
  return {
    embedDomain,
    anonymousId,
    distinctId,
    identityType
  };
};
var captureRunFrameTelemetry = (eventName, { source, ...properties }) => {
  const identity = getRunFrameIdentity();
  if (!identity) return;
  const { embedDomain, anonymousId, distinctId, identityType } = identity;
  if (distinctId) {
    const personProperties = {};
    if (identityType === "domain" && embedDomain) {
      personProperties.embed_domain = embedDomain;
    }
    if (identityType === "anonymous_id" && anonymousId) {
      personProperties.runframe_anonymous_id = anonymousId;
    }
    posthog.identify(distinctId, personProperties);
  }
  posthog.capture(eventName, {
    ...properties,
    source,
    embed_domain: embedDomain,
    runframe_anonymous_id: anonymousId,
    identity_type: identityType
  });
};
var captureRunFrameActivity = (properties) => {
  captureRunFrameTelemetry("runframe_activity", properties);
};
initPostHog();

// lib/utils/bytesToBase64.ts
function bytesToBase64(bytes) {
  const binString = String.fromCodePoint(...bytes);
  return btoa(binString);
}

// lib/utils/encodeFsMapToUrlHash.ts
import { gzipSync, strToU8 } from "fflate";
function encodeFsMapToUrlHash(fsMap, snippet_type) {
  const text = JSON.stringify(fsMap);
  const compressedData = gzipSync(strToU8(text));
  const base64Data = bytesToBase64(compressedData);
  const typeParam = snippet_type ? `&snippet_type=${snippet_type}` : "";
  return `https://tscircuit.com/editor?${typeParam}#data:application/gzip;base64,${base64Data}`;
}

// lib/utils/index.ts
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
var capitalizeFirstLetters = (str) => {
  return str.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
};

// lib/components/ui/tabs.tsx
import { jsx } from "react/jsx-runtime";
var Tabs = TabsPrimitive.Root;
var TabsList = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.List,
  {
    ref,
    className: cn(
      "rf-inline-flex rf-h-9 rf-items-center rf-justify-center rf-rounded-lg rf-bg-zinc-100 rf-p-1 rf-text-zinc-500 dark:rf-bg-zinc-800 dark:rf-text-zinc-400",
      className
    ),
    ...props
  }
));
TabsList.displayName = TabsPrimitive.List.displayName;
var TabsTrigger = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Trigger,
  {
    ref,
    className: cn(
      "rf-inline-flex rf-items-center rf-justify-center rf-whitespace-nowrap rf-rounded-md rf-px-3 rf-py-1 rf-text-sm rf-font-medium rf-ring-offset-white rf-transition-all focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-zinc-950 focus-visible:rf-ring-offset-2 disabled:rf-pointer-events-none disabled:rf-opacity-50 data-[state=active]:rf-bg-white data-[state=active]:rf-text-zinc-950 data-[state=active]:rf-shadow dark:rf-ring-offset-zinc-950 dark:focus-visible:rf-ring-zinc-300 dark:data-[state=active]:rf-bg-zinc-950 dark:data-[state=active]:rf-text-zinc-50",
      className
    ),
    ...props
  }
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;
var TabsContent = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  TabsPrimitive.Content,
  {
    ref,
    className: cn(
      "rf-h-full rf-mt-2 rf-ring-offset-white focus-visible:rf-outline-none focus-visible:rf-ring-2 focus-visible:rf-ring-zinc-950 focus-visible:rf-ring-offset-2 dark:rf-ring-offset-zinc-950 dark:focus-visible:rf-ring-zinc-300",
      className
    ),
    ...props
  }
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

// lib/utils/has-simulation-analysis-result.ts
import { isSimulationAnalysisResult } from "circuit-to-svg";
var hasSimulationAnalysisResult = (circuitJson) => circuitJson.some(isSimulationAnalysisResult);

// lib/components/CircuitJsonPreview/CircuitJsonPreview.tsx
import { CadViewer } from "@tscircuit/3d-viewer";
import { usePcbViewerController } from "@tscircuit/pcb-viewer";
import {
  useCallback as useCallback9,
  useEffect as useEffect19,
  useState as useState26,
  useMemo as useMemo11
} from "react";

// lib/components/ErrorFallback.tsx
import "react";

// lib/components/ui/button.tsx
import * as React2 from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { jsx as jsx2 } from "react/jsx-runtime";
var buttonVariants = cva(
  "rf-inline-flex rf-items-center rf-justify-center rf-gap-2 rf-whitespace-nowrap rf-rounded-md rf-text-sm rf-font-medium rf-transition-colors focus-visible:rf-outline-none focus-visible:rf-ring-1 focus-visible:rf-ring-zinc-950 disabled:rf-pointer-events-none disabled:rf-opacity-50 [&_svg]:rf-pointer-events-none [&_svg]:rf-size-4 [&_svg]:rf-shrink-0 dark:focus-visible:rf-ring-zinc-300",
  {
    variants: {
      variant: {
        default: "rf-bg-zinc-900 rf-text-zinc-50 rf-shadow hover:rf-bg-zinc-900/90 dark:rf-bg-zinc-50 dark:rf-text-zinc-900 dark:hover:rf-bg-zinc-50/90",
        destructive: "rf-bg-red-500 rf-text-zinc-50 rf-shadow-sm hover:rf-bg-red-500/90 dark:rf-bg-red-900 dark:rf-text-zinc-50 dark:hover:rf-bg-red-900/90",
        outline: "rf-border rf-border-zinc-200 rf-bg-white rf-shadow-sm hover:rf-bg-zinc-100 hover:rf-text-zinc-900 dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:hover:rf-bg-zinc-800 dark:hover:rf-text-zinc-50",
        secondary: "rf-bg-zinc-100 rf-text-zinc-900 rf-shadow-sm hover:rf-bg-zinc-100/80 dark:rf-bg-zinc-800 dark:rf-text-zinc-50 dark:hover:rf-bg-zinc-800/80",
        ghost: "hover:rf-bg-zinc-100 hover:rf-text-zinc-900 dark:hover:rf-bg-zinc-800 dark:hover:rf-text-zinc-50",
        link: "rf-text-zinc-900 rf-underline-offset-4 hover:rf-underline dark:rf-text-zinc-50"
      },
      size: {
        default: "rf-h-9 rf-px-4 rf-py-2",
        sm: "rf-h-8 rf-rounded-md rf-px-3 rf-text-xs",
        lg: "rf-h-10 rf-rounded-md rf-px-8",
        icon: "rf-h-9 rf-w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
var Button = React2.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx2(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";

// lib/components/ErrorFallback.tsx
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
var ErrorFallback = ({
  error,
  resetErrorBoundary
}) => {
  const resolvedError = error instanceof Error ? error : new Error(String(error));
  return /* @__PURE__ */ jsx3(
    "div",
    {
      "data-testid": "error-container",
      className: "rf-error-container rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200",
      children: /* @__PURE__ */ jsxs("div", { className: "rf-p-4", children: [
        /* @__PURE__ */ jsx3("h2", { className: "rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-3", children: "Error Loading 3D Viewer" }),
        /* @__PURE__ */ jsx3("p", { className: "rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-700", children: resolvedError.message }),
        /* @__PURE__ */ jsx3(
          "details",
          {
            style: { whiteSpace: "pre-wrap" },
            className: "rf-text-xs rf-font-mono rf-text-red-600 rf-mt-2",
            children: resolvedError.stack
          }
        ),
        resetErrorBoundary && /* @__PURE__ */ jsx3("div", { className: "rf-mt-4", children: /* @__PURE__ */ jsx3(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: resetErrorBoundary,
            className: "rf-text-red-700 rf-border-red-300 hover:rf-bg-red-100",
            children: "Retry"
          }
        ) })
      ] })
    }
  );
};

// lib/components/CircuitJsonPreview/CircuitJsonPreview.tsx
import { ErrorBoundary as ErrorBoundary2 } from "react-error-boundary";

// lib/components/ErrorTabContent/ErrorTabContent.tsx
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import {
  ClipboardIcon,
  ChevronRight as ChevronRight2,
  ChevronDown,
  XCircle,
  AlertCircle
} from "lucide-react";
import { createSnippetUrl } from "@tscircuit/create-snippet-url";

// lib/components/ErrorTabContent/AutoroutingLogOptions.tsx
import { CircuitBoardIcon, DownloadIcon, UploadIcon } from "lucide-react";

// lib/components/ui/dropdown-menu.tsx
import * as React4 from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var DropdownMenu = DropdownMenuPrimitive.Root;
var DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
var DropdownMenuPortal = DropdownMenuPrimitive.Portal;
var DropdownMenuSub = DropdownMenuPrimitive.Sub;
var DropdownMenuSubTrigger = React4.forwardRef(({ className, inset, children, ...props }, ref) => /* @__PURE__ */ jsxs2(
  DropdownMenuPrimitive.SubTrigger,
  {
    ref,
    className: cn(
      "rf-flex rf-cursor-default rf-gap-2 rf-select-none rf-items-center rf-rounded-sm rf-px-2 rf-py-1.5 rf-text-sm rf-outline-none focus:rf-bg-zinc-100 data-[state=open]:rf-bg-zinc-100 [&_svg]:rf-pointer-events-none [&_svg]:rf-size-4 [&_svg]:rf-shrink-0 dark:focus:rf-bg-zinc-800 dark:data-[state=open]:rf-bg-zinc-800",
      inset && "rf-pl-8",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx4(ChevronRight, { className: "rf-ml-auto" })
    ]
  }
));
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;
var DropdownMenuSubContent = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx4(
  DropdownMenuPrimitive.SubContent,
  {
    ref,
    className: cn(
      "rf-z-[102] rf-min-w-[8rem] rf-overflow-hidden rf-rounded-md rf-border rf-border-zinc-200 rf-bg-white rf-p-1 rf-text-zinc-950 rf-shadow-lg data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[side=bottom]:rf-slide-in-from-top-2 data-[side=left]:rf-slide-in-from-right-2 data-[side=right]:rf-slide-in-from-left-2 data-[side=top]:rf-slide-in-from-bottom-2 dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:rf-text-zinc-50",
      className
    ),
    ...props
  }
));
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;
var DropdownMenuContent = React4.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx4(DropdownMenuPrimitive.Portal, { children: /* @__PURE__ */ jsx4(
  DropdownMenuPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "rf-z-50 rf-min-w-[8rem] rf-overflow-hidden rf-rounded-md rf-border rf-border-zinc-200 rf-bg-white rf-p-1 rf-text-zinc-950 rf-shadow-md dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:rf-text-zinc-50",
      "data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[side=bottom]:rf-slide-in-from-top-2 data-[side=left]:rf-slide-in-from-right-2 data-[side=right]:rf-slide-in-from-left-2 data-[side=top]:rf-slide-in-from-bottom-2",
      className
    ),
    ...props
  }
) }));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;
var DropdownMenuItem = React4.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx4(
  DropdownMenuPrimitive.Item,
  {
    ref,
    className: cn(
      "rf-relative rf-flex rf-cursor-default rf-select-none rf-items-center rf-gap-2 rf-rounded-sm rf-px-2 rf-py-1.5 rf-text-sm rf-outline-none rf-transition-colors focus:rf-bg-zinc-100 focus:rf-text-zinc-900 data-[disabled]:rf-pointer-events-none data-[disabled]:rf-opacity-50 [&>svg]:rf-size-4 [&>svg]:rf-shrink-0 dark:focus:rf-bg-zinc-800 dark:focus:rf-text-zinc-50",
      inset && "rf-pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;
var DropdownMenuCheckboxItem = React4.forwardRef(({ className, children, checked, ...props }, ref) => /* @__PURE__ */ jsxs2(
  DropdownMenuPrimitive.CheckboxItem,
  {
    ref,
    className: cn(
      "rf-relative rf-flex rf-cursor-default rf-select-none rf-items-center rf-rounded-sm rf-py-1.5 rf-pl-8 rf-pr-2 rf-text-sm rf-outline-none rf-transition-colors focus:rf-bg-zinc-100 focus:rf-text-zinc-900 data-[disabled]:rf-pointer-events-none data-[disabled]:rf-opacity-50 dark:focus:rf-bg-zinc-800 dark:focus:rf-text-zinc-50",
      className
    ),
    checked,
    ...props,
    children: [
      /* @__PURE__ */ jsx4("span", { className: "rf-absolute rf-left-2 rf-flex rf-h-3.5 rf-w-3.5 rf-items-center rf-justify-center", children: /* @__PURE__ */ jsx4(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx4(Check, { className: "rf-h-4 rf-w-4" }) }) }),
      children
    ]
  }
));
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;
var DropdownMenuRadioItem = React4.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs2(
  DropdownMenuPrimitive.RadioItem,
  {
    ref,
    className: cn(
      "rf-relative rf-flex rf-cursor-default rf-select-none rf-items-center rf-rounded-sm rf-py-1.5 rf-pl-8 rf-pr-2 rf-text-sm rf-outline-none rf-transition-colors focus:rf-bg-zinc-100 focus:rf-text-zinc-900 data-[disabled]:rf-pointer-events-none data-[disabled]:rf-opacity-50 dark:focus:rf-bg-zinc-800 dark:focus:rf-text-zinc-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx4("span", { className: "rf-absolute rf-left-2 rf-flex rf-h-3.5 rf-w-3.5 rf-items-center rf-justify-center", children: /* @__PURE__ */ jsx4(DropdownMenuPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx4(Circle, { className: "rf-h-2 rf-w-2 rf-fill-current" }) }) }),
      children
    ]
  }
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;
var DropdownMenuLabel = React4.forwardRef(({ className, inset, ...props }, ref) => /* @__PURE__ */ jsx4(
  DropdownMenuPrimitive.Label,
  {
    ref,
    className: cn(
      "rf-px-2 rf-py-1.5 rf-text-sm rf-font-semibold",
      inset && "rf-pl-8",
      className
    ),
    ...props
  }
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;
var DropdownMenuSeparator = React4.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx4(
  DropdownMenuPrimitive.Separator,
  {
    ref,
    className: cn(
      "rf--mx-1 rf-my-1 rf-h-px rf-bg-zinc-100 dark:rf-bg-zinc-800",
      className
    ),
    ...props
  }
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;
var DropdownMenuShortcut = ({
  className,
  ...props
}) => {
  return /* @__PURE__ */ jsx4(
    "span",
    {
      className: cn(
        "rf-ml-auto rf-text-xs rf-tracking-widest rf-opacity-60",
        className
      ),
      ...props
    }
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";

// lib/components/ErrorTabContent/AutoroutingLogOptions.tsx
import { Fragment, jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
var AutoroutingLogOptions = ({
  autoroutingLog,
  onReportAutoroutingLog
}) => /* @__PURE__ */ jsx5(Fragment, { children: Object.keys(autoroutingLog ?? {}).length > 0 && /* @__PURE__ */ jsxs3(DropdownMenu, { children: [
  /* @__PURE__ */ jsx5(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs3(Button, { variant: "outline", children: [
    /* @__PURE__ */ jsx5(CircuitBoardIcon, { className: "rf-w-4 rf-h-4 rf-mr-2" }),
    "Open Autorouting Log"
  ] }) }),
  /* @__PURE__ */ jsx5(DropdownMenuContent, { className: "rf-w-96", children: Object.entries(autoroutingLog ?? {}).map(
    ([key, { simpleRouteJson }]) => /* @__PURE__ */ jsxs3(
      DropdownMenuItem,
      {
        className: "rf-flex rf-justify-between rf-items-center",
        children: [
          /* @__PURE__ */ jsx5("span", { className: "rf-truncate rf-text-xs rf-mr-2", children: key }),
          /* @__PURE__ */ jsxs3("div", { className: "rf-flex rf-gap-2", children: [
            /* @__PURE__ */ jsxs3(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: (e) => {
                  e.stopPropagation();
                  const blob = new Blob(
                    [JSON.stringify(simpleRouteJson, null, 2)],
                    { type: "application/json" }
                  );
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${key}-autorouting.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                },
                children: [
                  /* @__PURE__ */ jsx5(DownloadIcon, { className: "rf-w-3 rf-h-3" }),
                  "Download"
                ]
              }
            ),
            onReportAutoroutingLog && /* @__PURE__ */ jsxs3(
              Button,
              {
                variant: "outline",
                size: "sm",
                onClick: (e) => {
                  e.stopPropagation();
                  if (onReportAutoroutingLog) {
                    onReportAutoroutingLog(key, { simpleRouteJson });
                  }
                },
                children: [
                  /* @__PURE__ */ jsx5(UploadIcon, { className: "rf-w-3 rf-h-3" }),
                  "Report Bug"
                ]
              }
            )
          ] })
        ]
      },
      key
    )
  ) })
] }) });

// lib/components/ErrorTabContent/ErrorTabContent.tsx
import { useState, useMemo, useEffect } from "react";

// lib/utils/toast.ts
import { toast } from "react-hot-toast";

// lib/components/ErrorTabContent/ErrorTabContent.tsx
import { Fragment as Fragment2, jsx as jsx6, jsxs as jsxs4 } from "react/jsx-runtime";
var ErrorTabContent = ({
  code,
  fsMap,
  autoroutingLog,
  circuitJsonErrors,
  circuitJsonWarnings,
  onReportAutoroutingLog,
  errorMessage,
  errorStack,
  circuitJson,
  evalVersion
}) => {
  const unifiedErrors = useMemo(() => {
    const errors = [];
    if (errorMessage) {
      errors.push({
        type: "Execution Error",
        message: errorMessage,
        stack: errorStack || void 0,
        source: "execution"
      });
    }
    if (circuitJsonErrors && circuitJsonErrors.length > 0) {
      for (const error of circuitJsonErrors) {
        errors.push({
          type: error.type || "Circuit JSON Error",
          message: error.message || "No error message available",
          stack: error.stack || "",
          source: "circuitJson"
        });
      }
    }
    return errors;
  }, [errorMessage, errorStack, circuitJsonErrors]);
  const softwareUsedString = useMemo(() => {
    if (!circuitJson || !Array.isArray(circuitJson)) return void 0;
    const metadata = circuitJson.find(
      (el) => el.type === "source_project_metadata"
    );
    return metadata?.software_used_string;
  }, [circuitJson]);
  const unifiedWarnings = useMemo(() => {
    const warnings = [];
    if (circuitJsonWarnings && circuitJsonWarnings.length > 0) {
      for (const warning of circuitJsonWarnings) {
        warnings.push({
          type: warning.type || "Circuit JSON Warning",
          message: warning.message || "No warning message available",
          stack: warning.stack || "",
          source: "circuitJson"
        });
      }
    }
    return warnings;
  }, [circuitJsonWarnings]);
  const packageUrl = () => {
    if (fsMap) {
      try {
        return encodeFsMapToUrlHash(
          fsMap instanceof Map ? Object.fromEntries(fsMap.entries()) : fsMap
        );
      } catch {
      }
    }
    return createSnippetUrl(code ?? "");
  };
  const openIssue = (title, body) => {
    const issueUrl = `https://github.com/tscircuit/tscircuit.com/issues/new?title=${encodeURIComponent(
      title
    )}&body=${encodeURIComponent(body)}`;
    window.open(issueUrl, "_blank");
  };
  useEffect(() => {
    if (errorMessage) {
      let errorText = errorMessage;
      if (errorStack) {
        errorText += `

${errorStack}`;
      }
      if (typeof window !== "undefined") {
        window.__TSCIRCUIT_LAST_EXECUTION_ERROR = errorText;
      }
    }
  }, [errorMessage, errorStack]);
  const [expandedErrors, setExpandedErrors] = useState(() => {
    const allIndexes = /* @__PURE__ */ new Set();
    unifiedErrors.forEach((_, i) => allIndexes.add(i));
    return allIndexes;
  });
  const [expandedWarnings, setExpandedWarnings] = useState(() => {
    const allIndexes = /* @__PURE__ */ new Set();
    unifiedWarnings.forEach((_, i) => allIndexes.add(i));
    return allIndexes;
  });
  const [errorsCollapsed, setErrorsCollapsed] = useState(false);
  const [warningsCollapsed, setWarningsCollapsed] = useState(false);
  if (unifiedErrors.length === 0 && unifiedWarnings.length === 0) {
    return /* @__PURE__ */ jsxs4("div", { className: "px-2", children: [
      /* @__PURE__ */ jsx6("div", { className: "rf-mt-4 rf-bg-green-50 rf-rounded-md rf-border rf-border-green-200", children: /* @__PURE__ */ jsxs4("div", { className: "rf-p-4", children: [
        /* @__PURE__ */ jsx6("h3", { className: "rf-text-lg rf-font-semibold rf-text-green-800 rf-mb-3", children: "No errors or warnings!" }),
        /* @__PURE__ */ jsx6("p", { className: "rf-text-sm rf-text-green-700", children: "Your code is running without any errors or warnings." })
      ] }) }),
      /* @__PURE__ */ jsxs4("div", { className: "rf-flex rf-gap-2 rf-mt-4 rf-justify-end", children: [
        /* @__PURE__ */ jsx6(
          AutoroutingLogOptions,
          {
            autoroutingLog,
            onReportAutoroutingLog
          }
        ),
        /* @__PURE__ */ jsxs4(
          Button,
          {
            variant: "outline",
            className: "rf-p-1",
            onClick: () => {
              const url = packageUrl();
              openIssue("Issue Report", `[Package code to reproduce](${url})`);
            },
            children: [
              /* @__PURE__ */ jsx6(GitHubLogoIcon, { className: "rf-w-4 rf-h-4" }),
              "Report Issue"
            ]
          }
        )
      ] })
    ] });
  }
  const toggleError = (index) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  const toggleWarning = (index) => {
    setExpandedWarnings((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  return /* @__PURE__ */ jsx6(Fragment2, { children: /* @__PURE__ */ jsxs4("div", { className: "rf-w-full rf-flex rf-flex-col rf-h-full", children: [
    /* @__PURE__ */ jsxs4("div", { className: "rf-overflow-y-auto rf-min-h-0", children: [
      unifiedErrors.length > 0 && /* @__PURE__ */ jsxs4("div", { className: "rf-mt-2", children: [
        /* @__PURE__ */ jsxs4(
          "div",
          {
            className: "rf-text-xs rf-text-red-700 rf-font-semibold rf-px-2 rf-py-1 rf-bg-red-50 rf-border-b rf-border-red-200 rf-flex rf-items-center rf-gap-2 rf-cursor-pointer hover:rf-bg-red-100",
            onClick: () => setErrorsCollapsed(!errorsCollapsed),
            children: [
              errorsCollapsed ? /* @__PURE__ */ jsx6(ChevronRight2, { className: "rf-h-3 rf-w-3 rf-text-red-700" }) : /* @__PURE__ */ jsx6(ChevronDown, { className: "rf-h-3 rf-w-3 rf-text-red-700" }),
              /* @__PURE__ */ jsxs4("span", { children: [
                unifiedErrors.length,
                " ",
                unifiedErrors.length === 1 ? "error" : "errors"
              ] })
            ]
          }
        ),
        !errorsCollapsed && unifiedErrors.map((error, index) => {
          const isExpanded = expandedErrors.has(index);
          const previewMessage = error.message;
          const hasDetails = error.stack || evalVersion || softwareUsedString;
          return /* @__PURE__ */ jsxs4(
            "div",
            {
              className: "rf-bg-white hover:rf-bg-red-100",
              children: [
                /* @__PURE__ */ jsxs4(
                  "div",
                  {
                    className: "rf-flex rf-items-start rf-gap-1 rf-px-2 rf-pt-1 rf-pb-1 rf-cursor-pointer rf-bg-red-50/50",
                    onClick: () => hasDetails && toggleError(index),
                    children: [
                      /* @__PURE__ */ jsxs4(
                        "div",
                        {
                          className: "rf-flex rf-items-center rf-gap-2",
                          style: { marginTop: "2px" },
                          children: [
                            /* @__PURE__ */ jsx6(XCircle, { className: "rf-h-4 rf-w-4 rf-text-red-500 rf-flex-shrink-0" }),
                            hasDetails && /* @__PURE__ */ jsx6(
                              ChevronRight2,
                              {
                                className: `rf-h-3 rf-w-3 rf-text-red-500 rf-flex-shrink-0 rf-transition-transform ${isExpanded ? "rf-rotate-90" : ""}`
                              }
                            )
                          ]
                        }
                      ),
                      /* @__PURE__ */ jsxs4("div", { className: "rf-flex-1 rf-min-w-0 rf-leading-[1rem]", children: [
                        /* @__PURE__ */ jsxs4("span", { className: "rf-text-xs rf-font-mono rf-text-red-700 rf-leading-[0.95rem]", children: [
                          error.type,
                          ":"
                        ] }),
                        /* @__PURE__ */ jsx6("span", { className: "rf-text-xs rf-font-mono rf-text-red-600 rf-ml-1 rf-leading-[0.95rem]", children: error.message })
                      ] })
                    ]
                  }
                ),
                isExpanded && hasDetails && /* @__PURE__ */ jsxs4("div", { className: "rf-bg-red-50/50 rf-pl-12", children: [
                  error.stack?.split("\n").filter((line) => line.trim()).slice(1).map((line, i) => /* @__PURE__ */ jsx6("div", { className: "rf-px-2 rf-leading-tight", children: /* @__PURE__ */ jsx6("span", { className: "rf-text-xs rf-font-mono rf-text-red-500", children: line }) }, i)),
                  (evalVersion || softwareUsedString) && /* @__PURE__ */ jsx6("div", { className: "rf-px-2", children: /* @__PURE__ */ jsxs4("span", { className: "rf-text-xs rf-font-mono rf-text-red-400", children: [
                    evalVersion && `@tscircuit/eval@${evalVersion}`,
                    evalVersion && softwareUsedString && " \u2022 ",
                    softwareUsedString
                  ] }) })
                ] })
              ]
            },
            index
          );
        })
      ] }),
      unifiedWarnings.length > 0 && /* @__PURE__ */ jsxs4("div", { className: "rf-mt-2", children: [
        /* @__PURE__ */ jsxs4(
          "div",
          {
            className: "rf-text-xs rf-text-orange-700 rf-font-semibold rf-px-2 rf-py-1 rf-bg-orange-50 rf-border-b rf-border-orange-200 rf-flex rf-items-center rf-gap-2 rf-cursor-pointer hover:rf-bg-orange-100",
            onClick: () => setWarningsCollapsed(!warningsCollapsed),
            children: [
              warningsCollapsed ? /* @__PURE__ */ jsx6(ChevronRight2, { className: "rf-h-3 rf-w-3 rf-text-orange-700" }) : /* @__PURE__ */ jsx6(ChevronDown, { className: "rf-h-3 rf-w-3 rf-text-orange-700" }),
              /* @__PURE__ */ jsxs4("span", { children: [
                unifiedWarnings.length,
                " ",
                unifiedWarnings.length === 1 ? "warning" : "warnings"
              ] })
            ]
          }
        ),
        !warningsCollapsed && unifiedWarnings.map((warning, index) => {
          const isExpanded = expandedWarnings.has(index);
          const previewMessage = warning.message;
          const hasDetails = !!warning.stack;
          return /* @__PURE__ */ jsxs4(
            "div",
            {
              className: "rf-bg-white hover:rf-bg-orange-100",
              children: [
                /* @__PURE__ */ jsxs4(
                  "div",
                  {
                    className: "rf-flex rf-items-center rf-gap-2 rf-px-2 rf-py-1 rf-cursor-pointer rf-bg-orange-50/50",
                    onClick: () => hasDetails && toggleWarning(index),
                    children: [
                      /* @__PURE__ */ jsx6(AlertCircle, { className: "rf-h-4 rf-w-4 rf-text-orange-500 rf-flex-shrink-0" }),
                      hasDetails && /* @__PURE__ */ jsx6(
                        ChevronRight2,
                        {
                          className: `rf-h-3 rf-w-3 rf-text-orange-500 rf-flex-shrink-0 rf-transition-transform ${isExpanded ? "rf-rotate-90" : ""}`
                        }
                      ),
                      /* @__PURE__ */ jsxs4("div", { className: "rf-flex-1 rf-min-w-0 rf-flex rf-items-center rf-flex-wrap", children: [
                        /* @__PURE__ */ jsxs4("span", { className: "rf-text-xs rf-font-mono rf-text-orange-700 rf-break-words", children: [
                          warning.type,
                          ":"
                        ] }),
                        /* @__PURE__ */ jsx6("span", { className: "rf-text-xs rf-font-mono rf-text-orange-600 rf-ml-1 rf-break-words", children: warning.message })
                      ] })
                    ]
                  }
                ),
                isExpanded && hasDetails && /* @__PURE__ */ jsx6("div", { className: "rf-bg-orange-50/50 rf-pl-12", children: warning.stack?.split("\n").filter((line) => line.trim()).slice(1).map((line, i) => /* @__PURE__ */ jsx6("div", { className: "rf-px-2 rf-leading-tight", children: /* @__PURE__ */ jsx6("span", { className: "rf-text-xs rf-font-mono rf-text-orange-500", children: line }) }, i)) })
              ]
            },
            index
          );
        })
      ] })
    ] }),
    /* @__PURE__ */ jsxs4("div", { className: "rf-flex rf-gap-2 rf-mt-4 rf-justify-end rf-flex-shrink-0", children: [
      /* @__PURE__ */ jsx6(
        AutoroutingLogOptions,
        {
          autoroutingLog,
          onReportAutoroutingLog
        }
      ),
      /* @__PURE__ */ jsxs4(
        Button,
        {
          variant: "outline",
          className: "rf-p-1",
          onClick: () => {
            const firstIssue = unifiedErrors[0] ?? unifiedWarnings[0] ?? {
              type: "General Issue",
              message: "No error or warning details provided.",
              source: "execution"
            };
            let errorText = `${firstIssue.type}: ${firstIssue.message}`;
            if (evalVersion) errorText += `
@tscircuit/eval@${evalVersion}`;
            if (softwareUsedString) errorText += `
${softwareUsedString}`;
            if (firstIssue.stack) errorText += `
${firstIssue.stack}`;
            navigator.clipboard.writeText(errorText);
            toast.success("Error copied to clipboard!");
          },
          children: [
            /* @__PURE__ */ jsx6(ClipboardIcon, { className: "rf-w-4 rf-h-4" }),
            "Copy Error"
          ]
        }
      ),
      /* @__PURE__ */ jsxs4(
        Button,
        {
          variant: "outline",
          className: "rf-p-1",
          onClick: () => {
            const firstIssue = unifiedErrors[0] ?? unifiedWarnings[0] ?? {
              type: "General Issue",
              message: "No error or warning details provided.",
              source: "execution"
            };
            const title = `Error ${firstIssue.type}`.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").slice(0, 100);
            let errorDetails = `${firstIssue.type}: ${firstIssue.message}`;
            if (evalVersion)
              errorDetails += `
@tscircuit/eval@${evalVersion}`;
            if (softwareUsedString) errorDetails += `
${softwareUsedString}`;
            if (firstIssue.stack) errorDetails += `
${firstIssue.stack}`;
            let body = `[Package code to reproduce](${packageUrl()})

### Error
\`\`\`
${errorDetails}
\`\`\`
`;
            if (body.length > 35e3) {
              const truncatedMessage = firstIssue.message.length > 500 ? `${firstIssue.message.slice(0, 500)}...` : firstIssue.message;
              body = `[Package code to reproduce](${packageUrl()})

### Error
\`\`\`
${firstIssue.type}: ${truncatedMessage}
\`\`\``;
            }
            openIssue(title, body);
          },
          children: [
            /* @__PURE__ */ jsx6(GitHubLogoIcon, { className: "rf-w-4 rf-h-4" }),
            "Report Issue"
          ]
        }
      )
    ] })
  ] }) });
};

// lib/components/CircuitJsonPreview/CircuitJsonPreview.tsx
import {
  SchematicViewer,
  useSchematicViewerController
} from "@tscircuit/schematic-viewer";
import { AssemblyViewer, PinoutViewer } from "@tscircuit/assembly-viewer";

// lib/utils/getRandomTipForUser.ts
var tips = [
  "Initialize a tscircuit project using [tsci init](https://github.com/tscircuit/cli) before adding components.",
  "Define reusable modules with cached routes using [<subcircuit />](https://docs.tscircuit.com/elements/subcircuit)",
  "Run `tsci dev` on the command line to preview your boards before export",
  'Use units like mm or mils consistently across your designs (e.g. pcbX="10mm")',
  "Quickly set footprints with the [footprint prop](https://docs.tscircuit.com/footprints/footprinter-strings)",
  "Check out the guide on [ordering prototypes](https://docs.tscircuit.com/building-electronics/ordering-prototypes)",
  "Use [net labels](https://docs.tscircuit.com/elements/net) and [group elements](https://docs.tscircuit.com/elements/group) to organize complex schematics.",
  "You can manually drag components on the PCB and Schematic using [manual edits](https://docs.tscircuit.com/guides/manual-edits)",
  "Every tscircuit module can export to [Circuit JSON](https://github.com/tscircuit/circuit-json), Gerbers, Pick'n'Place CSV files, Bill of Materials CSV and more",
  "You can import components from [JLCPCB](https://docs.tscircuit.com/guides/importing-modules-and-chips/importing-from-jlcpcb) or [KiCad](https://docs.tscircuit.com/guides/importing-modules-and-chips/importing-from-kicad)",
  "Any module you push to the [registry](https://tscircuit.com/trending) will have [simple image urls](https://docs.tscircuit.com/web-apis/image-generation-api) you can use display images on a website",
  "The default [Parts Engine](https://docs.tscircuit.com/guides/platform-configuration) will automatically find parts from common vendors for your BOM",
  '[Pin selectors](https://docs.tscircuit.com/guides/using-sel-references) are similar to CSS selectors, ".R1 > .pin1" means "connect to the first pin of the component R1"',
  "You can use the [sel](https://docs.tscircuit.com/guides/using-sel-references) object to select pins in a type-safe way",
  "Publish modules via the [registry](https://tscircuit.com/trending) for working with a team or sharing your work",
  "[Explore tutorials](https://docs.tscircuit.com/category/tutorials) for real-world circuit design examples.",
  "Upload your Circuit JSON to [circuitjson.com](https://circuitjson.com) for a quick preview.",
  "You can display Circuit JSON in 3D, PCB or Schematic mode with the [<CircuitJsonPreview />](https://docs.tscircuit.com/guides/running-tscircuit/displaying-circuit-json-on-a-webpage#react-display-all-available-previews-with-circuitjsonpreview-) React component",
  "Use a [<group />](https://docs.tscircuit.com/elements/group) element to move multiple components at once in a schematic or PCB layout.",
  "Check out the [GitHub Discussions page](https://github.com/tscircuit/tscircuit/discussions) to upvote features",
  "You can customize the autorouter using the [autorouter prop](https://docs.tscircuit.com/elements/board#setting-the-autorouter)",
  "Use the [<constraint />](https://docs.tscircuit.com/footprints/constraint) element to enforce geometric relationships in PCB designs.",
  "When working on component placement and circuit design, autorouting can slow down your iteration cycle. Use [routingDisabled](https://docs.tscircuit.com/elements/board#disabling-routing-with-routingdisabled) on the <board /> element to disable autorouting temporarily.",
  "Join the [Discord server](https://tscircuit.com/join) to discuss issues and get help directly from the community."
];
var getRandomTipForUser = () => {
  let tip = tips[Math.floor(Math.random() * tips.length)];
  tip = tip.replace(/</g, "&lt;");
  tip = tip.replace(/>/g, "&gt;");
  tip = tip.replace(
    /(?<!href=")(?<!\()(?<!\]\()(https?:\/\/[^\s\)\]]+)/g,
    (match, p1) => `<a class="rf-text-blue-500 rf-underline"  href="${match}" target="_blank">${match}</a>`
  );
  tip = tip.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    '<a class="rf-text-blue-500 rf-underline" href="$2" target="_blank">$1</a>'
  );
  return tip;
};

// lib/components/PreviewEmptyState.tsx
import { LightbulbIcon, PlayIcon } from "lucide-react";
import { jsx as jsx7, jsxs as jsxs5 } from "react/jsx-runtime";
var tipHtml = getRandomTipForUser();
var PreviewEmptyState = ({ onRunClicked }) => {
  return /* @__PURE__ */ jsxs5("div", { className: "rf-flex rf-flex-col rf-items-center rf-justify-center rf-h-full rf-bg-gray-50 rf-text-gray-500 rf-p-4", children: [
    /* @__PURE__ */ jsx7(LightbulbIcon, { className: "rf-size-14 rf-mb-4" }),
    /* @__PURE__ */ jsxs5("p", { className: "rf-text-md rf-break-words rf-max-w-xl rf-text-center", children: [
      "Tip: ",
      /* @__PURE__ */ jsx7("span", { dangerouslySetInnerHTML: { __html: tipHtml } })
    ] }),
    onRunClicked && /* @__PURE__ */ jsxs5(
      Button,
      {
        className: "rf-mt-4 rf-bg-blue-600 rf-hover:bg-blue-500",
        onClick: onRunClicked,
        children: [
          "Run Code",
          /* @__PURE__ */ jsx7(PlayIcon, { className: "rf-w-3 rf-h-3 rf-ml-2" })
        ]
      }
    )
  ] });
};
var PreviewEmptyState_default = PreviewEmptyState;

// lib/components/CircuitJsonTableViewer/CircuitJsonTableViewer.tsx
import { useReducer, useState as useState2 } from "react";

// lib/components/CircuitJsonTableViewer/ClickableText.tsx
import { jsx as jsx8 } from "react/jsx-runtime";
var ClickableText = ({
  text,
  onClick
}) => {
  return /* @__PURE__ */ jsx8(
    "span",
    {
      className: "rf-cursor-pointer rf-underline rf-text-blue-600 rf-mx-2",
      onClick,
      children: text
    }
  );
};

// lib/components/CircuitJsonTableViewer/HeaderCell.tsx
import { jsx as jsx9, jsxs as jsxs6 } from "react/jsx-runtime";
var HeaderCell = (p) => {
  return /* @__PURE__ */ jsxs6("div", { className: "rf-leading-5", children: [
    /* @__PURE__ */ jsx9("div", { className: "rf-py-2 rf-font-bold", children: p.column.name }),
    /* @__PURE__ */ jsx9("div", { children: p.field?.() ?? /* @__PURE__ */ jsx9(
      "input",
      {
        type: "text",
        className: "rf-border rf-rounded rf-p-1 rf-w-full",
        onChange: (e) => {
          p.onTextChange?.(e.target.value);
        }
      }
    ) })
  ] });
};

// lib/components/CircuitJsonTableViewer/Modal.tsx
import { jsx as jsx10, jsxs as jsxs7 } from "react/jsx-runtime";
var Modal = ({ open, children, title, onClose }) => {
  if (!open) return null;
  return /* @__PURE__ */ jsx10(
    "div",
    {
      className: "rf-fixed rf-inset-0 rf-bg-black rf-bg-opacity-50 rf-flex rf-justify-center rf-items-center rf-z-50",
      onClick: onClose,
      children: /* @__PURE__ */ jsxs7(
        "div",
        {
          className: "rf-bg-white rf-p-5 rf-rounded-lg rf-relative rf-w-11/12 rf-max-w-2xl",
          onClick: (e) => {
            e.preventDefault();
            e.stopPropagation();
          },
          children: [
            /* @__PURE__ */ jsx10("h2", { className: "rf-mt-0 rf-text-md rf-pb-4", children: title }),
            /* @__PURE__ */ jsx10(
              "button",
              {
                type: "button",
                className: "rf-absolute rf-top-2 rf-right-4 rf-text-2xl rf-font-bold",
                onClick: onClose,
                children: "\xD7"
              }
            ),
            children
          ]
        }
      )
    }
  );
};
var Modal_default = Modal;

// lib/components/CircuitJsonTableViewer/CircuitJsonTableViewer.tsx
import { jsx as jsx11, jsxs as jsxs8 } from "react/jsx-runtime";
var CircuitJsonTableViewer = ({
  elements
}) => {
  const [modal, setModal] = useState2({ open: false });
  const [filters, setFilter] = useReducer(
    (s, a) => ({
      ...s,
      ...a
    }),
    {}
  );
  const element_types = [...new Set(elements.map((e) => e.type))];
  const elements2 = elements.map((e) => {
    const primary_id = e[`${e.type}_id`];
    const other_ids = Object.fromEntries(
      Object.entries(e).filter(([k]) => {
        if (k === `${e.type}_id`) return false;
        if (!k.endsWith("_id")) return false;
        return true;
      })
    );
    const other_props = Object.fromEntries(
      Object.entries(e).filter(([k]) => !k.endsWith("_id"))
    );
    return {
      primary_id,
      other_ids,
      ...other_props,
      _og_elm: e
    };
  });
  const elements3 = elements2.map((e) => {
    let selector_path = "";
    const getSelectorPath = (e2) => {
      const parent_key = Object.keys(e2.other_ids).find(
        (k) => k.startsWith("source_")
      );
      if (!parent_key) return `.${e2.name}`;
      const parent_type = parent_key.slice(0, -3);
      const parent = elements2.find(
        (p) => p.type === parent_type && p.primary_id === e2.other_ids[parent_key]
      );
      if (!parent) return `??? > .${e2.name}`;
      if (!("name" in parent)) return `#${parent.primary_id} > .${e2.name}`;
      return `${getSelectorPath(parent)} > .${e2.name}`;
    };
    if ("name" in e) {
      selector_path = getSelectorPath(e);
    }
    return {
      ...e,
      selector_path
    };
  });
  const columns = [
    {
      key: "primary_id",
      name: "primary_id",
      renderCell: (row) => /* @__PURE__ */ jsxs8("div", { className: "rf-flex rf-items-center", children: [
        /* @__PURE__ */ jsx11(
          ClickableText,
          {
            text: row.primary_id,
            onClick: () => setFilter({
              focused_id: row.primary_id,
              id_search: void 0,
              selector_search: void 0
            })
          }
        ),
        /* @__PURE__ */ jsx11("span", { className: "rf-flex-grow" }),
        /* @__PURE__ */ jsx11(
          ClickableText,
          {
            text: "(JSON)",
            onClick: () => setModal({
              open: true,
              element: row._og_elm,
              title: row.primary_id
            })
          }
        )
      ] }),
      renderHeaderCell: (col) => /* @__PURE__ */ jsx11(
        HeaderCell,
        {
          column: col,
          onTextChange: (v) => setFilter({ id_search: v }),
          field: !filters.focused_id ? void 0 : () => /* @__PURE__ */ jsxs8("div", { children: [
            "Focus:",
            " ",
            /* @__PURE__ */ jsx11("span", { className: "rf-underline", children: filters.focused_id }),
            /* @__PURE__ */ jsx11(
              ClickableText,
              {
                text: "(unfocus)",
                onClick: () => setFilter({ focused_id: void 0 })
              }
            )
          ] })
        }
      )
    },
    {
      key: "type",
      name: "type",
      renderHeaderCell: (col) => /* @__PURE__ */ jsx11(
        HeaderCell,
        {
          column: col,
          field: () => /* @__PURE__ */ jsxs8(
            "select",
            {
              onChange: (e) => setFilter({ component_type_filter: e.target.value }),
              className: "rf-border rf-rounded rf-p-1 rf-w-full",
              children: [
                /* @__PURE__ */ jsx11("option", { value: "any", children: "any" }, "any"),
                /* @__PURE__ */ jsx11("option", { value: "source", children: "source" }, "source"),
                /* @__PURE__ */ jsx11("option", { value: "source/pcb", children: "source/pcb" }, "source/pcb"),
                /* @__PURE__ */ jsx11("option", { value: "source/schematic", children: "source/schematic" }, "source/schematic"),
                element_types.map((type) => /* @__PURE__ */ jsx11("option", { value: type, children: type }, type))
              ]
            }
          )
        }
      )
    },
    {
      key: "name",
      name: "name",
      renderHeaderCell: (col) => /* @__PURE__ */ jsx11(
        HeaderCell,
        {
          column: col,
          onTextChange: (t) => setFilter({ name_search: t })
        }
      )
    },
    {
      key: "selector_path",
      name: "selector_path",
      renderHeaderCell: (col) => /* @__PURE__ */ jsx11(
        HeaderCell,
        {
          column: col,
          onTextChange: (t) => setFilter({ selector_search: t })
        }
      )
    },
    {
      key: "other_ids",
      name: "other_ids",
      renderCell: (row) => /* @__PURE__ */ jsx11("div", { className: "rf-space-x-2", children: Object.entries(row.other_ids).map(([other_id, v]) => /* @__PURE__ */ jsx11(
        ClickableText,
        {
          text: v,
          onClick: () => setFilter({ focused_id: v })
        },
        v
      )) })
    }
  ];
  const elements4 = elements3.filter((e) => {
    if (!filters.name_search) return true;
    return e.name?.toLowerCase()?.includes(filters.name_search.toLowerCase());
  }).filter((e) => {
    if (!filters.component_type_filter) return true;
    if (filters.component_type_filter === "any") return true;
    if (filters.component_type_filter === "source") {
      return e.type.startsWith("source_");
    }
    if (filters.component_type_filter === "source/pcb") {
      return e.type.startsWith("source_") || e.type.startsWith("pcb_");
    }
    if (filters.component_type_filter === "source/schematic") {
      return e.type.startsWith("source_") || e.type.startsWith("schematic_");
    }
    return e.type?.includes(filters.component_type_filter);
  }).filter((e) => {
    if (!filters.selector_search) return true;
    const parts = filters.selector_search.split(" ").filter((p) => p.length > 0);
    return parts.every((part) => e.selector_path?.includes(part));
  }).filter((e) => {
    if (!filters.id_search) return true;
    return e.primary_id?.includes(filters.id_search);
  }).filter((e) => {
    if (!filters.focused_id) return true;
    if (e.primary_id === filters.focused_id) return true;
    if (Object.values(e.other_ids).includes(filters.focused_id)) return true;
    return false;
  });
  return /* @__PURE__ */ jsxs8("div", { className: "rf-font-mono rf-text-xs rf-bg-white", children: [
    /* @__PURE__ */ jsx11("div", { className: "rf-overflow-x-auto", children: /* @__PURE__ */ jsxs8("table", { className: "rf-table-auto rf-w-full rf-text-left", children: [
      /* @__PURE__ */ jsx11("thead", { children: /* @__PURE__ */ jsx11("tr", { children: columns.map((col) => /* @__PURE__ */ jsx11("th", { className: "rf-px-4 rf-py-2 rf-border-b", children: col.renderHeaderCell ? col.renderHeaderCell(col) : col.name }, col.key)) }) }),
      /* @__PURE__ */ jsx11("tbody", { children: elements4.map((row, rowIndex) => /* @__PURE__ */ jsx11("tr", { className: "rf-hover:bg-gray-100", children: columns.map((col) => /* @__PURE__ */ jsx11("td", { className: "rf-px-4 rf-py-2 rf-border-b", children: col.renderCell ? col.renderCell(row) : row[col.key] }, col.key)) }, rowIndex)) })
    ] }) }),
    /* @__PURE__ */ jsx11(
      Modal_default,
      {
        open: modal.open,
        onClose: () => setModal({ open: false }),
        title: modal.open ? modal.title : "",
        children: /* @__PURE__ */ jsx11("div", { className: "rf-bg-gray-800 rf-p-3 rf-text-white rf-rounded", children: /* @__PURE__ */ jsx11("pre", { className: "rf-whitespace-pre-wrap", children: modal.open ? JSON.stringify(modal.element, null, 2) : "" }) })
      }
    )
  ] });
};

// lib/components/BomTable/BomTable.tsx
import importer from "@tscircuit/internal-dynamic-import";
import { useEffect as useEffect2, useState as useState3 } from "react";

// lib/components/BomTable/bom-table.columns.tsx
import { jsx as jsx12 } from "react/jsx-runtime";
var linkify = (supplier, partNumber) => {
  if (supplier === "jlcpcb") {
    return /* @__PURE__ */ jsx12(
      "a",
      {
        className: "rf-underline rf-text-blue-500",
        target: "_blank",
        rel: "noreferrer",
        href: `https://jlcpcb.com/partdetail/${partNumber}`,
        children: partNumber
      }
    );
  }
  return partNumber;
};
var formatManufacturerMpnPairs = (pairs) => pairs?.map(({ manufacturer, mpn }) => `${manufacturer}: ${mpn}`).join(", ");
var getBomMetadata = (rows) => {
  const extraColumns = /* @__PURE__ */ new Set();
  let hasSupplierColumn = false;
  let hasManufacturerColumn = false;
  for (const row of rows) {
    if (row.supplier_part_number_columns?.["JLCPCB Part #"] !== void 0) {
      hasSupplierColumn = true;
    }
    for (const extraColumnName of Object.keys(row.extra_columns ?? {})) {
      extraColumns.add(extraColumnName);
    }
    if ((row.manufacturer_mpn_pairs?.length ?? 0) > 0) {
      hasManufacturerColumn = true;
    }
  }
  return {
    extraColumnNames: [...extraColumns],
    hasSupplierColumn,
    hasManufacturerColumn
  };
};
var getBomCellDescriptors = (bomMetadata) => {
  const bomCellDescriptors = [
    {
      key: "designator",
      label: "Designator",
      getCell: (row) => row.designator
    },
    {
      key: "comment",
      label: "Comment",
      getCell: (row) => row.comment
    },
    {
      key: "value",
      label: "Component Value",
      getCell: (row) => row.value
    },
    {
      key: "footprint",
      label: "Footprint",
      getCell: (row) => row.footprint
    }
  ];
  if (bomMetadata.hasSupplierColumn) {
    bomCellDescriptors.push({
      key: "supplier:JLCPCB Part #",
      label: "JLCPCB Part #",
      getCell: (row) => {
        const partNumber = row.supplier_part_number_columns?.["JLCPCB Part #"];
        return partNumber ? linkify("jlcpcb", partNumber) : "";
      }
    });
  }
  if (bomMetadata.hasManufacturerColumn) {
    bomCellDescriptors.push({
      key: "manufacturer_mpn_pairs",
      label: "Manufacturer / MPN",
      getCell: (row) => formatManufacturerMpnPairs(row.manufacturer_mpn_pairs)
    });
  }
  for (const extraColumnName of bomMetadata.extraColumnNames) {
    bomCellDescriptors.push({
      key: `extra:${extraColumnName}`,
      label: extraColumnName,
      getCell: (row) => row.extra_columns?.[extraColumnName] || ""
    });
  }
  return bomCellDescriptors;
};

// lib/components/BomTable/BomTable.tsx
import { jsx as jsx13, jsxs as jsxs9 } from "react/jsx-runtime";
var BomTable = ({ circuitJson }) => {
  const [rows, setRows] = useState3(null);
  const [error, setError] = useState3(null);
  useEffect2(() => {
    let cancelled = false;
    const loadBomTable = async () => {
      try {
        setError(null);
        setRows(null);
        const { convertCircuitJsonToBomRows } = await importer(
          "circuit-json-to-bom-csv"
        );
        const bomRows = await convertCircuitJsonToBomRows({
          circuitJson
        });
        if (!cancelled) {
          setRows(bomRows);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown BOM error");
        }
      }
    };
    void loadBomTable();
    return () => {
      cancelled = true;
    };
  }, [circuitJson]);
  if (error) {
    throw new Error(error);
  }
  const bomMetadata = getBomMetadata(rows ?? []);
  const bomCellDescriptors = getBomCellDescriptors(bomMetadata);
  if (!rows) {
    return /* @__PURE__ */ jsx13("div", { className: "rf-p-4 rf-text-sm rf-text-muted-foreground", children: "Loading BOM..." });
  }
  return /* @__PURE__ */ jsx13("div", { className: "rf-overflow-x-auto", children: /* @__PURE__ */ jsxs9("table", { className: "rf-w-full rf-text-left rf-text-sm", children: [
    /* @__PURE__ */ jsx13("thead", { children: /* @__PURE__ */ jsx13("tr", { className: "rf-border-b", children: bomCellDescriptors.map((bomCellDescriptor) => /* @__PURE__ */ jsx13("th", { className: "rf-p-2", children: bomCellDescriptor.label }, bomCellDescriptor.key)) }) }),
    /* @__PURE__ */ jsx13("tbody", { children: rows.map((row, rowIndex) => /* @__PURE__ */ jsx13("tr", { className: "rf-border-b", children: bomCellDescriptors.map((bomCellDescriptor) => /* @__PURE__ */ jsx13("td", { className: "rf-p-2", children: bomCellDescriptor.getCell(row) }, bomCellDescriptor.key)) }, row.designator || `${rowIndex}`)) })
  ] }) });
};

// lib/components/CircuitJsonPreview/CircuitJsonPreview.tsx
import { AnalogSimulationViewer } from "@tscircuit/schematic-viewer";
import {
  CheckIcon,
  EllipsisIcon,
  FullscreenIcon,
  Loader2 as Loader27,
  LoaderCircleIcon,
  MinimizeIcon,
  Circle as Circle2
} from "lucide-react";

// lib/components/ui/input.tsx
import * as React5 from "react";
import { jsx as jsx14 } from "react/jsx-runtime";
var Input = React5.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx14(
      "input",
      {
        type,
        className: cn(
          "rf-flex rf-h-9 rf-w-full rf-rounded-md rf-border rf-border-zinc-200 rf-bg-white rf-px-3 rf-py-1 rf-text-sm rf-shadow-sm rf-transition-colors file:rf-border-0 file:rf-bg-transparent file:rf-text-sm file:rf-font-medium placeholder:rf-text-zinc-500 focus-visible:rf-outline-none focus-visible:rf-ring-1 focus-visible:rf-ring-zinc-950 disabled:rf-cursor-not-allowed disabled:rf-opacity-50 dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:rf-placeholder-zinc-400 dark:focus-visible:rf-ring-zinc-300",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";

// lib/components/PcbViewerWithContainerHeight.tsx
import { PCBViewer } from "@tscircuit/pcb-viewer";
import { useLayoutEffect, useRef, useState as useState4 } from "react";
import { jsx as jsx15 } from "react/jsx-runtime";
var PcbViewerWithContainerHeight = ({
  circuitJson,
  containerClassName,
  ...props
}) => {
  const containerRef = useRef(null);
  const [computedHeight, setComputedHeight] = useState4(620);
  useLayoutEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const screenHeight = window.innerHeight;
        setComputedHeight(
          Math.min(Math.max(containerHeight, 620), screenHeight)
        );
      }
    };
    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", updateHeight);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);
  return /* @__PURE__ */ jsx15(
    "div",
    {
      ref: containerRef,
      className: containerClassName || "rf-w-full rf-h-full",
      children: /* @__PURE__ */ jsx15(
        PCBViewer,
        {
          ...props,
          circuitJson,
          height: computedHeight
        }
      )
    }
  );
};

// lib/hooks/use-styles.ts
import { useEffect as useEffect3 } from "react";

// lib/hooks/styles.generated.ts
var styles_generated_default = '*,:after,:before{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x: ;--tw-pan-y: ;--tw-pinch-zoom: ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position: ;--tw-gradient-via-position: ;--tw-gradient-to-position: ;--tw-ordinal: ;--tw-slashed-zero: ;--tw-numeric-figure: ;--tw-numeric-spacing: ;--tw-numeric-fraction: ;--tw-ring-inset: ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgba(59,130,246,.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur: ;--tw-brightness: ;--tw-contrast: ;--tw-grayscale: ;--tw-hue-rotate: ;--tw-invert: ;--tw-saturate: ;--tw-sepia: ;--tw-drop-shadow: ;--tw-backdrop-blur: ;--tw-backdrop-brightness: ;--tw-backdrop-contrast: ;--tw-backdrop-grayscale: ;--tw-backdrop-hue-rotate: ;--tw-backdrop-invert: ;--tw-backdrop-opacity: ;--tw-backdrop-saturate: ;--tw-backdrop-sepia: ;--tw-contain-size: ;--tw-contain-layout: ;--tw-contain-paint: ;--tw-contain-style: }/*! tailwindcss v3.4.19 | MIT License | https://tailwindcss.com*/*,:after,:before{border:0 solid #e5e7eb;box-sizing:border-box}:after,:before{--tw-content:""}:host,html{line-height:1.5;-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;font-feature-settings:normal;font-variation-settings:normal;-moz-tab-size:4;-o-tab-size:4;tab-size:4;-webkit-tap-highlight-color:transparent}body{line-height:inherit;margin:0}hr{border-top-width:1px;color:inherit;height:0}abbr:where([title]){-webkit-text-decoration:underline dotted;text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-feature-settings:normal;font-size:1em;font-variation-settings:normal}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-.25em}sup{top:-.5em}table{border-collapse:collapse;border-color:inherit;text-indent:0}button,input,optgroup,select,textarea{color:inherit;font-family:inherit;font-feature-settings:inherit;font-size:100%;font-variation-settings:inherit;font-weight:inherit;letter-spacing:inherit;line-height:inherit;margin:0;padding:0}button,select{text-transform:none}button,input:where([type=button]),input:where([type=reset]),input:where([type=submit]){-webkit-appearance:button;background-color:transparent;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dd,dl,figure,h1,h2,h3,h4,h5,h6,hr,p,pre{margin:0}fieldset{margin:0}fieldset,legend{padding:0}menu,ol,ul{list-style:none;margin:0;padding:0}dialog{padding:0}textarea{resize:vertical}input::-moz-placeholder,textarea::-moz-placeholder{color:#9ca3af;opacity:1}input::placeholder,textarea::placeholder{color:#9ca3af;opacity:1}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{height:auto;max-width:100%}[hidden]:where(:not([hidden=until-found])){display:none}:root{--radius:0.5rem}.rf-pointer-events-none{pointer-events:none}.rf-invisible{visibility:hidden}.rf-fixed{position:fixed}.rf-absolute{position:absolute}.rf-relative{position:relative}.rf-inset-0{inset:0}.-rf-left-2{left:-.5rem}.-rf-right-10{right:-2.5rem}.-rf-right-2{right:-.5rem}.-rf-right-4{right:-1rem}.-rf-right-6{right:-1.5rem}.-rf-right-7{right:-1.75rem}.-rf-right-8{right:-2rem}.-rf-right-9{right:-2.25rem}.rf-bottom-full{bottom:100%}.rf-left-0{left:0}.rf-left-1{left:.25rem}.rf-left-1\\/2{left:50%}.rf-left-2{left:.5rem}.rf-left-\\[50\\%\\]{left:50%}.rf-right-0{right:0}.rf-right-1{right:.25rem}.rf-right-4{right:1rem}.rf-right-\\[4px\\]{right:4px}.rf-top-0{top:0}.rf-top-1{top:.25rem}.rf-top-2{top:.5rem}.rf-top-2\\.5{top:.625rem}.rf-top-\\[50\\%\\]{top:50%}.rf-top-\\[6px\\]{top:6px}.\\!rf-z-\\[101\\]{z-index:101!important}.\\!rf-z-\\[200\\]{z-index:200!important}.rf-z-10{z-index:10}.rf-z-50{z-index:50}.rf-z-\\[100\\]{z-index:100}.rf-z-\\[101\\]{z-index:101}.rf-z-\\[102\\]{z-index:102}.rf-order-1{order:1}.rf-order-2{order:2}.rf-order-3{order:3}.rf-m-0{margin:0}.rf-m-1{margin:.25rem}.rf-m-6{margin:1.5rem}.-rf-mx-1,.rf--mx-1{margin-left:-.25rem;margin-right:-.25rem}.rf-mx-1{margin-left:.25rem;margin-right:.25rem}.rf-mx-2{margin-left:.5rem;margin-right:.5rem}.rf-mx-4{margin-left:1rem;margin-right:1rem}.rf-mx-auto{margin-left:auto;margin-right:auto}.rf-my-1{margin-bottom:.25rem;margin-top:.25rem}.rf-my-12{margin-bottom:3rem;margin-top:3rem}.rf-my-4{margin-bottom:1rem;margin-top:1rem}.rf-my-auto{margin-bottom:auto;margin-top:auto}.rf-mb-0{margin-bottom:0}.rf-mb-0\\.5{margin-bottom:.125rem}.rf-mb-1{margin-bottom:.25rem}.rf-mb-12{margin-bottom:3rem}.rf-mb-2{margin-bottom:.5rem}.rf-mb-3{margin-bottom:.75rem}.rf-mb-4{margin-bottom:1rem}.rf-mb-6{margin-bottom:1.5rem}.rf-mb-7{margin-bottom:1.75rem}.rf-mb-8{margin-bottom:2rem}.rf-ml-1{margin-left:.25rem}.rf-ml-2{margin-left:.5rem}.rf-ml-6{margin-left:1.5rem}.rf-ml-auto{margin-left:auto}.rf-mr-1{margin-right:.25rem}.rf-mr-2{margin-right:.5rem}.rf-mr-4{margin-right:1rem}.rf-mr-auto{margin-right:auto}.rf-mt-0{margin-top:0}.rf-mt-0\\.5{margin-top:.125rem}.rf-mt-1{margin-top:.25rem}.rf-mt-2{margin-top:.5rem}.rf-mt-3{margin-top:.75rem}.rf-mt-4{margin-top:1rem}.rf-mt-5{margin-top:1.25rem}.rf-mt-auto{margin-top:auto}.rf-block{display:block}.rf-inline-block{display:inline-block}.rf-inline{display:inline}.rf-flex{display:flex}.rf-inline-flex{display:inline-flex}.rf-grid{display:grid}.rf-hidden{display:none}.rf-aspect-\\[4\\/3\\]{aspect-ratio:4/3}.rf-aspect-square{aspect-ratio:1/1}.rf-aspect-video{aspect-ratio:16/9}.rf-size-14{height:3.5rem;width:3.5rem}.rf-size-2{height:.5rem;width:.5rem}.rf-size-3{height:.75rem;width:.75rem}.rf-size-4{height:1rem;width:1rem}.\\!rf-h-2{height:.5rem!important}.\\!rf-h-2\\.5{height:.625rem!important}.rf-h-0{height:0}.rf-h-0\\.5{height:.125rem}.rf-h-1{height:.25rem}.rf-h-10{height:2.5rem}.rf-h-12{height:3rem}.rf-h-2{height:.5rem}.rf-h-2\\.5{height:.625rem}.rf-h-20{height:5rem}.rf-h-24{height:6rem}.rf-h-3{height:.75rem}.rf-h-3\\.5{height:.875rem}.rf-h-4{height:1rem}.rf-h-5{height:1.25rem}.rf-h-6{height:1.5rem}.rf-h-60{height:15rem}.rf-h-64{height:16rem}.rf-h-7{height:1.75rem}.rf-h-8{height:2rem}.rf-h-9{height:2.25rem}.rf-h-\\[400px\\]{height:400px}.rf-h-\\[calc\\(100vh-52px\\)\\]{height:calc(100vh - 52px)}.rf-h-\\[calc\\(100vh-60px\\)\\]{height:calc(100vh - 60px)}.rf-h-\\[var\\(--radix-select-trigger-height\\)\\]{height:var(--radix-select-trigger-height)}.rf-h-auto{height:auto}.rf-h-fit{height:-moz-fit-content;height:fit-content}.rf-h-full{height:100%}.rf-h-px{height:1px}.rf-h-screen{height:100vh}.\\!rf-max-h-\\[40vh\\]{max-height:40vh!important}.\\!rf-max-h-\\[80vh\\]{max-height:80vh!important}.rf-max-h-16{max-height:4rem}.rf-max-h-20{max-height:5rem}.rf-max-h-24{max-height:6rem}.rf-max-h-28{max-height:7rem}.rf-max-h-32{max-height:8rem}.rf-max-h-64{max-height:16rem}.rf-max-h-96{max-height:24rem}.rf-max-h-\\[120px\\]{max-height:120px}.rf-max-h-\\[150px\\]{max-height:150px}.rf-max-h-\\[200px\\]{max-height:200px}.rf-max-h-\\[300px\\]{max-height:300px}.rf-max-h-\\[90vh\\]{max-height:90vh}.rf-max-h-full{max-height:100%}.rf-max-h-none{max-height:none}.rf-min-h-0{min-height:0}.rf-min-h-56{min-height:14rem}.rf-min-h-72{min-height:18rem}.rf-min-h-\\[100px\\]{min-height:100px}.rf-min-h-\\[200px\\]{min-height:200px}.rf-min-h-\\[300px\\]{min-height:300px}.rf-min-h-\\[360px\\]{min-height:360px}.rf-min-h-\\[400px\\]{min-height:400px}.rf-min-h-\\[620px\\]{min-height:620px}.rf-min-h-\\[calc\\(100vh-240px\\)\\]{min-height:calc(100vh - 240px)}.rf-min-h-full{min-height:100%}.\\!rf-w-2{width:.5rem!important}.\\!rf-w-2\\.5{width:.625rem!important}.\\!rf-w-\\[95vw\\]{width:95vw!important}.rf-w-1{width:.25rem}.rf-w-10{width:2.5rem}.rf-w-11{width:2.75rem}.rf-w-11\\/12{width:91.666667%}.rf-w-12{width:3rem}.rf-w-16{width:4rem}.rf-w-2{width:.5rem}.rf-w-2\\.5{width:.625rem}.rf-w-20{width:5rem}.rf-w-24{width:6rem}.rf-w-28{width:7rem}.rf-w-3{width:.75rem}.rf-w-3\\.5{width:.875rem}.rf-w-32{width:8rem}.rf-w-4{width:1rem}.rf-w-40{width:10rem}.rf-w-48{width:12rem}.rf-w-5{width:1.25rem}.rf-w-6{width:1.5rem}.rf-w-64{width:16rem}.rf-w-7{width:1.75rem}.rf-w-72{width:18rem}.rf-w-8{width:2rem}.rf-w-80{width:20rem}.rf-w-9{width:2.25rem}.rf-w-96{width:24rem}.rf-w-fit{width:-moz-fit-content;width:fit-content}.rf-w-full{width:100%}.rf-w-screen{width:100vw}.rf-min-w-0{min-width:0}.rf-min-w-10{min-width:2.5rem}.rf-min-w-16{min-width:4rem}.rf-min-w-32{min-width:8rem}.rf-min-w-80{min-width:20rem}.rf-min-w-96{min-width:24rem}.rf-min-w-\\[12px\\]{min-width:12px}.rf-min-w-\\[148px\\]{min-width:148px}.rf-min-w-\\[192px\\]{min-width:192px}.rf-min-w-\\[600px\\]{min-width:600px}.rf-min-w-\\[8rem\\]{min-width:8rem}.rf-min-w-\\[var\\(--radix-select-trigger-width\\)\\]{min-width:var(--radix-select-trigger-width)}.\\!rf-max-w-\\[95vw\\]{max-width:95vw!important}.rf-max-w-2xl{max-width:42rem}.rf-max-w-3xl{max-width:48rem}.rf-max-w-4xl{max-width:56rem}.rf-max-w-5xl{max-width:64rem}.rf-max-w-64{max-width:16rem}.rf-max-w-7xl{max-width:80rem}.rf-max-w-96{max-width:24rem}.rf-max-w-\\[1000px\\]{max-width:1000px}.rf-max-w-\\[150px\\]{max-width:150px}.rf-max-w-\\[200px\\]{max-width:200px}.rf-max-w-\\[320px\\]{max-width:320px}.rf-max-w-\\[40\\%\\]{max-width:40%}.rf-max-w-\\[600px\\]{max-width:600px}.rf-max-w-full{max-width:100%}.rf-max-w-lg{max-width:32rem}.rf-max-w-md{max-width:28rem}.rf-max-w-none{max-width:none}.rf-max-w-xl{max-width:36rem}.rf-max-w-xs{max-width:20rem}.rf-flex-1{flex:1 1 0%}.rf-flex-shrink-0,.rf-shrink-0{flex-shrink:0}.rf-flex-grow{flex-grow:1}.rf-table-auto{table-layout:auto}.rf-origin-\\[--radix-popover-content-transform-origin\\]{transform-origin:var(--radix-popover-content-transform-origin)}.-rf-translate-x-1{--tw-translate-x:-0.25rem}.-rf-translate-x-1,.-rf-translate-x-1\\/2{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.-rf-translate-x-1\\/2{--tw-translate-x:-50%}.-rf-translate-y-1{--tw-translate-y:-0.25rem}.-rf-translate-y-1,.rf--translate-x-1{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rf--translate-x-1{--tw-translate-x:-0.25rem}.rf--translate-x-1\\/2{--tw-translate-x:-50%}.rf--translate-x-1\\/2,.rf--translate-y-0{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rf--translate-y-0{--tw-translate-y:-0px}.rf--translate-y-1{--tw-translate-y:-0.25rem}.rf--translate-y-1,.rf-translate-x-\\[-50\\%\\]{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rf-translate-x-\\[-50\\%\\]{--tw-translate-x:-50%}.rf-translate-y-\\[-50\\%\\]{--tw-translate-y:-50%}.-rf-rotate-90,.rf-translate-y-\\[-50\\%\\]{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.-rf-rotate-90{--tw-rotate:-90deg}.rf-rotate-90{--tw-rotate:90deg}.rf-rotate-90,.rf-transform{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}@keyframes rf-pulse{50%{opacity:.5}}.rf-animate-pulse{animation:rf-pulse 2s cubic-bezier(.4,0,.6,1) infinite}@keyframes rf-spin{to{transform:rotate(1turn)}}.rf-animate-spin{animation:rf-spin 1s linear infinite}.rf-cursor-default{cursor:default}.rf-cursor-not-allowed{cursor:not-allowed}.rf-cursor-pointer{cursor:pointer}.rf-select-none{-webkit-user-select:none;-moz-user-select:none;user-select:none}.rf-grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}.rf-grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.rf-grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.rf-flex-row{flex-direction:row}.rf-flex-col{flex-direction:column}.rf-flex-col-reverse{flex-direction:column-reverse}.rf-flex-wrap{flex-wrap:wrap}.rf-place-content-center{place-content:center}.rf-place-items-center{place-items:center}.rf-items-start{align-items:flex-start}.rf-items-end{align-items:flex-end}.rf-items-center{align-items:center}.rf-items-baseline{align-items:baseline}.rf-items-stretch{align-items:stretch}.rf-justify-end{justify-content:flex-end}.rf-justify-center{justify-content:center}.rf-justify-between{justify-content:space-between}.rf-gap-0{gap:0}.rf-gap-1{gap:.25rem}.rf-gap-1\\.5{gap:.375rem}.rf-gap-2{gap:.5rem}.rf-gap-3{gap:.75rem}.rf-gap-4{gap:1rem}.rf-gap-5{gap:1.25rem}.rf-gap-6{gap:1.5rem}.rf-gap-8{gap:2rem}.rf-gap-x-5{-moz-column-gap:1.25rem;column-gap:1.25rem}.rf-gap-y-1{row-gap:.25rem}.rf-space-x-2>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-left:calc(.5rem*(1 - var(--tw-space-x-reverse)));margin-right:calc(.5rem*var(--tw-space-x-reverse))}.rf-space-y-1>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(.25rem*var(--tw-space-y-reverse));margin-top:calc(.25rem*(1 - var(--tw-space-y-reverse)))}.rf-space-y-2>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(.5rem*var(--tw-space-y-reverse));margin-top:calc(.5rem*(1 - var(--tw-space-y-reverse)))}.rf-space-y-3>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(.75rem*var(--tw-space-y-reverse));margin-top:calc(.75rem*(1 - var(--tw-space-y-reverse)))}.rf-space-y-4>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(1rem*var(--tw-space-y-reverse));margin-top:calc(1rem*(1 - var(--tw-space-y-reverse)))}.rf-space-y-6>:not([hidden])~:not([hidden]){--tw-space-y-reverse:0;margin-bottom:calc(1.5rem*var(--tw-space-y-reverse));margin-top:calc(1.5rem*(1 - var(--tw-space-y-reverse)))}.rf-divide-y>:not([hidden])~:not([hidden]){--tw-divide-y-reverse:0;border-bottom-width:calc(1px*var(--tw-divide-y-reverse));border-top-width:calc(1px*(1 - var(--tw-divide-y-reverse)))}.rf-overflow-auto{overflow:auto}.rf-overflow-hidden{overflow:hidden}.rf-overflow-visible{overflow:visible}.rf-overflow-x-auto{overflow-x:auto}.\\!rf-overflow-y-auto{overflow-y:auto!important}.rf-overflow-y-auto{overflow-y:auto}.rf-overflow-x-hidden{overflow-x:hidden}.rf-overflow-x-clip{overflow-x:clip}.rf-truncate{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rf-whitespace-normal{white-space:normal}.rf-whitespace-nowrap{white-space:nowrap}.rf-whitespace-pre-wrap{white-space:pre-wrap}.rf-text-nowrap{text-wrap:nowrap}.rf-break-words{overflow-wrap:break-word}.rf-break-all{word-break:break-all}.rf-rounded{border-radius:.25rem}.rf-rounded-2xl{border-radius:1rem}.rf-rounded-full{border-radius:9999px}.rf-rounded-lg{border-radius:var(--radius)}.rf-rounded-md{border-radius:calc(var(--radius) - 2px)}.rf-rounded-none{border-radius:0}.rf-rounded-sm{border-radius:calc(var(--radius) - 4px)}.rf-rounded-xl{border-radius:.75rem}.rf-border{border-width:1px}.rf-border-0{border-width:0}.rf-border-2{border-width:2px}.rf-border-y{border-top-width:1px}.rf-border-b,.rf-border-y{border-bottom-width:1px}.rf-border-l-2{border-left-width:2px}.rf-border-l-4{border-left-width:4px}.rf-border-r{border-right-width:1px}.rf-border-t{border-top-width:1px}.rf-border-none{border-style:none}.rf-border-blue-100{--tw-border-opacity:1;border-color:rgb(219 234 254/var(--tw-border-opacity,1))}.rf-border-blue-200{--tw-border-opacity:1;border-color:rgb(191 219 254/var(--tw-border-opacity,1))}.rf-border-blue-300{--tw-border-opacity:1;border-color:rgb(147 197 253/var(--tw-border-opacity,1))}.rf-border-blue-400{--tw-border-opacity:1;border-color:rgb(96 165 250/var(--tw-border-opacity,1))}.rf-border-blue-500{--tw-border-opacity:1;border-color:rgb(59 130 246/var(--tw-border-opacity,1))}.rf-border-blue-600{--tw-border-opacity:1;border-color:rgb(37 99 235/var(--tw-border-opacity,1))}.rf-border-border{border-color:hsl(var(--border))}.rf-border-emerald-500{--tw-border-opacity:1;border-color:rgb(16 185 129/var(--tw-border-opacity,1))}.rf-border-gray-100{--tw-border-opacity:1;border-color:rgb(243 244 246/var(--tw-border-opacity,1))}.rf-border-gray-200{--tw-border-opacity:1;border-color:rgb(229 231 235/var(--tw-border-opacity,1))}.rf-border-gray-300{--tw-border-opacity:1;border-color:rgb(209 213 219/var(--tw-border-opacity,1))}.rf-border-green-200{--tw-border-opacity:1;border-color:rgb(187 247 208/var(--tw-border-opacity,1))}.rf-border-green-400{--tw-border-opacity:1;border-color:rgb(74 222 128/var(--tw-border-opacity,1))}.rf-border-input{border-color:hsl(var(--input))}.rf-border-neutral-200{--tw-border-opacity:1;border-color:rgb(229 229 229/var(--tw-border-opacity,1))}.rf-border-orange-100{--tw-border-opacity:1;border-color:rgb(255 237 213/var(--tw-border-opacity,1))}.rf-border-orange-200{--tw-border-opacity:1;border-color:rgb(254 215 170/var(--tw-border-opacity,1))}.rf-border-orange-500{--tw-border-opacity:1;border-color:rgb(249 115 22/var(--tw-border-opacity,1))}.rf-border-primary{border-color:hsl(var(--primary))}.rf-border-red-100{--tw-border-opacity:1;border-color:rgb(254 226 226/var(--tw-border-opacity,1))}.rf-border-red-200{--tw-border-opacity:1;border-color:rgb(254 202 202/var(--tw-border-opacity,1))}.rf-border-red-300{--tw-border-opacity:1;border-color:rgb(252 165 165/var(--tw-border-opacity,1))}.rf-border-red-400{--tw-border-opacity:1;border-color:rgb(248 113 113/var(--tw-border-opacity,1))}.rf-border-red-500{--tw-border-opacity:1;border-color:rgb(239 68 68/var(--tw-border-opacity,1))}.rf-border-red-600{--tw-border-opacity:1;border-color:rgb(220 38 38/var(--tw-border-opacity,1))}.rf-border-red-700{--tw-border-opacity:1;border-color:rgb(185 28 28/var(--tw-border-opacity,1))}.rf-border-red-800{--tw-border-opacity:1;border-color:rgb(153 27 27/var(--tw-border-opacity,1))}.rf-border-slate-200{--tw-border-opacity:1;border-color:rgb(226 232 240/var(--tw-border-opacity,1))}.rf-border-slate-700{--tw-border-opacity:1;border-color:rgb(51 65 85/var(--tw-border-opacity,1))}.rf-border-slate-800{--tw-border-opacity:1;border-color:rgb(30 41 59/var(--tw-border-opacity,1))}.rf-border-slate-800\\/60{border-color:rgba(30,41,59,.6)}.rf-border-transparent{border-color:transparent}.rf-border-yellow-200{--tw-border-opacity:1;border-color:rgb(254 240 138/var(--tw-border-opacity,1))}.rf-border-zinc-100{--tw-border-opacity:1;border-color:rgb(244 244 245/var(--tw-border-opacity,1))}.rf-border-zinc-200{--tw-border-opacity:1;border-color:rgb(228 228 231/var(--tw-border-opacity,1))}.rf-border-zinc-900{--tw-border-opacity:1;border-color:rgb(24 24 27/var(--tw-border-opacity,1))}.rf-border-l-blue-500{--tw-border-opacity:1;border-left-color:rgb(59 130 246/var(--tw-border-opacity,1))}.rf-border-t-blue-600{--tw-border-opacity:1;border-top-color:rgb(37 99 235/var(--tw-border-opacity,1))}.rf-bg-amber-50{--tw-bg-opacity:1;background-color:rgb(255 251 235/var(--tw-bg-opacity,1))}.rf-bg-amber-50\\/30{background-color:rgba(255,251,235,.3)}.rf-bg-background{background-color:hsl(var(--background))}.rf-bg-black{--tw-bg-opacity:1;background-color:rgb(0 0 0/var(--tw-bg-opacity,1))}.rf-bg-black\\/80{background-color:rgba(0,0,0,.8)}.rf-bg-blue-100{--tw-bg-opacity:1;background-color:rgb(219 234 254/var(--tw-bg-opacity,1))}.rf-bg-blue-50{--tw-bg-opacity:1;background-color:rgb(239 246 255/var(--tw-bg-opacity,1))}.rf-bg-blue-500{--tw-bg-opacity:1;background-color:rgb(59 130 246/var(--tw-bg-opacity,1))}.rf-bg-blue-600{--tw-bg-opacity:1;background-color:rgb(37 99 235/var(--tw-bg-opacity,1))}.rf-bg-emerald-500{--tw-bg-opacity:1;background-color:rgb(16 185 129/var(--tw-bg-opacity,1))}.rf-bg-gray-100{--tw-bg-opacity:1;background-color:rgb(243 244 246/var(--tw-bg-opacity,1))}.rf-bg-gray-200{--tw-bg-opacity:1;background-color:rgb(229 231 235/var(--tw-bg-opacity,1))}.rf-bg-gray-300{--tw-bg-opacity:1;background-color:rgb(209 213 219/var(--tw-bg-opacity,1))}.rf-bg-gray-400{--tw-bg-opacity:1;background-color:rgb(156 163 175/var(--tw-bg-opacity,1))}.rf-bg-gray-50{--tw-bg-opacity:1;background-color:rgb(249 250 251/var(--tw-bg-opacity,1))}.rf-bg-gray-500{--tw-bg-opacity:1;background-color:rgb(107 114 128/var(--tw-bg-opacity,1))}.rf-bg-gray-700{--tw-bg-opacity:1;background-color:rgb(55 65 81/var(--tw-bg-opacity,1))}.rf-bg-gray-800{--tw-bg-opacity:1;background-color:rgb(31 41 55/var(--tw-bg-opacity,1))}.rf-bg-gray-900{--tw-bg-opacity:1;background-color:rgb(17 24 39/var(--tw-bg-opacity,1))}.rf-bg-green-100{--tw-bg-opacity:1;background-color:rgb(220 252 231/var(--tw-bg-opacity,1))}.rf-bg-green-300{--tw-bg-opacity:1;background-color:rgb(134 239 172/var(--tw-bg-opacity,1))}.rf-bg-green-50{--tw-bg-opacity:1;background-color:rgb(240 253 244/var(--tw-bg-opacity,1))}.rf-bg-green-600{--tw-bg-opacity:1;background-color:rgb(22 163 74/var(--tw-bg-opacity,1))}.rf-bg-muted{background-color:hsl(var(--muted))}.rf-bg-neutral-100{--tw-bg-opacity:1;background-color:rgb(245 245 245/var(--tw-bg-opacity,1))}.rf-bg-neutral-50{--tw-bg-opacity:1;background-color:rgb(250 250 250/var(--tw-bg-opacity,1))}.rf-bg-neutral-800{--tw-bg-opacity:1;background-color:rgb(38 38 38/var(--tw-bg-opacity,1))}.rf-bg-neutral-900{--tw-bg-opacity:1;background-color:rgb(23 23 23/var(--tw-bg-opacity,1))}.rf-bg-orange-100{--tw-bg-opacity:1;background-color:rgb(255 237 213/var(--tw-bg-opacity,1))}.rf-bg-orange-400{--tw-bg-opacity:1;background-color:rgb(251 146 60/var(--tw-bg-opacity,1))}.rf-bg-orange-50{--tw-bg-opacity:1;background-color:rgb(255 247 237/var(--tw-bg-opacity,1))}.rf-bg-orange-50\\/50{background-color:rgba(255,247,237,.5)}.rf-bg-orange-500{--tw-bg-opacity:1;background-color:rgb(249 115 22/var(--tw-bg-opacity,1))}.rf-bg-popover{background-color:hsl(var(--popover))}.rf-bg-purple-500{--tw-bg-opacity:1;background-color:rgb(168 85 247/var(--tw-bg-opacity,1))}.rf-bg-red-100{--tw-bg-opacity:1;background-color:rgb(254 226 226/var(--tw-bg-opacity,1))}.rf-bg-red-50{--tw-bg-opacity:1;background-color:rgb(254 242 242/var(--tw-bg-opacity,1))}.rf-bg-red-50\\/50{background-color:rgba(254,242,242,.5)}.rf-bg-red-500{--tw-bg-opacity:1;background-color:rgb(239 68 68/var(--tw-bg-opacity,1))}.rf-bg-red-600{--tw-bg-opacity:1;background-color:rgb(220 38 38/var(--tw-bg-opacity,1))}.rf-bg-red-900{--tw-bg-opacity:1;background-color:rgb(127 29 29/var(--tw-bg-opacity,1))}.rf-bg-red-950{--tw-bg-opacity:1;background-color:rgb(69 10 10/var(--tw-bg-opacity,1))}.rf-bg-slate-50{--tw-bg-opacity:1;background-color:rgb(248 250 252/var(--tw-bg-opacity,1))}.rf-bg-slate-800{--tw-bg-opacity:1;background-color:rgb(30 41 59/var(--tw-bg-opacity,1))}.rf-bg-slate-900{--tw-bg-opacity:1;background-color:rgb(15 23 42/var(--tw-bg-opacity,1))}.rf-bg-transparent{background-color:transparent}.rf-bg-white{--tw-bg-opacity:1;background-color:rgb(255 255 255/var(--tw-bg-opacity,1))}.rf-bg-yellow-100{--tw-bg-opacity:1;background-color:rgb(254 249 195/var(--tw-bg-opacity,1))}.rf-bg-yellow-50{--tw-bg-opacity:1;background-color:rgb(254 252 232/var(--tw-bg-opacity,1))}.rf-bg-zinc-100{--tw-bg-opacity:1;background-color:rgb(244 244 245/var(--tw-bg-opacity,1))}.rf-bg-zinc-200{--tw-bg-opacity:1;background-color:rgb(228 228 231/var(--tw-bg-opacity,1))}.rf-bg-zinc-50{--tw-bg-opacity:1;background-color:rgb(250 250 250/var(--tw-bg-opacity,1))}.rf-bg-zinc-800{--tw-bg-opacity:1;background-color:rgb(39 39 42/var(--tw-bg-opacity,1))}.rf-bg-zinc-900{--tw-bg-opacity:1;background-color:rgb(24 24 27/var(--tw-bg-opacity,1))}.rf-bg-zinc-950{--tw-bg-opacity:1;background-color:rgb(9 9 11/var(--tw-bg-opacity,1))}.rf-bg-opacity-50{--tw-bg-opacity:0.5}.rf-bg-gradient-to-br{background-image:linear-gradient(to bottom right,var(--tw-gradient-stops))}.rf-from-blue-500{--tw-gradient-from:#3b82f6 var(--tw-gradient-from-position);--tw-gradient-to:rgba(59,130,246,0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.rf-from-emerald-500{--tw-gradient-from:#10b981 var(--tw-gradient-from-position);--tw-gradient-to:rgba(16,185,129,0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.rf-from-green-500{--tw-gradient-from:#22c55e var(--tw-gradient-from-position);--tw-gradient-to:rgba(34,197,94,0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.rf-from-red-500{--tw-gradient-from:#ef4444 var(--tw-gradient-from-position);--tw-gradient-to:rgba(239,68,68,0) var(--tw-gradient-to-position);--tw-gradient-stops:var(--tw-gradient-from),var(--tw-gradient-to)}.rf-to-blue-600{--tw-gradient-to:#2563eb var(--tw-gradient-to-position)}.rf-to-emerald-600{--tw-gradient-to:#059669 var(--tw-gradient-to-position)}.rf-to-green-600{--tw-gradient-to:#16a34a var(--tw-gradient-to-position)}.rf-to-red-600{--tw-gradient-to:#dc2626 var(--tw-gradient-to-position)}.rf-fill-amber-500{fill:#f59e0b}.rf-fill-current{fill:currentColor}.rf-stroke-1{stroke-width:1}.rf-object-contain{-o-object-fit:contain;object-fit:contain}.rf-object-cover{-o-object-fit:cover;object-fit:cover}.\\!rf-p-0{padding:0!important}.rf-p-0{padding:0}.rf-p-1{padding:.25rem}.rf-p-2{padding:.5rem}.rf-p-3{padding:.75rem}.rf-p-4{padding:1rem}.rf-p-5{padding:1.25rem}.rf-p-6{padding:1.5rem}.rf-p-8{padding:2rem}.rf-px-1{padding-left:.25rem;padding-right:.25rem}.rf-px-1\\.5{padding-left:.375rem;padding-right:.375rem}.rf-px-2{padding-left:.5rem;padding-right:.5rem}.rf-px-2\\.5{padding-left:.625rem;padding-right:.625rem}.rf-px-3{padding-left:.75rem;padding-right:.75rem}.rf-px-4{padding-left:1rem;padding-right:1rem}.rf-px-5{padding-left:1.25rem;padding-right:1.25rem}.rf-px-6{padding-left:1.5rem;padding-right:1.5rem}.rf-px-8{padding-left:2rem;padding-right:2rem}.rf-py-0{padding-bottom:0;padding-top:0}.rf-py-0\\.5{padding-bottom:.125rem;padding-top:.125rem}.rf-py-1{padding-bottom:.25rem;padding-top:.25rem}.rf-py-1\\.5{padding-bottom:.375rem;padding-top:.375rem}.rf-py-10{padding-bottom:2.5rem;padding-top:2.5rem}.rf-py-12{padding-bottom:3rem;padding-top:3rem}.rf-py-2{padding-bottom:.5rem;padding-top:.5rem}.rf-py-3{padding-bottom:.75rem;padding-top:.75rem}.rf-py-4{padding-bottom:1rem;padding-top:1rem}.rf-py-6{padding-bottom:1.5rem;padding-top:1.5rem}.rf-py-8{padding-bottom:2rem;padding-top:2rem}.rf-pb-0{padding-bottom:0}.rf-pb-1{padding-bottom:.25rem}.rf-pb-1\\.5{padding-bottom:.375rem}.rf-pb-2{padding-bottom:.5rem}.rf-pb-3{padding-bottom:.75rem}.rf-pb-4{padding-bottom:1rem}.rf-pb-px{padding-bottom:1px}.rf-pl-10{padding-left:2.5rem}.rf-pl-11{padding-left:2.75rem}.rf-pl-12{padding-left:3rem}.rf-pl-2{padding-left:.5rem}.rf-pl-4{padding-left:1rem}.rf-pl-8{padding-left:2rem}.rf-pr-2{padding-right:.5rem}.rf-pt-0{padding-top:0}.rf-pt-1{padding-top:.25rem}.rf-pt-2{padding-top:.5rem}.rf-pt-4{padding-top:1rem}.rf-text-left{text-align:left}.rf-text-center{text-align:center}.rf-text-right{text-align:right}.rf-align-bottom{vertical-align:bottom}.rf-font-mono{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace}.rf-font-sans{font-family:ui-sans-serif,system-ui,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji}.rf-text-2xl{font-size:1.5rem;line-height:2rem}.rf-text-3xl{font-size:1.875rem;line-height:2.25rem}.rf-text-\\[10px\\]{font-size:10px}.rf-text-\\[11px\\]{font-size:11px}.rf-text-\\[8px\\]{font-size:8px}.rf-text-base{font-size:1rem;line-height:1.5rem}.rf-text-lg{font-size:1.125rem;line-height:1.75rem}.rf-text-sm{font-size:.875rem;line-height:1.25rem}.rf-text-xl{font-size:1.25rem;line-height:1.75rem}.rf-text-xs{font-size:.75rem;line-height:1rem}.\\!rf-font-normal{font-weight:400!important}.rf-font-bold{font-weight:700}.rf-font-medium{font-weight:500}.rf-font-normal{font-weight:400}.rf-font-semibold{font-weight:600}.rf-uppercase{text-transform:uppercase}.rf-capitalize{text-transform:capitalize}.rf-tabular-nums{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.rf-leading-4{line-height:1rem}.rf-leading-5{line-height:1.25rem}.rf-leading-\\[0\\.95rem\\]{line-height:.95rem}.rf-leading-\\[1rem\\]{line-height:1rem}.rf-leading-none{line-height:1}.rf-leading-relaxed{line-height:1.625}.rf-leading-tight{line-height:1.25}.rf-tracking-tight{letter-spacing:-.025em}.rf-tracking-wide{letter-spacing:.025em}.rf-tracking-wider{letter-spacing:.05em}.rf-tracking-widest{letter-spacing:.1em}.rf-text-amber-500{--tw-text-opacity:1;color:rgb(245 158 11/var(--tw-text-opacity,1))}.rf-text-black{--tw-text-opacity:1;color:rgb(0 0 0/var(--tw-text-opacity,1))}.rf-text-blue-500{--tw-text-opacity:1;color:rgb(59 130 246/var(--tw-text-opacity,1))}.rf-text-blue-600{--tw-text-opacity:1;color:rgb(37 99 235/var(--tw-text-opacity,1))}.rf-text-blue-700{--tw-text-opacity:1;color:rgb(29 78 216/var(--tw-text-opacity,1))}.rf-text-blue-800{--tw-text-opacity:1;color:rgb(30 64 175/var(--tw-text-opacity,1))}.rf-text-blue-900{--tw-text-opacity:1;color:rgb(30 58 138/var(--tw-text-opacity,1))}.rf-text-current{color:currentColor}.rf-text-emerald-600{--tw-text-opacity:1;color:rgb(5 150 105/var(--tw-text-opacity,1))}.rf-text-foreground{color:hsl(var(--foreground))}.rf-text-gray-200{--tw-text-opacity:1;color:rgb(229 231 235/var(--tw-text-opacity,1))}.rf-text-gray-300{--tw-text-opacity:1;color:rgb(209 213 219/var(--tw-text-opacity,1))}.rf-text-gray-400{--tw-text-opacity:1;color:rgb(156 163 175/var(--tw-text-opacity,1))}.rf-text-gray-500{--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity,1))}.rf-text-gray-600{--tw-text-opacity:1;color:rgb(75 85 99/var(--tw-text-opacity,1))}.rf-text-gray-700{--tw-text-opacity:1;color:rgb(55 65 81/var(--tw-text-opacity,1))}.rf-text-gray-800{--tw-text-opacity:1;color:rgb(31 41 55/var(--tw-text-opacity,1))}.rf-text-gray-900{--tw-text-opacity:1;color:rgb(17 24 39/var(--tw-text-opacity,1))}.rf-text-green-500{--tw-text-opacity:1;color:rgb(34 197 94/var(--tw-text-opacity,1))}.rf-text-green-600{--tw-text-opacity:1;color:rgb(22 163 74/var(--tw-text-opacity,1))}.rf-text-green-700{--tw-text-opacity:1;color:rgb(21 128 61/var(--tw-text-opacity,1))}.rf-text-green-800{--tw-text-opacity:1;color:rgb(22 101 52/var(--tw-text-opacity,1))}.rf-text-green-900{--tw-text-opacity:1;color:rgb(20 83 45/var(--tw-text-opacity,1))}.rf-text-muted{color:hsl(var(--muted))}.rf-text-muted-foreground{color:hsl(var(--muted-foreground))}.rf-text-neutral-50{--tw-text-opacity:1;color:rgb(250 250 250/var(--tw-text-opacity,1))}.rf-text-neutral-500{--tw-text-opacity:1;color:rgb(115 115 115/var(--tw-text-opacity,1))}.rf-text-neutral-900{--tw-text-opacity:1;color:rgb(23 23 23/var(--tw-text-opacity,1))}.rf-text-neutral-950{--tw-text-opacity:1;color:rgb(10 10 10/var(--tw-text-opacity,1))}.rf-text-orange-400{--tw-text-opacity:1;color:rgb(251 146 60/var(--tw-text-opacity,1))}.rf-text-orange-500{--tw-text-opacity:1;color:rgb(249 115 22/var(--tw-text-opacity,1))}.rf-text-orange-600{--tw-text-opacity:1;color:rgb(234 88 12/var(--tw-text-opacity,1))}.rf-text-orange-700{--tw-text-opacity:1;color:rgb(194 65 12/var(--tw-text-opacity,1))}.rf-text-orange-800{--tw-text-opacity:1;color:rgb(154 52 18/var(--tw-text-opacity,1))}.rf-text-popover-foreground{color:hsl(var(--popover-foreground))}.rf-text-red-200{--tw-text-opacity:1;color:rgb(254 202 202/var(--tw-text-opacity,1))}.rf-text-red-300{--tw-text-opacity:1;color:rgb(252 165 165/var(--tw-text-opacity,1))}.rf-text-red-400{--tw-text-opacity:1;color:rgb(248 113 113/var(--tw-text-opacity,1))}.rf-text-red-500{--tw-text-opacity:1;color:rgb(239 68 68/var(--tw-text-opacity,1))}.rf-text-red-600{--tw-text-opacity:1;color:rgb(220 38 38/var(--tw-text-opacity,1))}.rf-text-red-700{--tw-text-opacity:1;color:rgb(185 28 28/var(--tw-text-opacity,1))}.rf-text-red-800{--tw-text-opacity:1;color:rgb(153 27 27/var(--tw-text-opacity,1))}.rf-text-red-900{--tw-text-opacity:1;color:rgb(127 29 29/var(--tw-text-opacity,1))}.rf-text-slate-200{--tw-text-opacity:1;color:rgb(226 232 240/var(--tw-text-opacity,1))}.rf-text-slate-400{--tw-text-opacity:1;color:rgb(148 163 184/var(--tw-text-opacity,1))}.rf-text-slate-50{--tw-text-opacity:1;color:rgb(248 250 252/var(--tw-text-opacity,1))}.rf-text-slate-500{--tw-text-opacity:1;color:rgb(100 116 139/var(--tw-text-opacity,1))}.rf-text-slate-600{--tw-text-opacity:1;color:rgb(71 85 105/var(--tw-text-opacity,1))}.rf-text-slate-800{--tw-text-opacity:1;color:rgb(30 41 59/var(--tw-text-opacity,1))}.rf-text-white{--tw-text-opacity:1;color:rgb(255 255 255/var(--tw-text-opacity,1))}.rf-text-yellow-400{--tw-text-opacity:1;color:rgb(250 204 21/var(--tw-text-opacity,1))}.rf-text-yellow-500{--tw-text-opacity:1;color:rgb(234 179 8/var(--tw-text-opacity,1))}.rf-text-yellow-600{--tw-text-opacity:1;color:rgb(202 138 4/var(--tw-text-opacity,1))}.rf-text-yellow-700{--tw-text-opacity:1;color:rgb(161 98 7/var(--tw-text-opacity,1))}.rf-text-yellow-900{--tw-text-opacity:1;color:rgb(113 63 18/var(--tw-text-opacity,1))}.rf-text-zinc-200{--tw-text-opacity:1;color:rgb(228 228 231/var(--tw-text-opacity,1))}.rf-text-zinc-300{--tw-text-opacity:1;color:rgb(212 212 216/var(--tw-text-opacity,1))}.rf-text-zinc-400{--tw-text-opacity:1;color:rgb(161 161 170/var(--tw-text-opacity,1))}.rf-text-zinc-50{--tw-text-opacity:1;color:rgb(250 250 250/var(--tw-text-opacity,1))}.rf-text-zinc-500{--tw-text-opacity:1;color:rgb(113 113 122/var(--tw-text-opacity,1))}.rf-text-zinc-600{--tw-text-opacity:1;color:rgb(82 82 91/var(--tw-text-opacity,1))}.rf-text-zinc-900{--tw-text-opacity:1;color:rgb(24 24 27/var(--tw-text-opacity,1))}.rf-text-zinc-950{--tw-text-opacity:1;color:rgb(9 9 11/var(--tw-text-opacity,1))}.rf-underline{text-decoration-line:underline}.rf-line-through{text-decoration-line:line-through}.rf-underline-offset-4{text-underline-offset:4px}.rf-accent-blue-600{accent-color:#2563eb}.rf-opacity-0{opacity:0}.rf-opacity-10{opacity:.1}.rf-opacity-100{opacity:1}.rf-opacity-25{opacity:.25}.rf-opacity-30{opacity:.3}.rf-opacity-50{opacity:.5}.rf-opacity-60{opacity:.6}.rf-opacity-70{opacity:.7}.rf-opacity-75{opacity:.75}.rf-shadow{--tw-shadow:0 1px 3px 0 rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color),0 1px 2px -1px var(--tw-shadow-color)}.rf-shadow,.rf-shadow-lg{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.rf-shadow-lg{--tw-shadow:0 10px 15px -3px rgba(0,0,0,.1),0 4px 6px -4px rgba(0,0,0,.1);--tw-shadow-colored:0 10px 15px -3px var(--tw-shadow-color),0 4px 6px -4px var(--tw-shadow-color)}.rf-shadow-md{--tw-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);--tw-shadow-colored:0 4px 6px -1px var(--tw-shadow-color),0 2px 4px -2px var(--tw-shadow-color)}.rf-shadow-md,.rf-shadow-none{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.rf-shadow-none{--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000}.rf-shadow-sm{--tw-shadow:0 1px 2px 0 rgba(0,0,0,.05);--tw-shadow-colored:0 1px 2px 0 var(--tw-shadow-color)}.rf-shadow-sm,.rf-shadow-xl{box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.rf-shadow-xl{--tw-shadow:0 20px 25px -5px rgba(0,0,0,.1),0 8px 10px -6px rgba(0,0,0,.1);--tw-shadow-colored:0 20px 25px -5px var(--tw-shadow-color),0 8px 10px -6px var(--tw-shadow-color)}.rf-outline-none{outline:2px solid transparent;outline-offset:2px}.rf-ring-2{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.rf-ring-blue-500{--tw-ring-opacity:1;--tw-ring-color:rgb(59 130 246/var(--tw-ring-opacity,1))}.rf-ring-primary{--tw-ring-color:hsl(var(--primary))}.rf-ring-offset-background{--tw-ring-offset-color:hsl(var(--background))}.rf-ring-offset-white{--tw-ring-offset-color:#fff}.rf-transition{transition-duration:.15s;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke,opacity,box-shadow,transform,filter,backdrop-filter;transition-timing-function:cubic-bezier(.4,0,.2,1)}.rf-transition-all{transition-duration:.15s;transition-property:all;transition-timing-function:cubic-bezier(.4,0,.2,1)}.rf-transition-colors{transition-duration:.15s;transition-property:color,background-color,border-color,text-decoration-color,fill,stroke;transition-timing-function:cubic-bezier(.4,0,.2,1)}.rf-transition-opacity{transition-duration:.15s;transition-property:opacity;transition-timing-function:cubic-bezier(.4,0,.2,1)}.rf-transition-transform{transition-duration:.15s;transition-property:transform;transition-timing-function:cubic-bezier(.4,0,.2,1)}.rf-duration-150{transition-duration:.15s}.rf-duration-200{transition-duration:.2s}.rf-ease-in-out{transition-timing-function:cubic-bezier(.4,0,.2,1)}@keyframes enter{0%{opacity:var(--tw-enter-opacity,1);transform:translate3d(var(--tw-enter-translate-x,0),var(--tw-enter-translate-y,0),0) scale3d(var(--tw-enter-scale,1),var(--tw-enter-scale,1),var(--tw-enter-scale,1)) rotate(var(--tw-enter-rotate,0))}}@keyframes exit{to{opacity:var(--tw-exit-opacity,1);transform:translate3d(var(--tw-exit-translate-x,0),var(--tw-exit-translate-y,0),0) scale3d(var(--tw-exit-scale,1),var(--tw-exit-scale,1),var(--tw-exit-scale,1)) rotate(var(--tw-exit-rotate,0))}}.rf-animate-in{animation-duration:.15s;animation-name:enter;--tw-enter-opacity:initial;--tw-enter-scale:initial;--tw-enter-rotate:initial;--tw-enter-translate-x:initial;--tw-enter-translate-y:initial}.rf-fade-in-0{--tw-enter-opacity:0}.rf-zoom-in-95{--tw-enter-scale:.95}.rf-slide-in-from-left-1{--tw-enter-translate-x:-0.25rem}.rf-slide-out-to-left-1{--tw-exit-translate-x:-0.25rem}.rf-duration-150{animation-duration:.15s}.rf-duration-200{animation-duration:.2s}.rf-ease-in-out{animation-timing-function:cubic-bezier(.4,0,.2,1)}.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}.file\\:rf-border-0::file-selector-button{border-width:0}.file\\:rf-bg-transparent::file-selector-button{background-color:transparent}.file\\:rf-text-sm::file-selector-button{font-size:.875rem;line-height:1.25rem}.file\\:rf-font-medium::file-selector-button{font-weight:500}.placeholder\\:rf-text-zinc-500::-moz-placeholder{--tw-text-opacity:1;color:rgb(113 113 122/var(--tw-text-opacity,1))}.placeholder\\:rf-text-zinc-500::placeholder{--tw-text-opacity:1;color:rgb(113 113 122/var(--tw-text-opacity,1))}.hover\\:rf--translate-y-0\\.5:hover{--tw-translate-y:-0.125rem;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.hover\\:rf-border-blue-300:hover{--tw-border-opacity:1;border-color:rgb(147 197 253/var(--tw-border-opacity,1))}.hover\\:rf-border-zinc-300:hover{--tw-border-opacity:1;border-color:rgb(212 212 216/var(--tw-border-opacity,1))}.hover\\:\\!rf-bg-transparent:hover{background-color:transparent!important}.hover\\:rf-bg-blue-700:hover{--tw-bg-opacity:1;background-color:rgb(29 78 216/var(--tw-bg-opacity,1))}.hover\\:rf-bg-gray-50:hover{--tw-bg-opacity:1;background-color:rgb(249 250 251/var(--tw-bg-opacity,1))}.hover\\:rf-bg-orange-100:hover{--tw-bg-opacity:1;background-color:rgb(255 237 213/var(--tw-bg-opacity,1))}.hover\\:rf-bg-red-100:hover{--tw-bg-opacity:1;background-color:rgb(254 226 226/var(--tw-bg-opacity,1))}.hover\\:rf-bg-red-500\\/90:hover{background-color:rgba(239,68,68,.9)}.hover\\:rf-bg-slate-100:hover{--tw-bg-opacity:1;background-color:rgb(241 245 249/var(--tw-bg-opacity,1))}.hover\\:rf-bg-slate-200:hover{--tw-bg-opacity:1;background-color:rgb(226 232 240/var(--tw-bg-opacity,1))}.hover\\:rf-bg-slate-50:hover{--tw-bg-opacity:1;background-color:rgb(248 250 252/var(--tw-bg-opacity,1))}.hover\\:rf-bg-zinc-100:hover{--tw-bg-opacity:1;background-color:rgb(244 244 245/var(--tw-bg-opacity,1))}.hover\\:rf-bg-zinc-100\\/80:hover{background-color:hsla(240,5%,96%,.8)}.hover\\:rf-bg-zinc-900\\/90:hover{background-color:rgba(24,24,27,.9)}.hover\\:rf-text-blue-800:hover{--tw-text-opacity:1;color:rgb(30 64 175/var(--tw-text-opacity,1))}.hover\\:rf-text-gray-700:hover{--tw-text-opacity:1;color:rgb(55 65 81/var(--tw-text-opacity,1))}.hover\\:rf-text-red-400:hover{--tw-text-opacity:1;color:rgb(248 113 113/var(--tw-text-opacity,1))}.hover\\:rf-text-slate-800:hover{--tw-text-opacity:1;color:rgb(30 41 59/var(--tw-text-opacity,1))}.hover\\:rf-text-slate-900:hover{--tw-text-opacity:1;color:rgb(15 23 42/var(--tw-text-opacity,1))}.hover\\:rf-text-zinc-900:hover{--tw-text-opacity:1;color:rgb(24 24 27/var(--tw-text-opacity,1))}.hover\\:rf-underline:hover{text-decoration-line:underline}.hover\\:rf-shadow-md:hover{--tw-shadow:0 4px 6px -1px rgba(0,0,0,.1),0 2px 4px -2px rgba(0,0,0,.1);--tw-shadow-colored:0 4px 6px -1px var(--tw-shadow-color),0 2px 4px -2px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.focus\\:rf-bg-gray-100:focus{--tw-bg-opacity:1;background-color:rgb(243 244 246/var(--tw-bg-opacity,1))}.focus\\:rf-bg-zinc-100:focus{--tw-bg-opacity:1;background-color:rgb(244 244 245/var(--tw-bg-opacity,1))}.focus\\:rf-text-gray-900:focus{--tw-text-opacity:1;color:rgb(17 24 39/var(--tw-text-opacity,1))}.focus\\:rf-text-zinc-900:focus{--tw-text-opacity:1;color:rgb(24 24 27/var(--tw-text-opacity,1))}.focus\\:rf-outline-none:focus{outline:2px solid transparent;outline-offset:2px}.focus\\:rf-ring-2:focus{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.focus\\:rf-ring-blue-500:focus{--tw-ring-opacity:1;--tw-ring-color:rgb(59 130 246/var(--tw-ring-opacity,1))}.focus\\:rf-ring-ring:focus{--tw-ring-color:hsl(var(--ring))}.focus\\:rf-ring-offset-2:focus{--tw-ring-offset-width:2px}.focus-visible\\:rf-outline-none:focus-visible{outline:2px solid transparent;outline-offset:2px}.focus-visible\\:rf-ring-1:focus-visible{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.focus-visible\\:rf-ring-2:focus-visible{--tw-ring-offset-shadow:var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);--tw-ring-shadow:var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);box-shadow:var(--tw-ring-offset-shadow),var(--tw-ring-shadow),var(--tw-shadow,0 0 #0000)}.focus-visible\\:rf-ring-zinc-900:focus-visible{--tw-ring-opacity:1;--tw-ring-color:rgb(24 24 27/var(--tw-ring-opacity,1))}.focus-visible\\:rf-ring-zinc-950:focus-visible{--tw-ring-opacity:1;--tw-ring-color:rgb(9 9 11/var(--tw-ring-opacity,1))}.focus-visible\\:rf-ring-offset-2:focus-visible{--tw-ring-offset-width:2px}.disabled\\:rf-pointer-events-none:disabled{pointer-events:none}.disabled\\:rf-cursor-not-allowed:disabled{cursor:not-allowed}.disabled\\:rf-text-gray-500:disabled{--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity,1))}.disabled\\:rf-opacity-40:disabled{opacity:.4}.disabled\\:rf-opacity-50:disabled{opacity:.5}.rf-group:hover .group-hover\\:rf-scale-\\[1\\.03\\]{--tw-scale-x:1.03;--tw-scale-y:1.03;transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rf-group:hover .group-hover\\:rf-opacity-100,.rf-group\\/bar:hover .group-hover\\/bar\\:rf-opacity-100{opacity:1}.rf-peer:disabled~.peer-disabled\\:rf-cursor-not-allowed{cursor:not-allowed}.rf-peer:disabled~.peer-disabled\\:rf-opacity-70{opacity:.7}.data-\\[disabled\\=true\\]\\:rf-pointer-events-none[data-disabled=true],.data-\\[disabled\\]\\:rf-pointer-events-none[data-disabled]{pointer-events:none}.data-\\[side\\=bottom\\]\\:rf-translate-y-1[data-side=bottom]{--tw-translate-y:0.25rem}.data-\\[side\\=bottom\\]\\:rf-translate-y-1[data-side=bottom],.data-\\[side\\=left\\]\\:-rf-translate-x-1[data-side=left]{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.data-\\[side\\=left\\]\\:-rf-translate-x-1[data-side=left]{--tw-translate-x:-0.25rem}.data-\\[side\\=right\\]\\:rf-translate-x-1[data-side=right]{--tw-translate-x:0.25rem}.data-\\[side\\=right\\]\\:rf-translate-x-1[data-side=right],.data-\\[side\\=top\\]\\:-rf-translate-y-1[data-side=top]{transform:translate(var(--tw-translate-x),var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.data-\\[side\\=top\\]\\:-rf-translate-y-1[data-side=top]{--tw-translate-y:-0.25rem}.data-\\[selected\\=true\\]\\:rf-bg-zinc-100[data-selected=true]{--tw-bg-opacity:1;background-color:rgb(244 244 245/var(--tw-bg-opacity,1))}.data-\\[state\\=active\\]\\:rf-bg-white[data-state=active]{--tw-bg-opacity:1;background-color:rgb(255 255 255/var(--tw-bg-opacity,1))}.data-\\[state\\=checked\\]\\:rf-bg-zinc-900[data-state=checked]{--tw-bg-opacity:1;background-color:rgb(24 24 27/var(--tw-bg-opacity,1))}.data-\\[state\\=open\\]\\:rf-bg-zinc-100[data-state=open]{--tw-bg-opacity:1;background-color:rgb(244 244 245/var(--tw-bg-opacity,1))}.data-\\[selected\\=true\\]\\:rf-text-zinc-900[data-selected=true]{--tw-text-opacity:1;color:rgb(24 24 27/var(--tw-text-opacity,1))}.data-\\[state\\=active\\]\\:rf-text-zinc-950[data-state=active]{--tw-text-opacity:1;color:rgb(9 9 11/var(--tw-text-opacity,1))}.data-\\[state\\=checked\\]\\:rf-text-zinc-50[data-state=checked]{--tw-text-opacity:1;color:rgb(250 250 250/var(--tw-text-opacity,1))}.data-\\[disabled\\=true\\]\\:rf-opacity-50[data-disabled=true],.data-\\[disabled\\]\\:rf-opacity-50[data-disabled]{opacity:.5}.data-\\[state\\=active\\]\\:rf-shadow[data-state=active]{--tw-shadow:0 1px 3px 0 rgba(0,0,0,.1),0 1px 2px -1px rgba(0,0,0,.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color),0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow,0 0 #0000),var(--tw-ring-shadow,0 0 #0000),var(--tw-shadow)}.data-\\[state\\=open\\]\\:rf-animate-in[data-state=open]{animation-duration:.15s;animation-name:enter;--tw-enter-opacity:initial;--tw-enter-scale:initial;--tw-enter-rotate:initial;--tw-enter-translate-x:initial;--tw-enter-translate-y:initial}.data-\\[state\\=closed\\]\\:rf-animate-out[data-state=closed]{animation-duration:.15s;animation-name:exit;--tw-exit-opacity:initial;--tw-exit-scale:initial;--tw-exit-rotate:initial;--tw-exit-translate-x:initial;--tw-exit-translate-y:initial}.data-\\[state\\=closed\\]\\:rf-fade-out-0[data-state=closed]{--tw-exit-opacity:0}.data-\\[state\\=open\\]\\:rf-fade-in-0[data-state=open]{--tw-enter-opacity:0}.data-\\[state\\=closed\\]\\:rf-zoom-out-95[data-state=closed]{--tw-exit-scale:.95}.data-\\[state\\=open\\]\\:rf-zoom-in-95[data-state=open]{--tw-enter-scale:.95}.data-\\[side\\=bottom\\]\\:rf-slide-in-from-top-2[data-side=bottom]{--tw-enter-translate-y:-0.5rem}.data-\\[side\\=left\\]\\:rf-slide-in-from-right-2[data-side=left]{--tw-enter-translate-x:0.5rem}.data-\\[side\\=right\\]\\:rf-slide-in-from-left-2[data-side=right]{--tw-enter-translate-x:-0.5rem}.data-\\[side\\=top\\]\\:rf-slide-in-from-bottom-2[data-side=top]{--tw-enter-translate-y:0.5rem}.data-\\[state\\=closed\\]\\:rf-slide-out-to-left-1\\/2[data-state=closed]{--tw-exit-translate-x:-50%}.data-\\[state\\=closed\\]\\:rf-slide-out-to-top-\\[48\\%\\][data-state=closed]{--tw-exit-translate-y:-48%}.data-\\[state\\=open\\]\\:rf-slide-in-from-left-1\\/2[data-state=open]{--tw-enter-translate-x:-50%}.data-\\[state\\=open\\]\\:rf-slide-in-from-top-\\[48\\%\\][data-state=open]{--tw-enter-translate-y:-48%}.dark\\:rf-border-zinc-50:is(.rf-dark *){--tw-border-opacity:1;border-color:rgb(250 250 250/var(--tw-border-opacity,1))}.dark\\:rf-border-zinc-800:is(.rf-dark *){--tw-border-opacity:1;border-color:rgb(39 39 42/var(--tw-border-opacity,1))}.dark\\:rf-bg-gray-700:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(55 65 81/var(--tw-bg-opacity,1))}.dark\\:rf-bg-gray-800:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(31 41 55/var(--tw-bg-opacity,1))}.dark\\:rf-bg-red-900:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(127 29 29/var(--tw-bg-opacity,1))}.dark\\:rf-bg-zinc-50:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(250 250 250/var(--tw-bg-opacity,1))}.dark\\:rf-bg-zinc-800:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(39 39 42/var(--tw-bg-opacity,1))}.dark\\:rf-bg-zinc-900:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(24 24 27/var(--tw-bg-opacity,1))}.dark\\:rf-bg-zinc-950:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(9 9 11/var(--tw-bg-opacity,1))}.dark\\:rf-text-gray-500:is(.rf-dark *){--tw-text-opacity:1;color:rgb(107 114 128/var(--tw-text-opacity,1))}.dark\\:rf-text-zinc-300:is(.rf-dark *){--tw-text-opacity:1;color:rgb(212 212 216/var(--tw-text-opacity,1))}.dark\\:rf-text-zinc-400:is(.rf-dark *){--tw-text-opacity:1;color:rgb(161 161 170/var(--tw-text-opacity,1))}.dark\\:rf-text-zinc-50:is(.rf-dark *){--tw-text-opacity:1;color:rgb(250 250 250/var(--tw-text-opacity,1))}.dark\\:rf-text-zinc-900:is(.rf-dark *){--tw-text-opacity:1;color:rgb(24 24 27/var(--tw-text-opacity,1))}.dark\\:rf-placeholder-zinc-400:is(.rf-dark *)::-moz-placeholder{--tw-placeholder-opacity:1;color:rgb(161 161 170/var(--tw-placeholder-opacity,1))}.dark\\:rf-placeholder-zinc-400:is(.rf-dark *)::placeholder{--tw-placeholder-opacity:1;color:rgb(161 161 170/var(--tw-placeholder-opacity,1))}.dark\\:rf-ring-offset-zinc-950:is(.rf-dark *){--tw-ring-offset-color:#09090b}.dark\\:placeholder\\:rf-text-zinc-400:is(.rf-dark *)::-moz-placeholder{--tw-text-opacity:1;color:rgb(161 161 170/var(--tw-text-opacity,1))}.dark\\:placeholder\\:rf-text-zinc-400:is(.rf-dark *)::placeholder{--tw-text-opacity:1;color:rgb(161 161 170/var(--tw-text-opacity,1))}.dark\\:hover\\:rf-bg-red-900\\/90:hover:is(.rf-dark *){background-color:rgba(127,29,29,.9)}.dark\\:hover\\:rf-bg-zinc-50\\/90:hover:is(.rf-dark *){background-color:hsla(0,0%,98%,.9)}.dark\\:hover\\:rf-bg-zinc-800:hover:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(39 39 42/var(--tw-bg-opacity,1))}.dark\\:hover\\:rf-bg-zinc-800\\/80:hover:is(.rf-dark *){background-color:rgba(39,39,42,.8)}.dark\\:hover\\:rf-text-zinc-50:hover:is(.rf-dark *){--tw-text-opacity:1;color:rgb(250 250 250/var(--tw-text-opacity,1))}.dark\\:focus\\:rf-bg-zinc-800:focus:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(39 39 42/var(--tw-bg-opacity,1))}.dark\\:focus\\:rf-text-zinc-50:focus:is(.rf-dark *){--tw-text-opacity:1;color:rgb(250 250 250/var(--tw-text-opacity,1))}.dark\\:focus-visible\\:rf-ring-zinc-300:focus-visible:is(.rf-dark *){--tw-ring-opacity:1;--tw-ring-color:rgb(212 212 216/var(--tw-ring-opacity,1))}.dark\\:data-\\[selected\\=true\\]\\:rf-bg-zinc-800[data-selected=true]:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(39 39 42/var(--tw-bg-opacity,1))}.dark\\:data-\\[state\\=active\\]\\:rf-bg-zinc-950[data-state=active]:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(9 9 11/var(--tw-bg-opacity,1))}.dark\\:data-\\[state\\=checked\\]\\:rf-bg-zinc-50[data-state=checked]:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(250 250 250/var(--tw-bg-opacity,1))}.dark\\:data-\\[state\\=open\\]\\:rf-bg-zinc-800[data-state=open]:is(.rf-dark *){--tw-bg-opacity:1;background-color:rgb(39 39 42/var(--tw-bg-opacity,1))}.dark\\:data-\\[selected\\=true\\]\\:rf-text-zinc-50[data-selected=true]:is(.rf-dark *){--tw-text-opacity:1;color:rgb(250 250 250/var(--tw-text-opacity,1))}.dark\\:data-\\[state\\=active\\]\\:rf-text-zinc-50[data-state=active]:is(.rf-dark *){--tw-text-opacity:1;color:rgb(250 250 250/var(--tw-text-opacity,1))}.dark\\:data-\\[state\\=checked\\]\\:rf-text-zinc-900[data-state=checked]:is(.rf-dark *){--tw-text-opacity:1;color:rgb(24 24 27/var(--tw-text-opacity,1))}@media (min-width:640px){.sm\\:rf-order-1{order:1}.sm\\:rf-order-2{order:2}.sm\\:rf-mt-0{margin-top:0}.sm\\:rf-mt-4{margin-top:1rem}.sm\\:rf-block{display:block}.sm\\:rf-inline{display:inline}.sm\\:rf-grid{display:grid}.sm\\:rf-hidden{display:none}.sm\\:rf-h-5{height:1.25rem}.sm\\:rf-w-1\\/2{width:50%}.sm\\:rf-w-5{width:1.25rem}.sm\\:rf-w-\\[90vw\\]{width:90vw}.sm\\:rf-w-auto{width:auto}.sm\\:rf-max-w-\\[500px\\]{max-width:500px}.sm\\:rf-max-w-md{max-width:28rem}.sm\\:rf-grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.sm\\:rf-grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}.sm\\:rf-grid-cols-\\[1fr_auto\\]{grid-template-columns:1fr auto}.sm\\:rf-grid-cols-\\[minmax\\(0\\2c 1fr\\)_auto\\]{grid-template-columns:minmax(0,1fr) auto}.sm\\:rf-flex-row{flex-direction:row}.sm\\:rf-items-center{align-items:center}.sm\\:rf-justify-end{justify-content:flex-end}.sm\\:rf-gap-3{gap:.75rem}.sm\\:rf-gap-4{gap:1rem}.sm\\:rf-space-x-2>:not([hidden])~:not([hidden]){--tw-space-x-reverse:0;margin-left:calc(.5rem*(1 - var(--tw-space-x-reverse)));margin-right:calc(.5rem*var(--tw-space-x-reverse))}.sm\\:rf-rounded-lg{border-radius:var(--radius)}.sm\\:rf-p-3{padding:.75rem}.sm\\:rf-p-6{padding:1.5rem}.sm\\:rf-px-4{padding-left:1rem;padding-right:1rem}.sm\\:rf-px-6{padding-left:1.5rem;padding-right:1.5rem}.sm\\:rf-px-8{padding-left:2rem;padding-right:2rem}.sm\\:rf-py-10{padding-bottom:2.5rem;padding-top:2.5rem}.sm\\:rf-py-6{padding-bottom:1.5rem;padding-top:1.5rem}.sm\\:rf-text-left{text-align:left}.sm\\:rf-text-2xl{font-size:1.5rem;line-height:2rem}.sm\\:rf-text-3xl{font-size:1.875rem;line-height:2.25rem}.sm\\:rf-text-base{font-size:1rem;line-height:1.5rem}.sm\\:rf-text-sm{font-size:.875rem;line-height:1.25rem}.sm\\:rf-text-xl{font-size:1.25rem;line-height:1.75rem}}@media (min-width:768px){.md\\:rf-w-52{width:13rem}.md\\:rf-w-auto{width:auto}.md\\:rf-min-w-0{min-width:0}.md\\:rf-max-w-\\[660px\\]{max-width:660px}.md\\:rf-max-w-lg{max-width:32rem}.md\\:rf-grid-cols-2{grid-template-columns:repeat(2,minmax(0,1fr))}.md\\:rf-grid-cols-\\[220px_1fr\\]{grid-template-columns:220px 1fr}.md\\:rf-flex-row{flex-direction:row}.md\\:rf-flex-col{flex-direction:column}.md\\:rf-overflow-y-auto{overflow-y:auto}.md\\:rf-overflow-x-hidden{overflow-x:hidden}.md\\:rf-border-b-0{border-bottom-width:0}.md\\:rf-border-r{border-right-width:1px}.md\\:rf-p-8{padding:2rem}.md\\:rf-py-8{padding-bottom:2rem;padding-top:2rem}.md\\:rf-text-3xl{font-size:1.875rem;line-height:2.25rem}}@media (min-width:1024px){.lg\\:rf-max-w-\\[720px\\]{max-width:720px}.lg\\:rf-max-w-xl{max-width:36rem}.lg\\:rf-grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (min-width:1280px){.xl\\:rf-max-w-\\[800px\\]{max-width:800px}}.\\[\\&\\>span\\]\\:rf-line-clamp-1>span{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:1}.\\[\\&\\>svg\\]\\:rf-size-4>svg{height:1rem;width:1rem}.\\[\\&\\>svg\\]\\:rf-shrink-0>svg{flex-shrink:0}.\\[\\&\\>svg\\]\\:rf-text-red-300>svg{--tw-text-opacity:1;color:rgb(252 165 165/var(--tw-text-opacity,1))}.\\[\\&\\>svg\\]\\:hover\\:rf-text-red-400:hover>svg{--tw-text-opacity:1;color:rgb(248 113 113/var(--tw-text-opacity,1))}.\\[\\&_\\[cmdk-group-heading\\]\\]\\:rf-px-2 [cmdk-group-heading]{padding-left:.5rem;padding-right:.5rem}.\\[\\&_\\[cmdk-group-heading\\]\\]\\:rf-py-1\\.5 [cmdk-group-heading]{padding-bottom:.375rem;padding-top:.375rem}.\\[\\&_\\[cmdk-group-heading\\]\\]\\:rf-text-xs [cmdk-group-heading]{font-size:.75rem;line-height:1rem}.\\[\\&_\\[cmdk-group-heading\\]\\]\\:rf-font-medium [cmdk-group-heading]{font-weight:500}.\\[\\&_\\[cmdk-group-heading\\]\\]\\:rf-text-zinc-500 [cmdk-group-heading]{--tw-text-opacity:1;color:rgb(113 113 122/var(--tw-text-opacity,1))}.dark\\:\\[\\&_\\[cmdk-group-heading\\]\\]\\:rf-text-zinc-400 [cmdk-group-heading]:is(.rf-dark *){--tw-text-opacity:1;color:rgb(161 161 170/var(--tw-text-opacity,1))}.\\[\\&_\\[cmdk-group\\]\\:not\\(\\[hidden\\]\\)_\\~\\[cmdk-group\\]\\]\\:rf-pt-0 [cmdk-group]:not([hidden])~[cmdk-group]{padding-top:0}.\\[\\&_\\[cmdk-group\\]\\]\\:rf-px-2 [cmdk-group]{padding-left:.5rem;padding-right:.5rem}.\\[\\&_\\[cmdk-input-wrapper\\]_svg\\]\\:rf-h-5 [cmdk-input-wrapper] svg{height:1.25rem}.\\[\\&_\\[cmdk-input-wrapper\\]_svg\\]\\:rf-w-5 [cmdk-input-wrapper] svg{width:1.25rem}.\\[\\&_\\[cmdk-input\\]\\]\\:rf-h-12 [cmdk-input]{height:3rem}.\\[\\&_\\[cmdk-item\\]\\]\\:rf-px-2 [cmdk-item]{padding-left:.5rem;padding-right:.5rem}.\\[\\&_\\[cmdk-item\\]\\]\\:rf-py-3 [cmdk-item]{padding-bottom:.75rem;padding-top:.75rem}.\\[\\&_\\[cmdk-item\\]_svg\\]\\:rf-h-5 [cmdk-item] svg{height:1.25rem}.\\[\\&_\\[cmdk-item\\]_svg\\]\\:rf-w-5 [cmdk-item] svg{width:1.25rem}.\\[\\&_svg\\]\\:rf-pointer-events-none svg{pointer-events:none}.\\[\\&_svg\\]\\:rf-size-4 svg{height:1rem;width:1rem}.\\[\\&_svg\\]\\:rf-shrink-0 svg{flex-shrink:0}';

// lib/hooks/use-styles.ts
var useStyles = () => {
  useEffect3(() => {
    const existingStyle = document.querySelector(
      'style[data-styles="tscircuit-runframe"]'
    );
    if (existingStyle) return;
    const styleElement = document.createElement("style");
    styleElement.setAttribute("data-styles", "tscircuit-runframe");
    styleElement.textContent = styles_generated_default;
    document.head.appendChild(styleElement);
  }, []);
};

// lib/hooks/use-fullscreen-body-scroll.ts
import { useEffect as useEffect4 } from "react";
var useFullscreenBodyScroll = (isFullScreen) => {
  useEffect4(() => {
    if (isFullScreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFullScreen]);
};

// lib/hooks/use-local-storage-state.ts
import { useState as useState5, useEffect as useEffect5 } from "react";
function useLocalStorageState(key, initialValue, overrideValue) {
  const [state, setState] = useState5(() => {
    if (overrideValue !== void 0) return overrideValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });
  useEffect5(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, [key, state]);
  return [state, setState];
}

// lib/components/RenderLogViewer/RenderLogViewer.tsx
import { orderedRenderPhases as orderedRenderPhases2 } from "@tscircuit/core";
import { useState as useState6 } from "react";

// lib/components/RenderLogViewer/RenderTimingsBar.tsx
import { orderedRenderPhases } from "@tscircuit/core";
import "react";
import { jsx as jsx16, jsxs as jsxs10 } from "react/jsx-runtime";
var getPhaseColor = (phase) => {
  const index = orderedRenderPhases.indexOf(phase);
  const hue = index * 137.5 % 360;
  return `hsl(${hue}, 70%, 50%)`;
};
var RenderTimingsBar = ({
  phaseTimings
}) => {
  if (!phaseTimings) return null;
  const totalTime = Object.values(phaseTimings).reduce(
    (sum, time) => sum + time,
    0
  );
  return /* @__PURE__ */ jsxs10("div", { className: "rf-space-y-2 rf-w-full rf-px-4", children: [
    /* @__PURE__ */ jsx16("div", { className: "rf-relative rf-h-8 rf-flex rf-rounded-sm", children: orderedRenderPhases.map((phase) => {
      const time = phaseTimings[phase] || 0;
      const width = time / totalTime * 100;
      return /* @__PURE__ */ jsx16(
        "div",
        {
          className: "rf-group/bar rf-relative rf-overflow-visible",
          style: {
            width: `${width}%`,
            backgroundColor: getPhaseColor(phase)
          },
          children: /* @__PURE__ */ jsxs10("div", { className: "rf-opacity-0 group-hover/bar:rf-opacity-100 rf-transition-opacity rf-absolute rf-bottom-full rf-left-1/2 rf-transform -rf-translate-x-1/2 rf-mb-2 rf-px-2 rf-py-1 rf-text-xs rf-whitespace-nowrap rf-rounded rf-bg-gray-900 rf-text-white rf-pointer-events-none", children: [
            phase,
            ": ",
            time.toFixed(1),
            "ms"
          ] })
        },
        phase
      );
    }) }),
    /* @__PURE__ */ jsxs10("div", { className: "rf-text-xs rf-text-gray-500", children: [
      "Total: ",
      totalTime.toFixed(2),
      "ms"
    ] })
  ] });
};
var RenderTimingsBar_default = RenderTimingsBar;

// lib/components/RenderLogViewer/RenderLogViewer.tsx
import { jsx as jsx17, jsxs as jsxs11 } from "react/jsx-runtime";
var formatDebugOutputContent = (content) => {
  if (content instanceof Blob) return content;
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (typeof content === "object") {
    try {
      return JSON.stringify(content, null, 2);
    } catch (_error) {
      return String(content);
    }
  }
  return String(content);
};
var RenderLogViewer = ({
  renderLog,
  onRerunWithDebug
}) => {
  const [sortOption, setSortOption] = useState6(
    "chronological"
  );
  const [selectedDebugOption, setSelectedDebugOption] = useState6("");
  const debugOptions = [
    { value: "", label: "None" },
    {
      value: "DEBUG=Group_doInitialSchematicTraceRender",
      label: "DEBUG=Group_doInitialSchematicTraceRender"
    },
    {
      value: "DEBUG=Group_doInitialSchematicLayoutMatchpack",
      label: "DEBUG=Group_doInitialSchematicLayoutMatchpack"
    },
    {
      value: "DEBUG=Group_doInitialPcbLayoutPack",
      label: "DEBUG=Group_doInitialPcbLayoutPack"
    }
  ];
  if (!renderLog)
    return /* @__PURE__ */ jsxs11("div", { className: "rf-p-4 rf-bg-gray-100 rf-rounded-md", children: [
      /* @__PURE__ */ jsx17("div", { className: "rf-mb-4", children: "No render log, make sure this tab is open when you render" }),
      onRerunWithDebug && /* @__PURE__ */ jsxs11("div", { className: "rf-flex rf-gap-2 rf-items-center", children: [
        /* @__PURE__ */ jsx17(
          "select",
          {
            value: selectedDebugOption,
            onChange: (e) => setSelectedDebugOption(e.target.value),
            className: "rf-px-3 rf-py-1 rf-border rf-rounded rf-text-xs rf-bg-white",
            children: debugOptions.map((option) => /* @__PURE__ */ jsx17("option", { value: option.value, children: option.label }, option.value))
          }
        ),
        /* @__PURE__ */ jsx17(
          Button,
          {
            onClick: () => onRerunWithDebug(selectedDebugOption),
            size: "sm",
            className: "rf-text-xs",
            children: "Rerun Render with Debug"
          }
        )
      ] })
    ] });
  const orderedPhaseTimings = Object.entries(renderLog?.phaseTimings ?? {});
  if (sortOption === "chronological") {
    orderedPhaseTimings.sort(
      (a, b) => orderedRenderPhases2.indexOf(a[0]) - orderedRenderPhases2.indexOf(b[0])
    );
  } else {
    orderedPhaseTimings.sort((a, b) => b[1] - a[1]);
  }
  const totalTime = orderedPhaseTimings.reduce(
    (sum, [_, time]) => sum + time,
    0
  );
  return /* @__PURE__ */ jsxs11("div", { className: "rf-bg-white", children: [
    /* @__PURE__ */ jsxs11("div", { className: "rf-flex rf-justify-between rf-items-center rf-mb-4", children: [
      /* @__PURE__ */ jsx17("div", { children: "Render Logs" }),
      /* @__PURE__ */ jsxs11("div", { className: "rf-flex rf-gap-4 rf-items-center", children: [
        onRerunWithDebug && /* @__PURE__ */ jsxs11("div", { className: "rf-flex rf-gap-2 rf-items-center", children: [
          /* @__PURE__ */ jsx17(
            "select",
            {
              value: selectedDebugOption,
              onChange: (e) => setSelectedDebugOption(e.target.value),
              className: "rf-px-3 rf-py-1 rf-border rf-rounded rf-text-xs rf-bg-white",
              children: debugOptions.map((option) => /* @__PURE__ */ jsx17("option", { value: option.value, children: option.label }, option.value))
            }
          ),
          /* @__PURE__ */ jsx17(
            Button,
            {
              onClick: () => onRerunWithDebug(selectedDebugOption),
              size: "sm",
              className: "rf-text-xs",
              children: "Rerun Render with Debug"
            }
          )
        ] }),
        /* @__PURE__ */ jsx17("div", { className: "rf-flex rf-gap-2 rf-items-center", children: /* @__PURE__ */ jsxs11(
          "select",
          {
            onChange: (e) => {
              if (e.target.value) {
                const debugOutput = renderLog?.debugOutputs?.find(
                  (output) => output.name === e.target.value
                );
                if (debugOutput) {
                  const formattedContent = formatDebugOutputContent(
                    debugOutput.content
                  );
                  const blob = formattedContent instanceof Blob ? formattedContent : new Blob([formattedContent], {
                    type: "text/plain"
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `debug-${debugOutput.name}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }
                e.target.value = "";
              }
            },
            disabled: !renderLog?.debugOutputs || renderLog.debugOutputs.length === 0,
            className: "rf-px-3 rf-py-1 rf-border rf-rounded rf-text-xs rf-bg-white disabled:rf-opacity-50 disabled:rf-cursor-not-allowed",
            children: [
              /* @__PURE__ */ jsx17("option", { value: "", children: "Download Debug Output" }),
              renderLog?.debugOutputs?.map((output) => /* @__PURE__ */ jsx17("option", { value: output.name, children: output.name }, output.name))
            ]
          }
        ) }),
        /* @__PURE__ */ jsxs11("div", { className: "rf-flex rf-text-xs rf-items-center", children: [
          /* @__PURE__ */ jsx17("div", { className: "rf-mr-2", children: "Sort by:" }),
          /* @__PURE__ */ jsxs11(
            "select",
            {
              value: sortOption,
              onChange: (e) => setSortOption(e.target.value),
              className: "rf-px-2 rf-py-1 rf-border rf-rounded rf-text-xs",
              children: [
                /* @__PURE__ */ jsx17("option", { value: "chronological", children: "Phase Order" }),
                /* @__PURE__ */ jsx17("option", { value: "longest", children: "Duration" })
              ]
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx17(RenderTimingsBar_default, { phaseTimings: renderLog.phaseTimings }),
    /* @__PURE__ */ jsxs11("table", { className: "rf-w-full rf-text-xs", children: [
      /* @__PURE__ */ jsx17("thead", { children: /* @__PURE__ */ jsxs11("tr", { children: [
        /* @__PURE__ */ jsx17("th", { className: "rf-text-left rf-p-2", children: "Phase Order" }),
        /* @__PURE__ */ jsx17("th", { className: "rf-text-left rf-p-2", children: "Phase" }),
        /* @__PURE__ */ jsx17("th", { className: "rf-text-left rf-p-2", children: "Duration (ms)" })
      ] }) }),
      /* @__PURE__ */ jsx17("tbody", { children: orderedPhaseTimings.map(([phase, duration]) => /* @__PURE__ */ jsxs11("tr", { children: [
        /* @__PURE__ */ jsx17("td", { className: "rf-p-2", children: orderedRenderPhases2.indexOf(phase) }),
        /* @__PURE__ */ jsx17("td", { className: "rf-p-2", children: phase }),
        /* @__PURE__ */ jsx17("td", { className: "rf-p-2", children: /* @__PURE__ */ jsx17("div", { className: "rf-w-8", children: /* @__PURE__ */ jsx17(
          "div",
          {
            className: "rf-h-2 rf-rounded-sm",
            style: {
              backgroundColor: getPhaseColor(phase),
              width: `${duration / totalTime * 100}%`
            }
          }
        ) }) }),
        /* @__PURE__ */ jsx17("td", { className: "rf-p-2", children: /* @__PURE__ */ jsxs11("div", { className: "rf-flex w-full", children: [
          /* @__PURE__ */ jsxs11("span", { className: "rf-flex-grow", children: [
            duration,
            "ms"
          ] }),
          /* @__PURE__ */ jsxs11("span", { className: "rf-text-gray-500 rf-pr-2", children: [
            (duration / totalTime * 100).toFixed(1),
            "%"
          ] })
        ] }) })
      ] }, phase)) })
    ] })
  ] });
};

// lib/components/SolversTabContent/SolversTabContent.tsx
import { SOLVERS } from "@tscircuit/core";
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react";
import { Box, BugIcon, DownloadIcon as DownloadIcon2, LayoutGrid, Route } from "lucide-react";
import { useMemo as useMemo2, useState as useState7 } from "react";
import { ErrorBoundary } from "react-error-boundary";

// lib/hooks/useInjectTailwind.ts
import { useEffect as useEffect6 } from "react";
var useInjectTailwind = () => {
  useEffect6(() => {
    const tailwindScriptId = "tailwind-cdn-script";
    if (document.getElementById(tailwindScriptId) || window.tailwind) {
      return;
    }
    const testEl = document.createElement("div");
    testEl.className = "hidden";
    document.body.appendChild(testEl);
    const isHidden = window.getComputedStyle(testEl).display === "none";
    document.body.removeChild(testEl);
    if (isHidden) {
      return;
    }
    const script = document.createElement("script");
    script.id = tailwindScriptId;
    script.src = "https://cdn.tailwindcss.com";
    document.head.appendChild(script);
  }, []);
};

// lib/optional-features/exporting/open-for-download.ts
var OBJECT_URL_CLEANUP_DELAY_MS = 1e3;
var openForDownload = (content, opts) => {
  const { fileName, mimeType = "text/plain" } = opts;
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, OBJECT_URL_CLEANUP_DELAY_MS);
};

// lib/utils/sanitizeFileName.ts
var sanitizeFileName = (name) => {
  let sanitized = name.trim().replace(/[\\/:*?"<>|]/g, "_").replace(/[\x00-\x1f]/g, "").replace(/^\.+/, "").replace(/\.+$/, "").replace(/\s+/g, " ").replace(/_+/g, "_");
  const reserved = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
  if (reserved.test(sanitized)) {
    sanitized = `_${sanitized}`;
  }
  sanitized = sanitized.slice(0, 200);
  return sanitized || "untitled";
};

// lib/components/SolversTabContent/get-solver-constructor-args.ts
var getSolverConstructorArgs = (solverEvent) => {
  const constructorArgs = solverEvent.solverConstructorArgs ?? [
    solverEvent.solverParams
  ];
  if (solverEvent.solverName !== "AutoroutingPipelineSolver7_MultiGraph" || constructorArgs.length !== 1) {
    return constructorArgs;
  }
  const [{ input, options }] = constructorArgs;
  return [input, options];
};

// lib/components/SolversTabContent/SolversTabContent.tsx
import { jsx as jsx18, jsxs as jsxs12 } from "react/jsx-runtime";
var AUTOROUTER_REPORT_LINK = "https://github.com/tscircuit/tscircuit-autorouter/issues/new";
var COPPER_POUR_REPORT_LINK = "https://github.com/tscircuit/copper-pour-solver/issues/new";
var PACK_SOLVER_REPORT_LINK = "https://github.com/tscircuit/calculate-packing/issues/new";
var MATCHPACK_REPORT_LINK = "https://github.com/tscircuit/matchpack/issues/new";
var SCHEMATIC_TRACE_REPORT_LINK = "https://github.com/tscircuit/schematic-trace-solver/issues/new?template=json-bug-report.yml";
var SOLVER_REPORT_LINKS = {
  PackSolver2: PACK_SOLVER_REPORT_LINK,
  LayoutPipelineSolver: MATCHPACK_REPORT_LINK,
  AutoroutingPipelineSolver: AUTOROUTER_REPORT_LINK,
  AssignableAutoroutingPipeline2: AUTOROUTER_REPORT_LINK,
  AssignableAutoroutingPipeline3: AUTOROUTER_REPORT_LINK,
  AutoroutingPipeline1_OriginalUnravel: AUTOROUTER_REPORT_LINK,
  AutoroutingPipelineSolver3_HgPortPointPathing: AUTOROUTER_REPORT_LINK,
  AutoroutingPipelineSolver4: AUTOROUTER_REPORT_LINK,
  AutoroutingPipelineSolver5: AUTOROUTER_REPORT_LINK,
  AutoroutingPipelineSolver7_MultiGraph: AUTOROUTER_REPORT_LINK,
  AutoroutingPipelineSolver8: AUTOROUTER_REPORT_LINK,
  CopperPourPipelineSolver: COPPER_POUR_REPORT_LINK,
  SchematicTracePipelineSolver: SCHEMATIC_TRACE_REPORT_LINK
};
var getSolverIcon = (solverName) => {
  if (solverName.toLowerCase().includes("pack")) {
    return LayoutGrid;
  }
  if (solverName.toLowerCase().includes("rout")) {
    return Route;
  }
  return Box;
};
var getSolverReportLink = (solverName) => {
  const explicitLink = SOLVER_REPORT_LINKS[solverName];
  if (explicitLink) return explicitLink;
  const normalizedName = solverName.toLowerCase();
  if (normalizedName.includes("autorout")) return AUTOROUTER_REPORT_LINK;
  if (normalizedName.includes("schematic") && normalizedName.includes("trace")) {
    return SCHEMATIC_TRACE_REPORT_LINK;
  }
  if (normalizedName.includes("copperpour")) return COPPER_POUR_REPORT_LINK;
  if (normalizedName.includes("pack")) return PACK_SOLVER_REPORT_LINK;
  return null;
};
var getSolverInputFileName = (solverEvent) => `${sanitizeFileName(`${solverEvent.componentName}-${solverEvent.solverName}`)}-solver-input.json`;
var downloadSolverInput = (solverEvent) => {
  openForDownload(JSON.stringify(solverEvent.solverParams, null, 2), {
    fileName: getSolverInputFileName(solverEvent),
    mimeType: "application/json"
  });
};
var SolverDebuggerActions = ({
  solverEvent
}) => {
  const reportLink = getSolverReportLink(solverEvent.solverName);
  return /* @__PURE__ */ jsxs12("div", { className: "rf-flex rf-items-center rf-justify-end rf-gap-2 rf-border-b rf-border-gray-200 rf-bg-gray-50 rf-px-4 rf-py-2", children: [
    /* @__PURE__ */ jsxs12(
      Button,
      {
        type: "button",
        variant: "outline",
        size: "sm",
        onClick: () => downloadSolverInput(solverEvent),
        children: [
          /* @__PURE__ */ jsx18(DownloadIcon2, { className: "rf-w-4 rf-h-4" }),
          "Download"
        ]
      }
    ),
    reportLink ? /* @__PURE__ */ jsx18(Button, { asChild: true, variant: "outline", size: "sm", children: /* @__PURE__ */ jsxs12("a", { href: reportLink, target: "_blank", rel: "noopener noreferrer", children: [
      /* @__PURE__ */ jsx18(BugIcon, { className: "rf-w-4 rf-h-4" }),
      "Report"
    ] }) }) : /* @__PURE__ */ jsxs12(
      Button,
      {
        type: "button",
        variant: "outline",
        size: "sm",
        disabled: true,
        title: "No report link configured for this solver",
        children: [
          /* @__PURE__ */ jsx18(BugIcon, { className: "rf-w-4 rf-h-4" }),
          "Report"
        ]
      }
    )
  ] });
};
var SolverReportIconButton = ({
  solverEvent
}) => {
  const reportLink = getSolverReportLink(solverEvent.solverName);
  if (!reportLink) {
    return /* @__PURE__ */ jsx18(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "icon",
        className: "rf-h-8 rf-w-8",
        disabled: true,
        title: "No report link configured for this solver",
        "aria-label": "Report solver bug",
        children: /* @__PURE__ */ jsx18(BugIcon, { className: "rf-w-4 rf-h-4" })
      }
    );
  }
  return /* @__PURE__ */ jsx18(Button, { asChild: true, variant: "ghost", size: "icon", className: "rf-h-8 rf-w-8", children: /* @__PURE__ */ jsx18(
    "a",
    {
      href: reportLink,
      target: "_blank",
      rel: "noopener noreferrer",
      title: "Report solver bug",
      "aria-label": "Report solver bug",
      children: /* @__PURE__ */ jsx18(BugIcon, { className: "rf-w-4 rf-h-4" })
    }
  ) });
};
var SolversTabContent = ({
  solverEvents = []
}) => {
  const [selectedSolverId, setSelectedSolverId] = useState7(null);
  useInjectTailwind();
  const solversById = useMemo2(() => {
    const map = /* @__PURE__ */ new Map();
    for (const event of solverEvents) {
      const id = `${event.componentName}-${event.solverName}`;
      map.set(id, event);
    }
    return map;
  }, [solverEvents]);
  const solverIds = useMemo2(() => Array.from(solversById.keys()), [solversById]);
  const selectedSolverEvent = selectedSolverId ? solversById.get(selectedSolverId) : null;
  const solverResult = useMemo2(() => {
    if (!selectedSolverEvent) {
      return { instance: null, error: null, classFound: false };
    }
    const SolverClass = SOLVERS[selectedSolverEvent.solverName];
    if (!SolverClass) {
      return {
        instance: null,
        error: `Solver class "${selectedSolverEvent.solverName}" not found in SOLVERS registry. Available: ${Object.keys(SOLVERS).join(", ")}`,
        classFound: false
      };
    }
    try {
      const instance = new SolverClass(
        ...getSolverConstructorArgs(selectedSolverEvent)
      );
      return { instance, error: null, classFound: true };
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error("Failed to reconstruct solver:", e);
      return {
        instance: null,
        error: `Failed to instantiate solver: ${errorMessage}`,
        classFound: true
      };
    }
  }, [selectedSolverEvent]);
  if (solverEvents.length === 0) {
    return /* @__PURE__ */ jsx18("div", { className: "rf-p-4", children: /* @__PURE__ */ jsx18("div", { className: "rf-bg-gray-50 rf-rounded-md rf-border rf-border-gray-200", children: /* @__PURE__ */ jsxs12("div", { className: "rf-p-4", children: [
      /* @__PURE__ */ jsx18("h3", { className: "rf-text-lg rf-font-semibold rf-text-gray-800 rf-mb-3", children: "No Solvers Detected" }),
      /* @__PURE__ */ jsx18("p", { className: "rf-text-sm rf-text-gray-600", children: "Solvers will appear here when the circuit runs. Solvers are used for tasks like component packing and autorouting." })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxs12("div", { className: "rf-flex rf-h-full rf-overflow-hidden", children: [
    /* @__PURE__ */ jsxs12("div", { className: "rf-w-64 rf-border-r rf-border-gray-200 rf-overflow-y-auto rf-flex-shrink-0", children: [
      /* @__PURE__ */ jsxs12("div", { className: "rf-text-xs rf-font-semibold rf-text-gray-500 rf-px-3 rf-py-2 rf-bg-gray-50 rf-border-b rf-border-gray-200", children: [
        solverIds.length,
        " ",
        solverIds.length === 1 ? "Solver" : "Solvers"
      ] }),
      solverIds.map((id) => {
        const solver = solversById.get(id);
        const isSelected = selectedSolverId === id;
        return /* @__PURE__ */ jsx18(
          "div",
          {
            className: `rf-px-3 rf-py-2 rf-cursor-pointer rf-border-b rf-border-gray-100 ${isSelected ? "rf-bg-blue-50 rf-border-l-2 rf-border-l-blue-500" : "hover:rf-bg-gray-50"}`,
            onClick: () => setSelectedSolverId(id),
            children: (() => {
              const SolverIcon = getSolverIcon(solver.solverName);
              return /* @__PURE__ */ jsxs12("div", { className: "rf-flex rf-items-center rf-gap-2", children: [
                /* @__PURE__ */ jsx18(SolverIcon, { className: "rf-w-4 rf-h-4 rf-text-blue-500 rf-flex-shrink-0" }),
                /* @__PURE__ */ jsxs12("div", { className: "rf-flex-1 rf-min-w-0", children: [
                  /* @__PURE__ */ jsx18("div", { className: "rf-text-sm rf-font-medium rf-text-gray-800 rf-truncate", children: solver.componentName }),
                  /* @__PURE__ */ jsx18("div", { className: "rf-text-xs rf-text-gray-500 rf-truncate", children: solver.solverName })
                ] })
              ] });
            })()
          },
          id
        );
      })
    ] }),
    /* @__PURE__ */ jsx18("div", { className: "rf-flex-1 rf-overflow-hidden", children: selectedSolverEvent ? solverResult.instance ? /* @__PURE__ */ jsxs12("div", { className: "rf-flex rf-h-full rf-flex-col rf-overflow-y-auto", children: [
      /* @__PURE__ */ jsx18(SolverDebuggerActions, { solverEvent: selectedSolverEvent }),
      /* @__PURE__ */ jsx18("div", { className: "rf-min-h-0 rf-flex-1", children: /* @__PURE__ */ jsx18(
        ErrorBoundary,
        {
          fallback: /* @__PURE__ */ jsx18("div", { className: "rf-p-4", children: /* @__PURE__ */ jsxs12("div", { className: "rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200 rf-p-4", children: [
            /* @__PURE__ */ jsx18("h3", { className: "rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-2", children: "Error Loading Solver Debugger" }),
            /* @__PURE__ */ jsxs12("p", { className: "rf-text-sm rf-text-red-600", children: [
              "Failed to render the solver debugger for",
              " ",
              selectedSolverEvent.solverName
            ] })
          ] }) }),
          children: /* @__PURE__ */ jsx18(GenericSolverDebugger, { solver: solverResult.instance })
        }
      ) })
    ] }) : /* @__PURE__ */ jsxs12("div", { className: "rf-p-4", children: [
      /* @__PURE__ */ jsxs12("div", { className: "rf-mb-4", children: [
        /* @__PURE__ */ jsx18("h3", { className: "rf-text-lg rf-font-semibold rf-text-gray-800", children: selectedSolverEvent.solverName }),
        /* @__PURE__ */ jsxs12("p", { className: "rf-text-sm rf-text-gray-500", children: [
          "Component: ",
          selectedSolverEvent.componentName
        ] })
      ] }),
      solverResult.error && /* @__PURE__ */ jsx18(
        "div",
        {
          className: `rf-rounded-md rf-border rf-p-4 rf-mb-4 ${solverResult.classFound ? "rf-bg-red-50 rf-border-red-200" : "rf-bg-yellow-50 rf-border-yellow-200"}`,
          children: /* @__PURE__ */ jsx18(
            "p",
            {
              className: `rf-text-sm ${solverResult.classFound ? "rf-text-red-700" : "rf-text-yellow-700"}`,
              children: solverResult.error
            }
          )
        }
      ),
      /* @__PURE__ */ jsxs12("div", { className: "rf-border rf-border-gray-200 rf-rounded-md rf-overflow-hidden", children: [
        /* @__PURE__ */ jsxs12("div", { className: "rf-px-3 rf-py-2 rf-bg-gray-50 rf-flex rf-items-center rf-justify-between rf-gap-2", children: [
          /* @__PURE__ */ jsx18("span", { className: "rf-text-sm rf-font-medium rf-text-gray-700", children: "Solver Parameters" }),
          /* @__PURE__ */ jsxs12("div", { className: "rf-flex rf-items-center rf-gap-1", children: [
            /* @__PURE__ */ jsx18(SolverReportIconButton, { solverEvent: selectedSolverEvent }),
            /* @__PURE__ */ jsx18(
              Button,
              {
                type: "button",
                variant: "ghost",
                size: "icon",
                className: "rf-h-8 rf-w-8",
                "aria-label": "Download solver input JSON",
                title: "Download solver input JSON",
                onClick: () => downloadSolverInput(selectedSolverEvent),
                children: /* @__PURE__ */ jsx18(DownloadIcon2, { className: "rf-w-4 rf-h-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx18("div", { className: "rf-p-3 rf-bg-white rf-border-t rf-border-gray-200", children: /* @__PURE__ */ jsx18("pre", { className: "rf-text-xs rf-font-mono rf-text-gray-600 rf-whitespace-pre-wrap rf-overflow-x-auto", children: JSON.stringify(selectedSolverEvent.solverParams, null, 2) }) })
      ] })
    ] }) : /* @__PURE__ */ jsx18("div", { className: "rf-flex rf-items-center rf-justify-center rf-h-full", children: /* @__PURE__ */ jsx18("p", { className: "rf-text-sm rf-text-gray-500", children: "Select a solver from the list to view details" }) }) })
  ] });
};

// lib/components/AutoroutingTabContent/AutoroutingTabContent.tsx
import { PCBViewer as PCBViewer2 } from "@tscircuit/pcb-viewer";

// lib/autorouting/capture-autorouting-phase.ts
var metadataKeys = [
  "subcircuit_id",
  "componentDisplayName",
  "phaseName",
  "routingPhaseIndex",
  "phaseOrdinal",
  "phaseCount",
  "phaseStageIndex",
  "phaseStageCount",
  "connectionCount",
  "obstacleCount",
  "previousTraceCount",
  "isReroutePhase",
  "autorouterName",
  "autorouterVersion",
  "solverName",
  "effort",
  "cacheStatus"
];
var phaseIdentityKeys = [
  "phaseOrdinal",
  "routingPhaseIndex",
  "phaseName",
  "phaseStageIndex"
];
function getMatchingPhaseIndex(phases, event) {
  let matchingIndex = -1;
  let highestScore = -1;
  for (let index = phases.length - 1; index >= 0; index--) {
    const phase = phases[index];
    if (phase.status !== "running" || phase.subcircuit_id !== event.subcircuit_id || phase.componentDisplayName !== event.componentDisplayName) {
      continue;
    }
    let score = 0;
    let conflictingIdentity = false;
    for (const key of phaseIdentityKeys) {
      if (phase[key] === void 0 || event[key] === void 0) continue;
      if (phase[key] !== event[key]) {
        conflictingIdentity = true;
        break;
      }
      score++;
    }
    if (!conflictingIdentity && score > highestScore) {
      matchingIndex = index;
      highestScore = score;
    }
  }
  return matchingIndex;
}
function captureAutoroutingPhase(phases, event) {
  const metadata = Object.fromEntries(
    metadataKeys.filter((key) => event[key] !== void 0).map((key) => [key, event[key]])
  );
  const simpleRouteJson = event.simpleRouteJson ? structuredClone(event.simpleRouteJson) : void 0;
  const index = event.type === "autorouting:start" ? -1 : getMatchingPhaseIndex(phases, event);
  const phase = {
    ...index === -1 ? { id: `autorouting_phase_${phases.length + 1}` } : phases[index],
    ...metadata,
    status: event.type === "autorouting:start" ? "running" : event.type === "autorouting:end" ? "complete" : "error",
    ...event.type === "autorouting:start" ? { startSimpleRouteJson: simpleRouteJson } : event.type === "autorouting:end" ? { endSimpleRouteJson: simpleRouteJson } : {
      errorSimpleRouteJson: simpleRouteJson,
      error: event.error ? { ...event.error } : void 0
    }
  };
  if (index === -1) return [...phases, phase];
  return phases.map(
    (previousPhase, phaseIndex) => phaseIndex === index ? phase : previousPhase
  );
}

// lib/autorouting/get-autorouting-phase-autorouter-name.ts
var strategyLabels = /* @__PURE__ */ new Map([
  ["custom", "Custom"],
  ["fanout", "Fanout"],
  ["single_layer_fanout", "Single layer fanout"],
  ["tscircuit_simplify", "Simplify"]
]);
var genericStrategies = /* @__PURE__ */ new Set([
  "tscircuit",
  "default",
  "auto",
  "auto_local"
]);
function formatSolverName(solverName) {
  if (solverName === "FanoutSolver") return "Fanout";
  if (solverName === "AutoroutingPipelineSolver11_Simplification") {
    return "Simplify";
  }
  const pipeline = solverName.match(
    /^AutoroutingPipeline(?:Solver)?(\d+)(?:_|$)/
  );
  if (pipeline) return `Pipeline${pipeline[1]}`;
  const assignable = solverName.match(/^AssignableAutoroutingPipeline(\d+)$/);
  if (assignable) return `Assignable${assignable[1]}`;
  return solverName;
}
function getAutoroutingPhaseAutorouterName(phase) {
  const autorouterName = phase.autorouterName?.trim();
  const normalizedStrategy = autorouterName?.replace(/-/g, "_");
  const strategyLabel = normalizedStrategy && strategyLabels.get(normalizedStrategy);
  if (strategyLabel) return strategyLabel;
  if (normalizedStrategy && !genericStrategies.has(normalizedStrategy)) {
    return autorouterName;
  }
  const solverName = phase.solverName?.trim();
  if (solverName) return formatSolverName(solverName);
  const version2 = phase.autorouterVersion?.trim();
  if (version2) {
    const pipeline = version2.match(/^beta[_-]pipeline(\d+)$/);
    if (pipeline) return `Pipeline${pipeline[1]}`;
    if (version2 === "latest") return "default";
    return version2;
  }
  return autorouterName ? "default" : "Unknown";
}

// lib/autorouting/build-autorouting-phase-circuit-json.ts
var AUTOROUTING_PHASE_HIGHLIGHT_COLOR = "#fbbf24";
function getOutputTraces(phase) {
  const outputTraces = phase.endSimpleRouteJson?.traces ?? [];
  const replacedTraceIds = new Set(
    outputTraces.flatMap(
      (trace) => [trace.pcb_trace_id, trace.__replaces_pcb_trace_id].filter(
        (traceId) => traceId !== void 0
      )
    )
  );
  const preloadedTraces = (phase.startSimpleRouteJson?.traces ?? []).filter(
    (trace) => !replacedTraceIds.has(trace.pcb_trace_id)
  );
  return [...preloadedTraces, ...outputTraces];
}
function getAutoroutingPhaseChangedTraceIds(phase) {
  const inputTracesById = new Map(
    (phase.startSimpleRouteJson?.traces ?? []).map((trace) => [
      trace.pcb_trace_id,
      trace
    ])
  );
  return (phase.endSimpleRouteJson?.traces ?? []).filter((trace) => {
    const inputTrace = inputTracesById.get(trace.pcb_trace_id);
    return !inputTrace || Boolean(trace.__replaces_pcb_trace_id) && trace.__replaces_pcb_trace_id !== inputTrace.__replaces_pcb_trace_id || JSON.stringify(inputTrace.route) !== JSON.stringify(trace.route);
  }).map((trace) => trace.pcb_trace_id);
}
function getViaDimensions(routePoint, simpleRouteJson) {
  return {
    outer_diameter: routePoint.via_diameter ?? simpleRouteJson.minViaPadDiameter ?? simpleRouteJson.min_via_pad_diameter ?? simpleRouteJson.minViaDiameter ?? 0.6,
    hole_diameter: routePoint.via_hole_diameter ?? simpleRouteJson.minViaHoleDiameter ?? simpleRouteJson.min_via_hole_diameter ?? 0.3
  };
}
function getCircuitJsonTraceSegments(trace, simpleRouteJson) {
  const route = [];
  for (const point of trace.route) {
    if (point.route_type === "wire") {
      route.push({ ...point, layer: point.layer });
    } else if (point.route_type === "via") {
      route.push({
        route_type: "via",
        x: point.x,
        y: point.y,
        from_layer: point.from_layer,
        to_layer: point.to_layer,
        ...getViaDimensions(point, simpleRouteJson)
      });
    } else if (point.route_type === "through_obstacle") {
      route.push({
        route_type: "through_pad",
        start: { ...point.start },
        end: { ...point.end },
        width: point.width,
        start_layer: point.from_layer,
        end_layer: point.to_layer,
        pcb_smtpad_id: point.circuitJsonMetadata?.pcb_smtpad_id,
        pcb_plated_hole_id: point.circuitJsonMetadata?.pcb_plated_hole_id
      });
    }
  }
  const nearestWireIndex = (point) => {
    let nearestIndex = -1;
    let nearestDistance = Number.POSITIVE_INFINITY;
    route.forEach((routePoint, index) => {
      if (routePoint.route_type !== "wire") return;
      const distance = Math.hypot(
        routePoint.x - point.x,
        routePoint.y - point.y
      );
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    return nearestIndex;
  };
  const jumperRanges = trace.route.filter((point) => point.route_type === "jumper").map(
    (jumper) => [nearestWireIndex(jumper.start), nearestWireIndex(jumper.end)].sort(
      (a, b) => a - b
    )
  ).filter(([start, end]) => start >= 0 && end > start).sort(([firstStart], [secondStart]) => firstStart - secondStart);
  const segments = [];
  let segmentStart = 0;
  for (const [jumperStart, jumperEnd] of jumperRanges) {
    if (jumperStart >= segmentStart) {
      segments.push(route.slice(segmentStart, jumperStart + 1));
    }
    segmentStart = Math.max(segmentStart, jumperEnd);
  }
  if (segmentStart < route.length) segments.push(route.slice(segmentStart));
  return segments;
}
function getAutoroutingPhaseHighlightGraphics(phase) {
  const lines = [];
  const circles = [];
  const simpleRouteJson = phase.endSimpleRouteJson;
  if (!simpleRouteJson) return { lines, circles };
  const changedTraceIds = new Set(getAutoroutingPhaseChangedTraceIds(phase));
  for (const trace of simpleRouteJson.traces ?? []) {
    if (!changedTraceIds.has(trace.pcb_trace_id)) continue;
    for (const segment of getCircuitJsonTraceSegments(trace, simpleRouteJson)) {
      let previousPoint;
      for (const point of segment) {
        if (point.route_type === "through_pad") {
          previousPoint = {
            ...point.end,
            layer: point.end_layer,
            width: point.width
          };
          continue;
        }
        const layer = point.route_type === "wire" ? point.layer : point.from_layer;
        if (previousPoint && previousPoint.layer === layer && (previousPoint.x !== point.x || previousPoint.y !== point.y)) {
          lines.push({
            points: [
              { x: previousPoint.x, y: previousPoint.y },
              { x: point.x, y: point.y }
            ],
            strokeWidth: point.route_type === "wire" ? point.width : previousPoint.width,
            strokeColor: AUTOROUTING_PHASE_HIGHLIGHT_COLOR,
            layer
          });
        }
        if (point.route_type === "via") {
          circles.push({
            center: { x: point.x, y: point.y },
            radius: point.outer_diameter / 2,
            stroke: AUTOROUTING_PHASE_HIGHLIGHT_COLOR,
            fill: "transparent"
          });
        }
        previousPoint = {
          x: point.x,
          y: point.y,
          layer: point.route_type === "wire" ? point.layer : point.to_layer,
          width: point.route_type === "wire" ? point.width : previousPoint?.width ?? simpleRouteJson.minTraceWidth
        };
      }
    }
  }
  return { coordinateSystem: "cartesian", lines, circles };
}
function getRouteGeometryHash(route) {
  const geometry = JSON.stringify(route);
  let hash = 2166136261;
  for (let index = 0; index < geometry.length; index++) {
    hash = Math.imul(hash ^ geometry.charCodeAt(index), 16777619);
  }
  return (hash >>> 0).toString(36);
}
var finalRoutingTypes = /* @__PURE__ */ new Set([
  "pcb_trace",
  "pcb_via",
  "pcb_copper_pour",
  "pcb_ground_plane",
  "pcb_ground_plane_region",
  "pcb_thermal_spoke",
  "pcb_breakout_point"
]);
function buildAutoroutingPhaseCircuitJson(circuitJson, phase, view) {
  const simpleRouteJson = view === "input" ? phase.startSimpleRouteJson ?? phase.errorSimpleRouteJson : phase.endSimpleRouteJson;
  const context = circuitJson.filter(
    (element) => !finalRoutingTypes.has(element.type) && !element.type.endsWith("_error") && !element.type.endsWith("_warning")
  );
  if (!simpleRouteJson) return context;
  const traces = view === "input" ? simpleRouteJson.traces ?? [] : getOutputTraces(phase);
  const sourceTraceIds = new Set(
    circuitJson.filter((element) => element.type === "source_trace").map((trace) => trace.source_trace_id)
  );
  const layerStack = [
    "top",
    ...Array.from(
      { length: Math.max(0, simpleRouteJson.layerCount - 2) },
      (_, layerIndex) => `inner${layerIndex + 1}`
    ),
    ...simpleRouteJson.layerCount > 1 ? ["bottom"] : []
  ];
  const snapshotCopper = [];
  for (const trace of traces) {
    const connection = simpleRouteJson.connections.find(
      (connection2) => connection2.name === trace.connection_name || connection2.source_trace_id === trace.connection_name
    );
    const sourceTraceId = connection?.source_trace_id ?? trace.connection_name ?? "";
    const segments = getCircuitJsonTraceSegments(trace, simpleRouteJson);
    for (const [segmentIndex, route] of segments.entries()) {
      const pcbTrace = {
        type: "pcb_trace",
        // PCBViewer's cache only considers IDs, bounds, and route length.
        // Include geometry so same-bounds reroutes invalidate it while keeping
        // the board ID and camera stable across Input/Output and phase changes.
        pcb_trace_id: `${phase.id}_${view}_${trace.pcb_trace_id}_${segmentIndex}_${getRouteGeometryHash(route)}`,
        subcircuit_id: phase.subcircuit_id ?? void 0,
        source_trace_id: sourceTraceIds.has(sourceTraceId) ? sourceTraceId : void 0,
        route
      };
      snapshotCopper.push(pcbTrace);
      for (const [routeIndex, point] of route.entries()) {
        if (point.route_type !== "via") continue;
        const fromLayerIndex = layerStack.indexOf(point.from_layer);
        const toLayerIndex = layerStack.indexOf(point.to_layer);
        const pcbVia = {
          type: "pcb_via",
          pcb_via_id: `${pcbTrace.pcb_trace_id}_via_${routeIndex}`,
          pcb_trace_id: pcbTrace.pcb_trace_id,
          subcircuit_id: phase.subcircuit_id ?? void 0,
          x: point.x,
          y: point.y,
          outer_diameter: point.outer_diameter,
          hole_diameter: point.hole_diameter,
          layers: fromLayerIndex >= 0 && toLayerIndex >= 0 ? layerStack.slice(
            Math.min(fromLayerIndex, toLayerIndex),
            Math.max(fromLayerIndex, toLayerIndex) + 1
          ) : [point.from_layer, point.to_layer]
        };
        snapshotCopper.push(pcbVia);
      }
    }
  }
  return [...context, ...snapshotCopper];
}

// lib/components/AutoroutingTabContent/AutoroutingTabContent.tsx
import {
  Check as Check2,
  ChevronRight as ChevronRight3,
  CircleAlert,
  Download,
  Loader2,
  Route as Route2
} from "lucide-react";
import { useLayoutEffect as useLayoutEffect2, useMemo as useMemo3, useRef as useRef2, useState as useState8 } from "react";
import { jsx as jsx19, jsxs as jsxs13 } from "react/jsx-runtime";
var getPhaseTitle = (phase, index) => phase.phaseName || `Phase ${phase.phaseOrdinal ?? index + 1}`;
var getPhaseScope = (phase) => {
  const name = phase.componentDisplayName?.match(/name="([^"]+)"/)?.[1];
  return name?.replace(/^\./, "") || phase.componentDisplayName || phase.subcircuit_id || "Board";
};
var getCaptureSource = (phase) => phase.startSimpleRouteJson ?? phase.endSimpleRouteJson ?? phase.errorSimpleRouteJson;
var viewerInitialState = {
  is_showing_autorouting: true,
  is_showing_rats_nest: false,
  is_showing_drc_errors: false,
  is_showing_drc_warnings: false,
  is_showing_pcb_groups: false
};
var AutoroutingTabContent = ({
  circuitJson,
  phases = [],
  isRunning = false
}) => {
  const [pinnedPhase, setPinnedPhase] = useState8(null);
  const [mode, setMode] = useState8("output");
  const [highlightChanges, setHighlightChanges] = useState8(true);
  const [showJson, setShowJson] = useState8(false);
  const viewerContainer = useRef2(null);
  const [viewerHeight, setViewerHeight] = useState8(480);
  const pinnedIndex = pinnedPhase ? phases.findIndex(
    (phase) => phase.id === pinnedPhase.id && getCaptureSource(phase) === getCaptureSource(pinnedPhase)
  ) : -1;
  const selectedIndex = pinnedIndex < 0 ? phases.length - 1 : pinnedIndex;
  const selectedPhase = phases[selectedIndex];
  const followLatest = pinnedIndex < 0;
  const hasOutput = Boolean(selectedPhase?.endSimpleRouteJson);
  const inputSnapshot = selectedPhase?.startSimpleRouteJson ?? selectedPhase?.errorSimpleRouteJson;
  const hasInput = Boolean(inputSnapshot);
  const actualMode = mode === "output" && !hasOutput ? "input" : mode === "input" && !hasInput ? "output" : mode;
  const snapshot = actualMode === "input" ? inputSnapshot : selectedPhase?.endSimpleRouteJson;
  const phaseCircuitJson = useMemo3(() => {
    if (!selectedPhase || !snapshot) return null;
    return buildAutoroutingPhaseCircuitJson(
      circuitJson ?? [],
      selectedPhase,
      actualMode
    );
  }, [circuitJson, selectedPhase, snapshot, actualMode]);
  const highlightGraphics = useMemo3(
    () => selectedPhase && actualMode === "output" && highlightChanges ? getAutoroutingPhaseHighlightGraphics(selectedPhase) : { lines: [], circles: [] },
    [selectedPhase, actualMode, highlightChanges]
  );
  useLayoutEffect2(() => {
    const container = viewerContainer.current;
    if (!container) return;
    const resize = () => setViewerHeight(Math.max(360, container.clientHeight));
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [Boolean(selectedPhase)]);
  if (!selectedPhase) {
    return /* @__PURE__ */ jsxs13("div", { className: "rf-flex rf-min-h-[400px] rf-flex-col rf-items-center rf-justify-center rf-gap-3 rf-p-8 rf-text-center", children: [
      /* @__PURE__ */ jsx19(Route2, { className: "rf-h-7 rf-w-7 rf-text-blue-500" }),
      /* @__PURE__ */ jsx19("h3", { className: "rf-text-base rf-font-medium", children: isRunning ? "Waiting for autorouting" : "No autorouting captures" }),
      /* @__PURE__ */ jsx19("p", { className: "rf-max-w-md rf-text-sm rf-text-gray-500", children: isRunning ? "Phases appear as the circuit routes. Each capture includes its input and output on the PCB." : "Run a circuit with autorouting enabled to inspect its phases. A circuit JSON file alone does not include routing history." })
    ] });
  }
  const title = getPhaseTitle(selectedPhase, selectedIndex);
  const active = selectedPhase.status === "running" && isRunning;
  const outputMissing = !hasOutput;
  const inputConnections = inputSnapshot?.connections.length;
  const traceCount = phaseCircuitJson?.filter((element) => element.type === "pcb_trace").length ?? 0;
  return /* @__PURE__ */ jsxs13(
    "div",
    {
      className: "rf-flex rf-h-full rf-min-h-[620px] rf-flex-col rf-bg-white md:rf-flex-row",
      "data-testid": "autorouting-explorer",
      children: [
        /* @__PURE__ */ jsxs13(
          "aside",
          {
            className: "rf-flex rf-shrink-0 rf-flex-col rf-border-b rf-border-gray-200 md:rf-w-52 md:rf-border-b-0 md:rf-border-r",
            "aria-label": "Routing phases",
            children: [
              /* @__PURE__ */ jsxs13("div", { className: "rf-flex rf-items-center rf-justify-between rf-px-3 rf-py-2 rf-text-xs rf-text-gray-500", children: [
                /* @__PURE__ */ jsx19("span", { children: "Routing phases" }),
                /* @__PURE__ */ jsx19("span", { children: phases.length })
              ] }),
              /* @__PURE__ */ jsx19("div", { className: "rf-flex rf-gap-1 rf-overflow-x-auto rf-px-1.5 rf-pb-1.5 md:rf-flex-col md:rf-overflow-x-hidden md:rf-overflow-y-auto", children: phases.map((phase, index) => {
                const routedTraceCount = getAutoroutingPhaseChangedTraceIds(phase).length;
                const status = phase.endSimpleRouteJson ? `${routedTraceCount} ${routedTraceCount === 1 ? "trace" : "traces"} routed` : phase.status === "error" ? "Failed" : phase.status === "running" && isRunning ? "Routing\u2026" : "No output";
                return /* @__PURE__ */ jsxs13(
                  "button",
                  {
                    type: "button",
                    "aria-pressed": index === selectedIndex,
                    title: `${getPhaseScope(phase)} \xB7 ${status}`,
                    onClick: () => setPinnedPhase(phase),
                    className: cn(
                      "rf-flex rf-min-w-[192px] rf-items-start rf-gap-2 rf-rounded-md rf-border rf-px-2 rf-py-2 rf-text-left md:rf-min-w-0",
                      index === selectedIndex ? "rf-border-blue-200 rf-bg-blue-50" : "rf-border-transparent hover:rf-bg-gray-50"
                    ),
                    children: [
                      /* @__PURE__ */ jsx19(
                        "span",
                        {
                          className: cn(
                            "rf-flex rf-h-5 rf-w-5 rf-shrink-0 rf-items-center rf-justify-center rf-rounded-full rf-text-[11px]",
                            index === selectedIndex ? "rf-bg-blue-600 rf-text-white" : "rf-bg-gray-100 rf-text-gray-500"
                          ),
                          children: index + 1
                        }
                      ),
                      /* @__PURE__ */ jsxs13("span", { className: "rf-min-w-0 rf-flex-1", children: [
                        /* @__PURE__ */ jsxs13("span", { className: "rf-flex rf-items-center rf-gap-1", children: [
                          /* @__PURE__ */ jsx19(
                            "span",
                            {
                              className: "rf-min-w-0 rf-flex-1 rf-truncate rf-text-xs rf-font-medium rf-leading-5 rf-text-gray-800",
                              title: getPhaseTitle(phase, index),
                              children: getPhaseTitle(phase, index)
                            }
                          ),
                          phase.status === "complete" ? /* @__PURE__ */ jsx19(
                            Check2,
                            {
                              "aria-label": "Captured",
                              className: "rf-h-3 rf-w-3 rf-shrink-0 rf-text-green-600"
                            }
                          ) : phase.status === "error" ? /* @__PURE__ */ jsx19(
                            CircleAlert,
                            {
                              "aria-label": "Failed",
                              className: "rf-h-3 rf-w-3 rf-shrink-0 rf-text-red-500"
                            }
                          ) : isRunning ? /* @__PURE__ */ jsx19(
                            Loader2,
                            {
                              "aria-label": "Routing",
                              className: "rf-h-3 rf-w-3 rf-shrink-0 rf-animate-spin rf-text-blue-500"
                            }
                          ) : null
                        ] }),
                        /* @__PURE__ */ jsxs13("span", { className: "rf-block rf-text-[11px] rf-leading-4 rf-text-gray-500", children: [
                          getAutoroutingPhaseAutorouterName(phase),
                          " \xB7 ",
                          status
                        ] })
                      ] })
                    ]
                  },
                  phase.id
                );
              }) })
            ]
          }
        ),
        /* @__PURE__ */ jsxs13("div", { className: "rf-flex rf-min-w-0 rf-flex-1 rf-flex-col", children: [
          /* @__PURE__ */ jsxs13("div", { className: "rf-flex rf-flex-wrap rf-items-center rf-gap-3 rf-border-b rf-border-gray-200 rf-px-4 rf-py-3", children: [
            /* @__PURE__ */ jsxs13("h3", { className: "rf-mr-auto rf-flex rf-items-center rf-gap-2 rf-text-sm rf-font-medium", children: [
              title,
              /* @__PURE__ */ jsxs13("span", { className: "rf-text-xs rf-font-normal rf-text-gray-500", children: [
                selectedIndex + 1,
                " of ",
                phases.length
              ] })
            ] }),
            isRunning && /* @__PURE__ */ jsx19(
              "button",
              {
                type: "button",
                onClick: () => setPinnedPhase(null),
                disabled: followLatest,
                className: "rf-text-xs rf-text-blue-600 disabled:rf-text-gray-500",
                children: followLatest ? "Following latest" : "Follow latest"
              }
            ),
            /* @__PURE__ */ jsx19(
              "div",
              {
                className: "rf-flex rf-rounded-md rf-bg-gray-100 rf-p-1",
                "aria-label": "Phase snapshot",
                children: ["input", "output"].map((value) => /* @__PURE__ */ jsx19(
                  "button",
                  {
                    type: "button",
                    "aria-pressed": actualMode === value,
                    disabled: value === "input" ? !hasInput : !hasOutput,
                    onClick: () => setMode(value),
                    className: cn(
                      "rf-rounded rf-px-3 rf-py-1 rf-text-xs disabled:rf-opacity-40",
                      actualMode === value ? "rf-bg-white rf-text-gray-900 rf-shadow-sm" : "rf-text-gray-500"
                    ),
                    children: value === "input" ? "Input" : "Output"
                  },
                  value
                ))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs13("div", { className: "rf-flex rf-flex-wrap rf-items-center rf-justify-between rf-gap-2 rf-px-4 rf-py-2 rf-text-xs rf-text-gray-600", children: [
            /* @__PURE__ */ jsxs13("label", { className: "rf-flex rf-items-center rf-gap-2", children: [
              /* @__PURE__ */ jsx19(
                "input",
                {
                  type: "checkbox",
                  checked: highlightChanges,
                  disabled: actualMode !== "output",
                  onChange: (event) => setHighlightChanges(event.target.checked),
                  className: "rf-accent-blue-600"
                }
              ),
              /* @__PURE__ */ jsx19(
                "span",
                {
                  "aria-hidden": "true",
                  className: "rf-inline-block rf-h-0.5 rf-w-3",
                  style: { backgroundColor: AUTOROUTING_PHASE_HIGHLIGHT_COLOR }
                }
              ),
              "Highlight changes (all layers)"
            ] }),
            /* @__PURE__ */ jsxs13("span", { children: [
              actualMode === "input" ? "Before this phase" : "After this phase",
              " ",
              "\xB7 ",
              traceCount,
              " traces"
            ] })
          ] }),
          outputMissing && /* @__PURE__ */ jsx19(
            "div",
            {
              className: cn(
                "rf-border-y rf-px-4 rf-py-2 rf-text-xs",
                selectedPhase.status === "error" ? "rf-border-red-100 rf-bg-red-50 rf-text-red-700" : "rf-border-blue-100 rf-bg-blue-50 rf-text-blue-700"
              ),
              role: "status",
              children: selectedPhase.status === "error" ? `Routing failed: ${selectedPhase.error?.message || "No output was captured."}` : active ? "Routing in progress. Showing captured input until output is available." : "No output was captured for this phase. Showing the available input."
            }
          ),
          /* @__PURE__ */ jsx19(
            "div",
            {
              ref: viewerContainer,
              className: "rf-relative rf-min-h-[360px] rf-flex-1",
              "data-testid": "autorouting-pcb",
              children: phaseCircuitJson ? /* @__PURE__ */ jsx19(
                PCBViewer2,
                {
                  circuitJson: phaseCircuitJson,
                  height: viewerHeight,
                  allowEditing: false,
                  clickToInteractEnabled: false,
                  initialState: viewerInitialState,
                  debugGraphics: highlightGraphics
                }
              ) : /* @__PURE__ */ jsx19("div", { className: "rf-p-6 rf-text-sm rf-text-gray-500", children: "No PCB snapshot available for this capture." })
            }
          ),
          /* @__PURE__ */ jsxs13("div", { className: "rf-flex rf-flex-wrap rf-items-center rf-justify-between rf-gap-2 rf-border-t rf-border-gray-200 rf-px-4 rf-py-3 rf-text-xs rf-text-gray-500", children: [
            /* @__PURE__ */ jsxs13("span", { children: [
              inputConnections === void 0 ? "Input unavailable" : `${inputConnections} input connections`,
              ` \xB7 ${getPhaseScope(selectedPhase)}`
            ] }),
            /* @__PURE__ */ jsxs13("div", { className: "rf-flex rf-items-center rf-gap-4", children: [
              /* @__PURE__ */ jsxs13(
                "button",
                {
                  type: "button",
                  disabled: !snapshot,
                  onClick: () => openForDownload(JSON.stringify(snapshot, null, 2), {
                    fileName: `${selectedPhase.id}-${actualMode}.srj.json`,
                    mimeType: "application/json"
                  }),
                  className: "rf-flex rf-items-center rf-gap-1 disabled:rf-opacity-40",
                  children: [
                    /* @__PURE__ */ jsx19(Download, { className: "rf-h-3 rf-w-3" }),
                    "Download SRJ"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs13(
                "button",
                {
                  type: "button",
                  "aria-expanded": showJson,
                  onClick: () => setShowJson(!showJson),
                  className: "rf-flex rf-items-center rf-gap-1",
                  children: [
                    /* @__PURE__ */ jsx19(
                      ChevronRight3,
                      {
                        className: cn("rf-h-3 rf-w-3", showJson && "rf-rotate-90")
                      }
                    ),
                    "Inspect SRJ"
                  ]
                }
              )
            ] })
          ] }),
          showJson && /* @__PURE__ */ jsx19(
            "pre",
            {
              className: "rf-m-0 rf-max-h-64 rf-overflow-auto rf-border-t rf-border-gray-200 rf-bg-gray-50 rf-p-4 rf-text-xs",
              "aria-label": `${title} ${actualMode} SRJ`,
              children: snapshot ? JSON.stringify(snapshot, null, 2) : "No snapshot captured."
            }
          )
        ] })
      ]
    }
  );
};

// lib/hooks/use-error-telemetry.ts
import { useEffect as useEffect7 } from "react";
var useErrorTelemetry = ({
  errorMessage,
  errorStack,
  circuitJsonErrors
}) => {
  useEffect7(() => {
    if (getWindowVar("TSCIRCUIT_TELEMETRY_DISABLED") === true) return;
    if (errorMessage) {
      const err = new Error(errorMessage);
      if (errorStack) err.stack = errorStack;
      try {
        posthog.captureException(err);
      } catch {
      }
    }
  }, [errorMessage, errorStack]);
  useEffect7(() => {
    if (getWindowVar("TSCIRCUIT_TELEMETRY_DISABLED") === true) return;
    if (circuitJsonErrors && circuitJsonErrors.length > 0) {
      for (const error of circuitJsonErrors) {
        const err = new Error(error.message || "Circuit JSON Error");
        if (error.stack) {
          ;
          err.stack = error.stack;
        }
        try {
          posthog.captureException(err, { error_type: error.type });
        } catch {
        }
      }
    }
  }, [circuitJsonErrors]);
};

// lib/hooks/use-posthog-activity.ts
import { useEffect as useEffect8 } from "react";
var usePostHogActivity = (properties) => {
  useEffect8(() => {
    try {
      captureRunFrameActivity(properties);
    } catch {
    }
  }, [
    properties.source,
    properties.component,
    properties.isWebEmbedded,
    properties.activeTab
  ]);
};

// package.json
var version = "0.0.3019";
var package_default = {
  name: "@tscircuit/runframe",
  main: "dist/preview.js",
  type: "module",
  version,
  repository: {
    type: "git",
    url: "https://github.com/tscircuit/runframe"
  },
  exports: {
    ".": "./dist/preview.js",
    "./preview": "./dist/preview.js",
    "./runner": "./dist/runner.js",
    "./standalone": "./dist/standalone.min.js",
    "./standalone-preview": "./dist/standalone-preview.min.js"
  },
  files: [
    "dist"
  ],
  scripts: {
    start: "bun run build:css && concurrently 'bun run cosmos' 'bun run build:css:watch'",
    build: "bun run build:css && bun run build:standalone && bun run build:standalone-preview && bun run build:lib",
    "build:lib": "tsup-node lib/preview.ts lib/runner.ts --external react-query schematic-symbols lucide-react circuit-to-svg @tscircuit/props --platform browser --format esm --dts",
    "build:css": "bun run scripts/build-css.ts",
    "build:css:watch": "chokidar 'lib/components/**/*.tsx' -c 'bun run build:css'",
    "build:site": "cosmos-export && bun run build:iframe",
    "build:standalone": "NODE_OPTIONS=--max-old-space-size=8192 STANDALONE=1 vite build",
    "build:iframe": "STANDALONE=iframe vite build && mv ./dist/lib/entrypoints/iframe.html ./dist/iframe.html && cp -f ./dist/iframe.html ./cosmos-export/iframe.html && cp -f ./dist/iframe.min.js ./cosmos-export/iframe.min.js",
    "build:standalone-preview": "NODE_OPTIONS=--max-old-space-size=8192 STANDALONE=preview vite build --emptyOutDir false",
    analyze: "source-map-explorer 'dist/standalone.min.js'",
    "format:check": "biome format .",
    format: "biome format --write .",
    "vercel-build": "bun run build:css && cosmos-export",
    "serve:cosmos": "serve cosmos-export",
    "pkg-pr-new-release": "bunx pkg-pr-new publish --comment=off --peerDeps"
  },
  devDependencies: {
    "@babel/standalone": "^7.26.10",
    "@biomejs/biome": "^1.9.4",
    "@radix-ui/react-alert-dialog": "^1.1.6",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-icons": "^1.3.2",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.2",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@react-hook/resize-observer": "^2.0.2",
    "@resvg/resvg-wasm": "^2.6.2",
    "@tscircuit/3d-viewer": "github:tscircuit/3d-viewer#72f3256e76eaa09f296b40e9cec203636ec6dc37",
    "@tscircuit/assembly-viewer": "^0.0.6",
    "@tscircuit/capacity-autorouter": "^0.0.874",
    "@tscircuit/circuit-json-util": "^0.0.116",
    "@tscircuit/create-snippet-url": "^0.0.9",
    "@tscircuit/fake-snippets": "^0.0.163",
    "@tscircuit/file-server": "^0.0.32",
    "@tscircuit/internal-dynamic-import": "^0.0.18",
    "@tscircuit/pcb-viewer": "^1.11.428",
    "@tscircuit/props": "^0.0.702",
    "@tscircuit/schematic-viewer": "^2.0.104",
    "@types/bun": "latest",
    "@types/debug": "^4.1.12",
    "@types/react": "^19.1.10",
    "@types/react-dom": "^19.1.7",
    "@types/three": "^0.179.0",
    "@vitejs/plugin-react": "^5.0.0",
    autoprefixer: "^10.4.20",
    "chokidar-cli": "^3.0.0",
    "circuit-json": "^0.0.525",
    "circuit-json-to-altium": "github:tscircuit/circuit-json-to-altium#1a50d0dd2c0737cf940d92c0315852dc0111dd87",
    "circuit-json-to-bom-csv": "^0.0.21",
    "circuit-json-to-gerber": "^0.0.112",
    "circuit-json-to-kicad": "^0.0.239",
    "circuit-json-to-lbrn": "^0.0.74",
    "circuit-json-to-pnp-csv": "^0.0.18",
    "circuit-json-to-step": "^0.0.47",
    "circuit-to-svg": "^0.0.444",
    "class-variance-authority": "^0.7.1",
    clsx: "^2.1.1",
    cmdk: "^1.1.1",
    comlink: "^4.4.2",
    concurrently: "^9.1.2",
    cssnano: "^7.0.6",
    easyeda: "^0.0.372",
    fflate: "^0.8.2",
    "fuse.js": "^7.1.0",
    jose: "^6.1.0",
    jszip: "^3.10.1",
    jsdom: "^26.0.0",
    "kicad-component-converter": "^0.1.21",
    kicadts: "^0.0.47",
    ky: "^1.7.5",
    "lucide-react": "^0.488.0",
    marked: "^15.0.12",
    minimatch: "^10.0.3",
    playwright: "^1.49.1",
    postcss: "^8.4.49",
    "posthog-js": "^1.253.4",
    react: "19.1.0",
    "react-cosmos": "^6.2.1",
    "react-cosmos-plugin-vite": "^6.2.0",
    "react-dom": "19.1.0",
    "react-error-boundary": "^6.0.0",
    "react-hot-toast": "^2.5.2",
    "react-query": "^3.39.3",
    redaxios: "^0.5.1",
    "rollup-plugin-visualizer": "^5.12.0",
    "s-expression": "^3.1.1",
    "schematic-symbols": "^0.0.237",
    serve: "^14.2.4",
    "source-map-explorer": "^2.5.3",
    stepts: "^0.0.3",
    "tailwind-merge": "^2.6.0",
    tailwindcss: "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    tscircuit: "0.0.2553",
    tsup: "^8.3.5",
    vite: "^7.1.2",
    yargs: "^17.7.2",
    zod: "^3.25.76",
    "bun-match-svg": "^0.0.17"
  },
  dependencies: {
    "@tscircuit/core": "^0.0.1911",
    "@tscircuit/eval": "0.0.1634",
    "@tscircuit/solver-utils": "^0.0.16",
    debug: "^4.4.0",
    "format-si-unit": "^0.0.12"
  },
  overrides: {
    "circuit-json": "$circuit-json",
    altiumts: "0.0.59"
  }
};

// lib/hooks/use-eval-versions.ts
import { useEffect as useEffect9, useMemo as useMemo4, useState as useState9 } from "react";

// lib/components/RunFrame/runner-store/use-runner-store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
var useRunnerStore = create()(
  devtools(
    (set) => ({
      lastRunEvalVersion: void 0,
      setLastRunEvalVersion: (version2) => {
        set({ lastRunEvalVersion: version2 });
      }
    }),
    { name: "runframe-runner-store" }
  )
);

// lib/hooks/use-eval-versions.ts
var useEvalVersions = (allowSelecting) => {
  const [allVersions, setAllVersions] = useState9([]);
  const [latest, setLatest] = useState9(null);
  const [search, setSearch] = useState9("");
  const [selected, setSelected] = useLocalStorageState(
    "eval-version-selection",
    null
  );
  const setLastRunEvalVersion = useRunnerStore((s) => s.setLastRunEvalVersion);
  const lastRunEvalVersion = useRunnerStore((s) => s.lastRunEvalVersion);
  useEffect9(() => {
    if (!allowSelecting) return;
    fetch("https://data.jsdelivr.com/v1/package/npm/@tscircuit/eval").then((res) => res.json()).then((data) => {
      if (Array.isArray(data?.versions)) {
        let versions = [...data.versions];
        if (data.tags?.latest) {
          setLatest(data.tags.latest);
          versions = versions.filter((v) => v !== data.tags.latest);
        }
        setAllVersions(versions);
      }
    }).catch(() => {
    });
  }, [allowSelecting]);
  useEffect9(() => {
    if (!allowSelecting) return;
    if (selected) {
      window.TSCIRCUIT_LATEST_EVAL_VERSION = selected;
      setLastRunEvalVersion(selected);
    } else if (latest) {
      window.TSCIRCUIT_LATEST_EVAL_VERSION = latest;
      setLastRunEvalVersion(latest);
    }
  }, [allowSelecting, selected, latest]);
  const filtered = useMemo4(
    () => allVersions.filter((v) => v.includes(search)).slice(0, 50),
    [allVersions, search]
  );
  const selectVersion = (v) => {
    setSelected(v);
    setSearch("");
  };
  return {
    versions: filtered,
    latestVersion: latest,
    lastRunEvalVersion,
    search,
    setSearch,
    selectVersion
  };
};

// lib/components/FileMenuLeftHeader.tsx
import { useEffect as useEffect18, useMemo as useMemo10, useState as useState25 } from "react";

// lib/components/RunFrameWithApi/store.ts
import { applyEditEventsToManualEditsFile } from "@tscircuit/core";

// lib/utils/debug.ts
import Debug from "debug";
var debug = Debug("run-frame");
var debug_default = debug;

// lib/components/RunFrameWithApi/store.ts
import { create as create2 } from "zustand";
import { devtools as devtools2 } from "zustand/middleware";

// lib/components/RunFrameWithApi/api-base.ts
var API_BASE = window.TSCIRCUIT_FILESERVER_API_BASE_URL ?? "/api";

// lib/components/RunFrameWithApi/isDynamicFilePath.ts
var DYNAMIC_FILE_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".json",
  ".kicad_pcb",
  ".kicad_sym",
  ".kicad_sch",
  ".kicad_prl",
  ".kicad_pro"
];
var isDynamicFilePath = (filePath) => DYNAMIC_FILE_EXTENSIONS.some((ext) => filePath.endsWith(ext));

// lib/components/RunFrameWithApi/store.ts
var debug2 = debug_default.extend("store");
async function upsertFileApi(path, content) {
  const response = await fetch(`${API_BASE}/files/upsert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file_path: path, text_content: content })
  });
  const data = await response.json();
  return data.file;
}
async function getFileApi(path) {
  const response = await fetch(
    `${API_BASE}/files/get?file_path=${encodeURIComponent(path)}`
  );
  const data = await response.json();
  return data.file;
}
async function getEvents(since) {
  const url = since ? `${API_BASE}/events/list?since=${encodeURIComponent(since)}` : `${API_BASE}/events/list`;
  const response = await fetch(url);
  const data = await response.json();
  return data.event_list;
}
async function getInitialFilesFromApi() {
  const response = await fetch(`${API_BASE}/files/list`);
  const { file_list } = await response.json();
  const fileMap = /* @__PURE__ */ new Map();
  for (const file of file_list) {
    if (isDynamicFilePath(file.file_path)) {
      const fullFile = await getFileApi(file.file_path);
      fileMap.set(file.file_path, fullFile.text_content);
      continue;
    }
    fileMap.set(file.file_path, "__STATIC_ASSET__");
  }
  return fileMap;
}
var IGNORED_SAVED_FILES = ["manual-edits.json", "manual_edits.json"];
var useRunFrameStore = create2()(
  devtools2(
    (set, get) => ({
      fsMap: /* @__PURE__ */ new Map(),
      lastEventTime: (/* @__PURE__ */ new Date()).toISOString(),
      isPolling: false,
      error: null,
      circuitJson: null,
      lastManualEditsChangeSentAt: 0,
      recentEvents: [],
      simulateScenarioOrder: void 0,
      currentMainComponentPath: null,
      recentlySavedFiles: [],
      loadInitialFiles: async () => {
        const fsMap = await getInitialFilesFromApi();
        debug2("loaded initial files", { fsMap });
        set({ fsMap });
      },
      upsertFile: async (path, content) => {
        try {
          const file = await upsertFileApi(path, content);
          set((state) => ({
            fsMap: new Map(state.fsMap).set(file.file_path, file.text_content)
          }));
        } catch (error) {
          set({ error });
        }
      },
      getFile: async (path) => {
        try {
          const file = await getFileApi(path);
          set((state) => ({
            fsMap: new Map(state.fsMap).set(file.file_path, file.text_content)
          }));
        } catch (error) {
          set({ error });
        }
      },
      setCircuitJson: (circuitJson) => {
        if (circuitJson === get().circuitJson) return;
        set({ circuitJson });
      },
      addRecentlySavedFile: (path) => {
        set((state) => {
          if (IGNORED_SAVED_FILES.includes(path)) return state;
          if (!isDynamicFilePath(path)) return state;
          const filtered = state.recentlySavedFiles.filter((f) => f !== path);
          return {
            recentlySavedFiles: [path, ...filtered].slice(0, 10)
          };
        });
      },
      startPolling: () => {
        const poll = async () => {
          const state = get();
          if (!state.isPolling) return;
          try {
            const events = await getEvents(state.lastEventTime);
            if (events.length > 0) {
              const newLastEventTime = events[events.length - 1].created_at;
              debug2(
                "received events",
                events.map((e) => e.event_type)
              );
              set((state2) => ({
                recentEvents: [...state2.recentEvents, ...events].slice(0, 100),
                lastEventTime: newLastEventTime
                // TODO sort
                // .sort((a, b) => b.created_at.localeCompare(a.created_at)),
              }));
              let fsUpdateCount = 0;
              const updates = new Map(state.fsMap);
              for (const event of events) {
                if (event.event_type === "FILE_UPDATED") {
                  fsUpdateCount++;
                  const file = await getFileApi(event.file_path);
                  if (event.file_path === "manual_edits.json" && Date.now() - state.lastManualEditsChangeSentAt < 1e3) {
                    continue;
                  }
                  if (isDynamicFilePath(file.file_path)) {
                    updates.set(file.file_path, file.text_content ?? "");
                  } else {
                    updates.set(file.file_path, "__STATIC_ASSET__");
                  }
                  get().addRecentlySavedFile(event.file_path);
                } else if (event.event_type === "FILE_DELETED") {
                  fsUpdateCount++;
                  updates.delete(event.file_path);
                }
              }
              if (fsUpdateCount > 0) {
                debug2("updating fsMap, fsUpdateCount:", fsUpdateCount);
                set({
                  fsMap: updates
                });
              }
            }
          } catch (error) {
            set({ error });
          }
          setTimeout(poll, 1e3);
        };
        set({ isPolling: true });
        poll();
      },
      stopPolling: () => {
        set({ isPolling: false });
      },
      pushEvent: async (event) => {
        await fetch(`${API_BASE}/events/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(event)
        });
      },
      applyEditEventsAndUpdateManualEditsJson: async (editEvents) => {
        debug2("applyEditEventsAndUpdateManualEditsJson", { editEvents });
        const state = get();
        if (!state.circuitJson) return;
        const manualEditsJson = state.fsMap.get("manual-edits.json");
        const manualEdits = manualEditsJson ? JSON.parse(manualEditsJson) : {};
        const updatedManualEditsFileContent = applyEditEventsToManualEditsFile({
          circuitJson: state.circuitJson,
          editEvents,
          manualEditsFile: manualEdits
        });
        debug2("updatedManualEditsFileContent", updatedManualEditsFileContent);
        set((state2) => ({
          lastManualEditsChangeSentAt: Date.now(),
          fsMap: new Map(state2.fsMap).set(
            "manual-edits.json",
            JSON.stringify(updatedManualEditsFileContent)
          )
        }));
        await upsertFileApi(
          "manual-edits.json",
          JSON.stringify(updatedManualEditsFileContent, null, 2)
        );
      },
      setSimulateScenarioOrder: (scenarioOrder) => set({ simulateScenarioOrder: scenarioOrder }),
      setCurrentMainComponentPath: (path) => set({ currentMainComponentPath: path })
    }),
    { name: "run-frame-store" }
  )
);

// lib/components/RunFrameForCli/SelectSnippetDialog.tsx
import { useState as useState10 } from "react";
import { jsx as jsx20, jsxs as jsxs14 } from "react/jsx-runtime";
var SelectSnippetDialog = ({
  snippetNames,
  onSelect,
  onCancel,
  isOpen
}) => {
  const [selectedName, setSelectedName] = useState10("");
  const [searchInput, setSearchInput] = useState10("");
  if (!isOpen) return null;
  const filteredSnippets = snippetNames.filter(
    (name) => name.toLowerCase().includes(searchInput.toLowerCase())
  );
  const showCreateNew = searchInput && !snippetNames.includes(searchInput);
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (filteredSnippets.length === 1) {
        setSelectedName(filteredSnippets[0]);
      } else if (showCreateNew) {
        setSelectedName(searchInput);
      }
    }
  };
  return /* @__PURE__ */ jsx20("div", { className: "rf-fixed rf-inset-0 rf-bg-black rf-bg-opacity-50 rf-flex rf-items-center rf-justify-center rf-z-[100]", children: /* @__PURE__ */ jsxs14("div", { className: "rf-bg-white rf-rounded-lg rf-p-6 rf-w-96", children: [
    /* @__PURE__ */ jsx20("h2", { className: "rf-text-lg rf-font-semibold rf-mb-4", children: "Select Snippet" }),
    /* @__PURE__ */ jsx20(
      "input",
      {
        type: "text",
        className: "rf-w-full rf-px-4 rf-py-2 rf-border rf-rounded rf-mb-4",
        placeholder: "Search snippets or new snippet name...",
        value: searchInput,
        onChange: (e) => setSearchInput(e.target.value),
        onKeyDown: handleKeyDown
      }
    ),
    /* @__PURE__ */ jsxs14("div", { className: "rf-h-60 rf-overflow-y-auto", children: [
      filteredSnippets.map((name) => /* @__PURE__ */ jsx20(
        "button",
        {
          type: "button",
          className: `w-full text-left px-4 py-2 rounded hover:bg-gray-100 ${selectedName === name ? "bg-blue-50" : ""}`,
          onClick: () => setSelectedName(name),
          children: name
        },
        name
      )),
      showCreateNew && /* @__PURE__ */ jsxs14(
        "button",
        {
          type: "button",
          className: `w-full text-left px-4 py-2 rounded hover:bg-gray-100 text-blue-500 ${selectedName === searchInput ? "bg-blue-50" : ""}`,
          onClick: () => setSelectedName(searchInput),
          children: [
            'Create new "',
            searchInput,
            '"'
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs14("div", { className: "rf-mt-4 rf-flex rf-justify-end rf-gap-2", children: [
      /* @__PURE__ */ jsx20(
        "button",
        {
          type: "button",
          className: "rf-px-4 rf-py-2 rf-text-gray-600 rf-hover:text-gray-800",
          onClick: onCancel,
          children: "Cancel"
        }
      ),
      /* @__PURE__ */ jsx20(
        "button",
        {
          type: "button",
          className: "rf-px-4 rf-py-2 rf-bg-blue-500 rf-text-white rf-rounded rf-hover:bg-blue-600 rf-disabled:opacity-50",
          onClick: () => selectedName && onSelect(selectedName),
          disabled: !selectedName,
          children: selectedName === searchInput ? `Create "${selectedName}"` : `Save to ${selectedName}`
        }
      )
    ] })
  ] }) });
};

// lib/components/RunFrameForCli/useEventHandler.ts
import { useEffect as useEffect10, useRef as useRef3 } from "react";
var useEventHandler = (callback) => {
  const lastProcessedEventId = useRef3(null);
  const recentEvents = useRunFrameStore((state) => state.recentEvents);
  useEffect10(() => {
    if (recentEvents.length === 0) return;
    const latestEvent = recentEvents[0];
    if (latestEvent.event_id !== lastProcessedEventId.current) {
      callback(latestEvent);
      lastProcessedEventId.current = latestEvent.event_id;
    }
  }, [recentEvents, callback]);
};

// lib/components/ui/alert-dialog.tsx
import * as React7 from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { jsx as jsx21, jsxs as jsxs15 } from "react/jsx-runtime";
var AlertDialog = AlertDialogPrimitive.Root;
var AlertDialogPortal = AlertDialogPrimitive.Portal;
var AlertDialogOverlay = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx21(
  AlertDialogPrimitive.Overlay,
  {
    className: cn(
      "rf-fixed rf-inset-0 rf-z-50 rf-bg-black/80 data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName;
var AlertDialogContent = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxs15(AlertDialogPortal, { children: [
  /* @__PURE__ */ jsx21(AlertDialogOverlay, {}),
  /* @__PURE__ */ jsx21(
    AlertDialogPrimitive.Content,
    {
      ref,
      className: cn(
        "rf-fixed rf-left-[50%] rf-top-[50%] rf-z-50 rf-grid rf-w-full rf-max-w-lg rf-translate-x-[-50%] rf-translate-y-[-50%] rf-gap-4 rf-border rf-border-zinc-200 rf-bg-white rf-p-6 rf-shadow-lg rf-duration-200 data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[state=closed]:rf-slide-out-to-left-1/2 data-[state=closed]:rf-slide-out-to-top-[48%] data-[state=open]:rf-slide-in-from-left-1/2 data-[state=open]:rf-slide-in-from-top-[48%] sm:rf-rounded-lg dark:rf-border-zinc-800 dark:rf-bg-zinc-950",
        className
      ),
      ...props
    }
  )
] }));
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName;
var AlertDialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx21(
  "div",
  {
    className: cn(
      "rf-flex rf-flex-col rf-space-y-2 rf-text-center sm:rf-text-left",
      className
    ),
    ...props
  }
);
AlertDialogHeader.displayName = "AlertDialogHeader";
var AlertDialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx21(
  "div",
  {
    className: cn(
      "rf-flex rf-flex-col-reverse sm:rf-flex-row sm:rf-justify-end sm:rf-space-x-2",
      className
    ),
    ...props
  }
);
AlertDialogFooter.displayName = "AlertDialogFooter";
var AlertDialogTitle = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx21(
  AlertDialogPrimitive.Title,
  {
    ref,
    className: cn("rf-text-lg rf-font-semibold", className),
    ...props
  }
));
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName;
var AlertDialogDescription = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx21(
  AlertDialogPrimitive.Description,
  {
    ref,
    className: cn(
      "rf-text-sm rf-text-zinc-500 dark:rf-text-zinc-400",
      className
    ),
    ...props
  }
));
AlertDialogDescription.displayName = AlertDialogPrimitive.Description.displayName;
var AlertDialogAction = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx21(
  AlertDialogPrimitive.Action,
  {
    ref,
    className: cn(buttonVariants(), className),
    ...props
  }
));
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName;
var AlertDialogCancel = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx21(
  AlertDialogPrimitive.Cancel,
  {
    ref,
    className: cn(
      buttonVariants({ variant: "outline" }),
      "rf-mt-2 sm:rf-mt-0",
      className
    ),
    ...props
  }
));
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName;

// lib/components/ui/checkbox.tsx
import * as React8 from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check as Check3 } from "lucide-react";
import { jsx as jsx22 } from "react/jsx-runtime";
var Checkbox = React8.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx22(
  CheckboxPrimitive.Root,
  {
    ref,
    className: cn(
      "rf-peer rf-h-4 rf-w-4 rf-shrink-0 rf-rounded-sm rf-border rf-border-zinc-200 rf-border-zinc-900 rf-shadow focus-visible:rf-outline-none focus-visible:rf-ring-1 focus-visible:rf-ring-zinc-950 disabled:rf-cursor-not-allowed disabled:rf-opacity-50 data-[state=checked]:rf-bg-zinc-900 data-[state=checked]:rf-text-zinc-50 dark:rf-border-zinc-800 dark:rf-border-zinc-50 dark:focus-visible:rf-ring-zinc-300 dark:data-[state=checked]:rf-bg-zinc-50 dark:data-[state=checked]:rf-text-zinc-900",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx22(
      CheckboxPrimitive.Indicator,
      {
        className: cn(
          "rf-flex rf-items-center rf-justify-center rf-text-current"
        ),
        children: /* @__PURE__ */ jsx22(Check3, { className: "rf-h-4 rf-w-4" })
      }
    )
  }
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// lib/components/ImportComponentDialog2/ImportComponentDialog2.tsx
import * as React12 from "react";
import { Loader2 as Loader25 } from "lucide-react";

// lib/components/ui/dialog.tsx
import * as React9 from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { jsx as jsx23, jsxs as jsxs16 } from "react/jsx-runtime";
var Dialog = DialogPrimitive.Root;
var DialogPortal = DialogPrimitive.Portal;
var DialogOverlay = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx23(
  DialogPrimitive.Overlay,
  {
    className: cn(
      "rf-fixed rf-inset-0 rf-z-50 rf-bg-black/80 data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0",
      className
    ),
    ...props,
    ref
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
var DialogContent = React9.forwardRef(({ className, children, showOverlay = true, ...props }, ref) => /* @__PURE__ */ jsxs16(DialogPortal, { children: [
  /* @__PURE__ */ jsx23(DialogOverlay, { className: cn(showOverlay ? "" : "rf-hidden") }),
  /* @__PURE__ */ jsx23(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "rf-fixed rf-left-[50%] rf-top-[50%] rf-z-50 rf-grid rf-w-full rf-max-w-lg rf-translate-x-[-50%] rf-translate-y-[-50%] rf-gap-4 rf-border rf-border-zinc-200 rf-bg-white rf-p-6 rf-shadow-lg rf-duration-200 data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[state=closed]:rf-slide-out-to-left-1/2 data-[state=closed]:rf-slide-out-to-top-[48%] data-[state=open]:rf-slide-in-from-left-1/2 data-[state=open]:rf-slide-in-from-top-[48%] sm:rf-rounded-lg dark:rf-border-zinc-800 dark:rf-bg-zinc-950",
        className
      ),
      ...props,
      children
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
var DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx23(
  "div",
  {
    className: cn(
      "rf-flex rf-flex-col rf-space-y-2 rf-text-center sm:rf-text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx23(
  "div",
  {
    className: cn(
      "rf-flex rf-flex-col-reverse sm:rf-flex-row sm:rf-justify-end sm:rf-space-x-2",
      className
    ),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
var DialogTitle = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx23(
  DialogPrimitive.Title,
  {
    ref,
    className: cn("rf-text-lg rf-font-semibold", className),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
var DialogDescription = React9.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx23(
  DialogPrimitive.Description,
  {
    ref,
    className: cn(
      "rf-text-sm rf-text-zinc-500 dark:rf-text-zinc-400",
      className
    ),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// lib/components/ImportComponentDialog2/config.ts
var SOURCE_CONFIG = {
  "tscircuit.com": {
    label: "tscircuit.com",
    placeholder: "Search tscircuit packages...",
    emptyMessage: "No packages found"
  },
  jlcpcb: {
    label: "JLCPCB Parts",
    placeholder: "Search JLCPCB parts (e.g. C14663)...",
    emptyMessage: "No parts found"
  },
  kicad: {
    label: "KiCad Footprints",
    placeholder: "Search KiCad footprints...",
    emptyMessage: "No footprints found"
  }
};

// lib/optional-features/importing/load-easyeda-browser.ts
var EASYEDA_BROWSER_URL = "https://cdn.jsdelivr.net/npm/easyeda@latest/dist/browser/index.js";
var easyedaBrowserPromise = null;
var loadEasyedaBrowser = async () => {
  if (!easyedaBrowserPromise) {
    easyedaBrowserPromise = import(
      /* @vite-ignore */
      EASYEDA_BROWSER_URL
    );
  }
  return easyedaBrowserPromise;
};

// lib/optional-features/importing/create-easyeda-proxy-fetch.ts
var createEasyEdaProxyFetch = (opts) => (url, options) => {
  const sourceHeaders = new Headers(options?.headers);
  const headers = {};
  sourceHeaders.forEach((value, key) => {
    headers[key] = value;
  });
  return fetch(`${opts?.apiBase ?? API_BASE}/proxy`, {
    ...options,
    headers: {
      ...headers,
      "X-Target-Url": url.toString(),
      "X-Sender-Origin": headers.origin ?? "",
      "X-Sender-Host": headers.host ?? "https://easyeda.com",
      "X-Sender-Referer": headers.referer ?? "",
      "X-Sender-User-Agent": headers["user-agent"] ?? "",
      "X-Sender-Cookie": headers.cookie ?? "",
      authority: headers.authority ?? "",
      "content-type": headers["content-type"] ?? "",
      ...opts?.headers
    }
  });
};

// lib/components/ImportComponentDialog2/api/jlcpcb.ts
var searchJlcpcbComponents = async (query, limit = 10) => {
  const encodedQuery = encodeURIComponent(query);
  const response = await fetch(
    `https://jlcsearch.tscircuit.com/api/search?limit=${limit}&q=${encodedQuery}`
  );
  if (!response.ok) {
    throw new Error(`JLCPCB API error: ${response.status}`);
  }
  const data = await response.json();
  return data.components ?? [];
};
var mapJlcpcbComponentToSummary = (component) => ({
  lcscId: component.lcsc,
  manufacturer: component.mfr,
  description: component.description,
  partNumber: `C${component.lcsc}`,
  package: component.package,
  price: component.price,
  stock: component.stock,
  isBasic: component.is_basic
});
var fetchEasyEdaComponentForJlcpcbPart = async (partNumber, opts) => {
  const { fetchEasyEDAComponent } = await loadEasyedaBrowser();
  return fetchEasyEDAComponent(partNumber, {
    fetch: createEasyEdaProxyFetch(opts),
    includeModelMetadata: opts?.includeModelMetadata
  });
};
var loadJlcpcbComponentTsx = async (partNumber, opts) => {
  const { convertRawEasyToTsx } = await loadEasyedaBrowser();
  const component = await fetchEasyEdaComponentForJlcpcbPart(partNumber, opts);
  return convertRawEasyToTsx({ rawEasy: component });
};
var loadJlcpcbComponentCircuitJson = async (partNumber, opts) => {
  const { EasyEdaJsonSchema, convertEasyEdaJsonToCircuitJson } = await loadEasyedaBrowser();
  const component = await fetchEasyEdaComponentForJlcpcbPart(partNumber, {
    ...opts,
    includeModelMetadata: false
  });
  const betterEasy = EasyEdaJsonSchema.parse(component);
  return convertEasyEdaJsonToCircuitJson(betterEasy, {
    shouldRecenter: true,
    showDesignator: true,
    useModelCdn: false
  });
};

// lib/components/ImportComponentDialog2/api/kicad.ts
import Fuse from "fuse.js";
import importer2 from "@tscircuit/internal-dynamic-import";
var KICAD_MOD_CACHE_BASE_URL = "https://kicad-mod-cache.tscircuit.com";
var footprintsCache = null;
var footprintsPromise = null;
var fuse = null;
var ensureFootprints = async () => {
  if (footprintsCache) return footprintsCache;
  if (footprintsPromise) return footprintsPromise;
  footprintsPromise = fetch(
    "https://kicad-mod-cache.tscircuit.com/kicad_files.json"
  ).then((response) => response.json()).then((footprints) => {
    footprintsCache = footprints;
    footprintsPromise = null;
    return footprints;
  });
  return footprintsPromise;
};
var searchKicadFootprints = async (query, limit = 20) => {
  const footprints = await ensureFootprints();
  if (!fuse) {
    fuse = new Fuse(footprints);
  }
  return fuse.search(query).slice(0, limit).map((result) => result.item);
};
var mapKicadFootprintToSummary = (footprintPath) => {
  const cleanedFootprint = footprintPath.replace(".pretty/", "/").replace(".kicad_mod", "");
  const footprintString = `kicad:${cleanedFootprint}`;
  return {
    path: footprintPath,
    qualifiedName: footprintString,
    description: cleanedFootprint
  };
};
var encodeFootprintPath = (footprintPath) => footprintPath.replace(/^\/+/, "").split("/").map((segment) => encodeURIComponent(segment)).join("/");
var loadKicadFootprintCircuitJson = async (footprintPath) => {
  const response = await fetch(
    `${KICAD_MOD_CACHE_BASE_URL}/${encodeFootprintPath(footprintPath)}`
  );
  if (!response.ok) {
    throw new Error(`KiCad footprint fetch failed: ${response.status}`);
  }
  const footprintContent = await response.text();
  const { KicadFootprintToCircuitJsonConverter } = await importer2(
    "kicad-to-circuit-json"
  );
  const converter = new KicadFootprintToCircuitJsonConverter();
  converter.addFile(
    footprintPath.split("/").pop() ?? "selected-footprint.kicad_mod",
    footprintContent
  );
  converter.runUntilFinished();
  return converter.getOutput();
};

// lib/components/ImportComponentDialog2/api/footprint-preview.ts
var canPreviewFootprint = (result) => result?.source === "jlcpcb" || result?.source === "kicad";
var loadFootprintPreviewCircuitJson = async (result, opts) => {
  if (result.source === "jlcpcb") {
    return loadJlcpcbComponentCircuitJson(
      result.component.partNumber,
      opts?.jlcpcb
    );
  }
  if (result.source === "kicad") {
    return loadKicadFootprintCircuitJson(result.footprint.path);
  }
  throw new Error("Footprint preview is not available for this source");
};

// lib/components/ImportComponentDialog2/components/SearchBar.tsx
import * as React10 from "react";
import { Loader2 as Loader22, Search } from "lucide-react";
import { Fragment as Fragment3, jsx as jsx24, jsxs as jsxs17 } from "react/jsx-runtime";
var SearchBar = ({
  query,
  placeholder,
  isSearching,
  onQueryChange,
  onSubmit
}) => {
  const handleKeyDown = React10.useCallback(
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        onSubmit();
      }
    },
    [onSubmit]
  );
  return /* @__PURE__ */ jsxs17("div", { className: "rf-flex rf-items-center rf-gap-2 rf-mt-4", children: [
    /* @__PURE__ */ jsxs17("div", { className: "rf-relative rf-flex-grow", children: [
      /* @__PURE__ */ jsx24(Search, { className: "rf-absolute rf-left-2 rf-top-2.5 rf-h-4 rf-w-4 rf-text-muted-foreground" }),
      /* @__PURE__ */ jsx24(
        Input,
        {
          placeholder,
          className: "rf-pl-8",
          spellCheck: false,
          autoComplete: "off",
          value: query,
          onChange: (event) => onQueryChange(event.target.value),
          onKeyDown: handleKeyDown
        }
      )
    ] }),
    /* @__PURE__ */ jsx24(
      Button,
      {
        onClick: onSubmit,
        disabled: isSearching || query.trim().length < 1,
        className: "sm:rf-px-4 rf-px-3",
        children: isSearching ? /* @__PURE__ */ jsx24(Loader22, { className: "rf-h-4 rf-w-4 rf-animate-spin" }) : /* @__PURE__ */ jsxs17(Fragment3, { children: [
          /* @__PURE__ */ jsx24(Search, { className: "rf-h-4 rf-w-4 sm:rf-hidden" }),
          /* @__PURE__ */ jsx24("span", { className: "rf-hidden sm:rf-inline", children: "Search" })
        ] })
      }
    )
  ] });
};

// lib/components/ImportComponentDialog2/components/SearchResultsList.tsx
import { Lock } from "lucide-react";
import { jsx as jsx25, jsxs as jsxs18 } from "react/jsx-runtime";
var currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});
var formatPrice = (value) => currencyFormatter.format(value);
var getResultKey = (result) => {
  switch (result.source) {
    case "tscircuit.com": {
      const pkg = result.package;
      const identifier = pkg.package_id ?? `${pkg.org_owner_tscircuit_handle ?? "unknown"}-${pkg.unscoped_name ?? pkg.name ?? "package"}`;
      return `tscircuit-${identifier}`;
    }
    case "jlcpcb":
      return `jlc-${result.component.lcscId}`;
    case "kicad":
      return `kicad-${result.footprint.path}`;
    default:
      return "unknown";
  }
};
var getPrimaryText = (result) => {
  switch (result.source) {
    case "tscircuit.com":
      return result.package.unscoped_name;
    case "jlcpcb":
      return result.component.isDirectLookup ? result.component.partNumber : result.component.manufacturer;
    case "kicad":
      return result.footprint.qualifiedName;
  }
};
var getSecondaryText = (result) => {
  switch (result.source) {
    case "tscircuit.com":
      return result.package.description || (result.package.org_owner_tscircuit_handle ? `Component by ${result.package.org_owner_tscircuit_handle}` : void 0);
    case "jlcpcb":
      return result.component.description;
    case "kicad":
      return result.footprint.description;
  }
};
var getPartNumberLabel = (result) => {
  switch (result.source) {
    case "tscircuit.com":
      return result.package.name;
    case "jlcpcb":
      return result.component.isDirectLookup ? void 0 : result.component.partNumber;
    case "kicad":
      return void 0;
  }
};
var SearchResultsList = ({
  results,
  selected,
  onSelect,
  onShowDetails
}) => {
  const selectedKey = selected ? getResultKey(selected) : null;
  return /* @__PURE__ */ jsx25("div", { className: "rf-divide-y rf-w-full rf-overflow-hidden", children: results.map((result) => {
    const key = getResultKey(result);
    const isSelected = selectedKey === key;
    const primary = getPrimaryText(result);
    const secondary = getSecondaryText(result);
    const partNumber = getPartNumberLabel(result);
    const stock = result.source === "jlcpcb" ? result.component.stock : null;
    const price = result.source === "jlcpcb" ? result.component.price : null;
    const isBasic = result.source === "jlcpcb" ? result.component.isBasic : null;
    const isDirectLookup = result.source === "jlcpcb" ? result.component.isDirectLookup : false;
    return /* @__PURE__ */ jsxs18(
      "div",
      {
        className: `rf-p-3 rf-flex rf-flex-col sm:rf-grid sm:rf-grid-cols-[minmax(0,1fr)_auto] rf-items-start sm:rf-items-center rf-cursor-pointer hover:rf-bg-zinc-100 rf-gap-2 rf-overflow-hidden ${isSelected ? "rf-bg-zinc-100" : ""}`,
        onClick: () => onSelect(result),
        children: [
          /* @__PURE__ */ jsxs18("div", { className: "rf-min-w-0 rf-overflow-hidden rf-w-full", children: [
            /* @__PURE__ */ jsxs18("div", { className: "rf-flex rf-items-start rf-gap-2 rf-min-w-0", children: [
              /* @__PURE__ */ jsxs18("div", { className: "rf-font-medium rf-text-sm rf-truncate rf-flex-1 rf-min-w-0 rf-flex rf-items-center rf-gap-1.5", children: [
                primary,
                result.source === "jlcpcb" && isBasic != null && /* @__PURE__ */ jsx25(
                  "span",
                  {
                    className: `rf-text-xs rf-px-1.5 rf-py-0.5 rf-rounded rf-font-medium rf-flex-shrink-0 ${isBasic ? "rf-bg-green-100 rf-text-green-700" : "rf-bg-orange-100 rf-text-orange-700"}`,
                    children: isBasic ? "Basic" : "Extended"
                  }
                ),
                isDirectLookup && /* @__PURE__ */ jsx25("span", { className: "rf-text-xs rf-px-1.5 rf-py-0.5 rf-rounded rf-font-medium rf-flex-shrink-0 rf-bg-blue-100 rf-text-blue-700", children: "Direct lookup" }),
                result.source === "tscircuit.com" && result.package.is_private && /* @__PURE__ */ jsx25(Lock, { className: "rf-ml-1 rf-h-3 rf-w-3 rf-text-zinc-400 rf-flex-shrink-0" })
              ] }),
              result.source === "jlcpcb" && stock != null ? /* @__PURE__ */ jsxs18("div", { className: "rf-text-xs rf-text-zinc-500 rf-font-medium rf-whitespace-nowrap rf-flex-shrink-0 sm:rf-hidden", children: [
                stock.toLocaleString(),
                " in stock"
              ] }) : null
            ] }),
            /* @__PURE__ */ jsxs18("div", { className: "rf-text-xs rf-text-zinc-500 rf-truncate rf-w-full", children: [
              partNumber ? /* @__PURE__ */ jsx25("span", { className: "rf-mr-2", children: partNumber }) : null,
              secondary
            ] })
          ] }),
          /* @__PURE__ */ jsxs18("div", { children: [
            result.source === "tscircuit.com" && onShowDetails ? /* @__PURE__ */ jsx25("div", { className: "rf-flex-shrink-0 rf-w-full sm:rf-w-auto", children: /* @__PURE__ */ jsx25(
              Button,
              {
                variant: "outline",
                size: "sm",
                className: "rf-text-xs rf-w-full sm:rf-w-auto",
                onClick: (event) => {
                  event.stopPropagation();
                  onShowDetails(result);
                },
                children: "See Details"
              }
            ) }) : result.source === "jlcpcb" && stock != null ? /* @__PURE__ */ jsxs18("div", { className: "rf-hidden sm:rf-block rf-text-xs rf-text-zinc-500 rf-font-medium rf-whitespace-nowrap rf-flex-shrink-0", children: [
              stock.toLocaleString(),
              " in stock"
            ] }) : null,
            price != null && /* @__PURE__ */ jsx25("div", { className: "rf-hidden sm:rf-block rf-text-xs rf-text-zinc-500 rf-font-medium rf-whitespace-nowrap rf-flex-shrink-0 rf-text-right", children: formatPrice(price) })
          ] })
        ]
      },
      key
    );
  }) });
};

// lib/components/ImportComponentDialog2/components/FootprintPreviewPanel.tsx
import { PCBViewer as PCBViewer3 } from "@tscircuit/pcb-viewer";
import { AlertCircle as AlertCircle2, Loader2 as Loader23 } from "lucide-react";
import { jsx as jsx26, jsxs as jsxs19 } from "react/jsx-runtime";
var FootprintPreviewPanel = ({
  circuitJson,
  error,
  isLoading,
  height
}) => {
  return /* @__PURE__ */ jsx26(
    "section",
    {
      className: "rf-flex rf-min-w-0 rf-items-center rf-justify-center",
      style: { height },
      children: isLoading ? /* @__PURE__ */ jsxs19(
        "div",
        {
          className: "rf-flex rf-w-full rf-items-center rf-justify-center rf-gap-2 rf-bg-zinc-950 rf-text-sm rf-text-zinc-300",
          style: { height },
          children: [
            /* @__PURE__ */ jsx26(Loader23, { className: "rf-h-4 rf-w-4 rf-animate-spin" }),
            "Loading preview..."
          ]
        }
      ) : error ? /* @__PURE__ */ jsx26(
        "div",
        {
          className: "rf-flex rf-w-full rf-items-center rf-justify-center rf-bg-zinc-950 rf-p-4",
          style: { height },
          children: /* @__PURE__ */ jsxs19("div", { className: "rf-flex rf-max-w-[320px] rf-items-start rf-gap-2 rf-text-sm rf-text-zinc-300", children: [
            /* @__PURE__ */ jsx26(AlertCircle2, { className: "rf-mt-0.5 rf-h-4 rf-w-4 rf-flex-shrink-0" }),
            /* @__PURE__ */ jsx26("span", { children: error })
          ] })
        }
      ) : circuitJson ? /* @__PURE__ */ jsx26("div", { className: "rf-w-full rf-min-w-0 rf-overflow-hidden", children: /* @__PURE__ */ jsx26(
        PCBViewer3,
        {
          circuitJson,
          height,
          allowEditing: false,
          clickToInteractEnabled: false,
          focusOnHover: false,
          disablePcbGroups: true
        }
      ) }) : /* @__PURE__ */ jsx26(
        "div",
        {
          className: "rf-flex rf-w-full rf-items-center rf-justify-center rf-bg-zinc-950 rf-text-sm rf-text-zinc-300",
          style: { height },
          children: "No preview"
        }
      )
    }
  );
};

// lib/components/ImportComponentDialog2/components/TscircuitPackageDetailsDialog.tsx
import { ExternalLink, Loader2 as Loader24 } from "lucide-react";

// lib/utils/z-index-map.ts
var zIndexMap = {
  importComponentDialog: 101,
  importComponentDetailsDialog: 102
};

// lib/components/ImportComponentDialog2/components/TscircuitPackageDetailsDialog.tsx
import { Fragment as Fragment4, jsx as jsx27, jsxs as jsxs20 } from "react/jsx-runtime";
var TscircuitPackageDetailsDialog = ({
  packageResult,
  isOpen,
  onOpenChange,
  isLoading,
  details,
  previewTab,
  onPreviewTabChange,
  isSubmitting,
  onImport
}) => {
  const pkg = packageResult?.package ?? null;
  const pcbPreviewUrl = pkg?.latest_pcb_preview_image_url;
  const schematicPreviewUrl = pkg?.latest_sch_preview_image_url;
  const cadPreviewUrl = pkg?.latest_cad_preview_image_url;
  const packageName = pkg?.unscoped_name?.split("/").pop() ?? pkg?.unscoped_name;
  const ownerUsername = pkg?.org_owner_tscircuit_handle ?? void 0;
  const ownerUrl = ownerUsername ? `https://tscircuit.com/${ownerUsername}` : void 0;
  const packageUrl = ownerUsername && packageName ? `https://tscircuit.com/${ownerUsername}/${packageName}` : void 0;
  return /* @__PURE__ */ jsx27(Dialog, { open: isOpen, onOpenChange, children: /* @__PURE__ */ jsxs20(
    DialogContent,
    {
      showOverlay: false,
      style: {
        width: "calc(100vw - 2rem)",
        zIndex: zIndexMap.importComponentDetailsDialog
      },
      className: "rf-max-w-5xl no-scrollbar !rf-overflow-y-auto rf-max-h-[90vh] rf-overflow-hidden rf-flex rf-flex-col rf-rounded-sm",
      children: [
        /* @__PURE__ */ jsx27(DialogHeader, { className: "rf-pb-4 rf-border-b", children: /* @__PURE__ */ jsx27("div", { className: "rf-flex rf-items-start rf-justify-between rf-gap-4", children: /* @__PURE__ */ jsxs20("div", { className: "rf-flex-1 rf-min-w-0", children: [
          /* @__PURE__ */ jsx27(DialogTitle, { className: "rf-text-xl rf-font-semibold rf-truncate", children: packageName }),
          /* @__PURE__ */ jsx27(DialogDescription, { children: pkg?.description })
        ] }) }) }),
        /* @__PURE__ */ jsxs20("div", { className: "rf-flex-1 rf-overflow-y-auto rf-py-4 rf-space-y-6", children: [
          ownerUsername ? /* @__PURE__ */ jsxs20("div", { children: [
            /* @__PURE__ */ jsx27("span", { className: "rf-text-xs rf-font-medium rf-text-gray-500 rf-uppercase rf-tracking-wide", children: "Created by" }),
            /* @__PURE__ */ jsx27("div", { className: "rf-mt-1 rf-text-sm rf-font-medium", children: ownerUrl ? /* @__PURE__ */ jsx27(
              "a",
              {
                href: ownerUrl,
                target: "_blank",
                rel: "noopener noreferrer",
                className: "rf-text-black hover:rf-underline",
                children: ownerUsername
              }
            ) : ownerUsername })
          ] }) : null,
          (cadPreviewUrl || pcbPreviewUrl || schematicPreviewUrl) && /* @__PURE__ */ jsx27(Fragment4, { children: /* @__PURE__ */ jsxs20("div", { children: [
            /* @__PURE__ */ jsx27("h3", { className: "rf-text-lg rf-font-semibold rf-mb-4", children: "Preview" }),
            /* @__PURE__ */ jsxs20(
              Tabs,
              {
                value: previewTab,
                onValueChange: (value) => onPreviewTabChange(value),
                children: [
                  /* @__PURE__ */ jsxs20(TabsList, { className: "rf-inline-flex rf-h-9 rf-items-center rf-justify-center rf-rounded-lg rf-bg-zinc-100 rf-p-1 rf-text-zinc-500 dark:rf-bg-zinc-800 dark:rf-text-zinc-400", children: [
                    pcbPreviewUrl && /* @__PURE__ */ jsx27(TabsTrigger, { value: "pcb", children: "PCB" }),
                    schematicPreviewUrl && /* @__PURE__ */ jsx27(TabsTrigger, { value: "schematic", children: "Schematic" }),
                    cadPreviewUrl && /* @__PURE__ */ jsx27(TabsTrigger, { value: "3d", children: "3D" })
                  ] }),
                  /* @__PURE__ */ jsxs20("div", { className: "rf-mt-4", children: [
                    /* @__PURE__ */ jsx27(
                      TabsContent,
                      {
                        value: "pcb",
                        className: "rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50",
                        children: pcbPreviewUrl ? /* @__PURE__ */ jsx27(
                          "img",
                          {
                            src: pcbPreviewUrl,
                            alt: `${packageName ?? "package"} PCB preview`,
                            className: "rf-w-full rf-h-full rf-object-contain rf-bg-white rf-p-4"
                          }
                        ) : null
                      }
                    ),
                    /* @__PURE__ */ jsx27(
                      TabsContent,
                      {
                        value: "schematic",
                        className: "rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50",
                        children: schematicPreviewUrl ? /* @__PURE__ */ jsx27(
                          "img",
                          {
                            src: schematicPreviewUrl,
                            alt: `${packageName ?? "package"} schematic preview`,
                            className: "rf-w-full rf-h-full rf-object-contain rf-bg-white rf-p-4"
                          }
                        ) : null
                      }
                    ),
                    /* @__PURE__ */ jsx27(
                      TabsContent,
                      {
                        value: "3d",
                        className: "rf-border rf-rounded-lg rf-overflow-hidden rf-bg-gray-50",
                        children: cadPreviewUrl ? /* @__PURE__ */ jsx27(
                          "img",
                          {
                            src: cadPreviewUrl,
                            alt: `${packageName ?? "package"} 3D preview`,
                            className: "rf-w-full rf-h-full rf-object-contain rf-bg-white rf-p-4"
                          }
                        ) : null
                      }
                    )
                  ] })
                ]
              }
            )
          ] }) }),
          details?.ai_description ? /* @__PURE__ */ jsxs20("section", { children: [
            /* @__PURE__ */ jsx27("h3", { className: "rf-text-lg rf-font-semibold rf-mb-3", children: "AI Description" }),
            /* @__PURE__ */ jsx27("div", { className: "rf-bg-gray-50 rf-border rf-border-gray-200 rf-rounded-lg rf-p-4", children: /* @__PURE__ */ jsx27("p", { className: "rf-text-sm rf-text-gray-700 rf-leading-relaxed", children: details.ai_description }) })
          ] }) : null,
          details?.ai_usage_instructions ? /* @__PURE__ */ jsxs20("section", { children: [
            /* @__PURE__ */ jsx27("h3", { className: "rf-text-lg rf-font-semibold rf-mb-3", children: "Usage Instructions" }),
            /* @__PURE__ */ jsx27("div", { className: "rf-bg-gray-50 rf-border rf-border-gray-200 rf-rounded-lg rf-p-4", children: /* @__PURE__ */ jsx27("p", { className: "rf-text-sm rf-text-gray-700 rf-leading-relaxed rf-whitespace-pre-wrap", children: details.ai_usage_instructions }) })
          ] }) : null,
          isLoading ? /* @__PURE__ */ jsxs20("div", { className: "rf-flex rf-justify-center rf-items-center rf-gap-2 rf-text-gray-500", children: [
            /* @__PURE__ */ jsx27(Loader24, { className: "rf-h-4 rf-w-4 rf-animate-spin" }),
            /* @__PURE__ */ jsx27("span", { className: "rf-text-sm", children: "Loading package details..." })
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxs20(DialogFooter, { className: "rf-pt-4 rf-border-t rf-flex rf-flex-col sm:rf-flex-row rf-justify-between rf-gap-2", children: [
          /* @__PURE__ */ jsx27("div", { className: "rf-flex-1", children: packageUrl ? /* @__PURE__ */ jsxs20(
            Button,
            {
              variant: "outline",
              size: "sm",
              className: "rf-gap-2 rf-w-full sm:rf-w-auto",
              onClick: () => window.open(packageUrl, "_blank"),
              children: [
                /* @__PURE__ */ jsx27(ExternalLink, { className: "rf-h-4 rf-w-4" }),
                "View on tscircuit.com"
              ]
            }
          ) : null }),
          /* @__PURE__ */ jsxs20("div", { className: "rf-flex rf-flex-col sm:rf-flex-row rf-gap-2", children: [
            /* @__PURE__ */ jsx27(
              Button,
              {
                variant: "outline",
                onClick: () => onOpenChange(false),
                className: "rf-order-2 sm:rf-order-1",
                children: "Close"
              }
            ),
            /* @__PURE__ */ jsx27(
              Button,
              {
                onClick: onImport,
                disabled: isSubmitting,
                className: "rf-bg-blue-600 hover:rf-bg-blue-700",
                children: isSubmitting ? /* @__PURE__ */ jsx27(Loader24, { className: "rf-h-4 rf-w-4 rf-animate-spin" }) : "Import Component"
              }
            )
          ] })
        ] })
      ]
    }
  ) });
};

// lib/components/ImportComponentDialog2/hooks/useTscircuitPackageDetails.ts
import { useCallback as useCallback2, useState as useState11 } from "react";
var useTscircuitPackageDetails = () => {
  const [details, setDetails] = useState11(null);
  const [isLoading, setIsLoading] = useState11(false);
  const fetchDetails = useCallback2(async (owner, name) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.tscircuit.com/packages/get?name=${encodeURIComponent(`${owner}/${name}`)}`
      );
      if (!response.ok) {
        throw new Error(`Failed to load package details: ${response.status}`);
      }
      const data = await response.json();
      setDetails(
        data.package ?? null
      );
    } catch (error) {
      console.error("Failed to fetch package details", error);
      setDetails(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  const reset = useCallback2(() => {
    setDetails(null);
    setIsLoading(false);
  }, []);
  return {
    details,
    isLoading,
    fetchDetails,
    reset
  };
};

// lib/components/ImportComponentDialog2/hooks/useFootprintPreviewCircuitJson.ts
import * as React11 from "react";
var useFootprintPreviewCircuitJson = (result, opts) => {
  const [state, setState] = React11.useState({
    circuitJson: null,
    error: null,
    isLoading: false
  });
  React11.useEffect(() => {
    if (!result || !canPreviewFootprint(result)) {
      setState({ circuitJson: null, error: null, isLoading: false });
      return;
    }
    let cancelled = false;
    setState({ circuitJson: null, error: null, isLoading: true });
    loadFootprintPreviewCircuitJson(result, opts).then((circuitJson) => {
      if (cancelled) return;
      setState({ circuitJson, error: null, isLoading: false });
    }).catch((error) => {
      if (cancelled) return;
      setState({
        circuitJson: null,
        error: error instanceof Error ? error.message : "Failed to load footprint preview",
        isLoading: false
      });
    });
    return () => {
      cancelled = true;
    };
  }, [result, opts]);
  return state;
};

// lib/components/ImportComponentDialog2/hooks/useTscircuitPackageSearch.ts
import { useCallback as useCallback3, useState as useState13 } from "react";

// lib/components/ImportComponentDialog2/api/tscircuit.ts
var searchTscircuitPackages = async (query, sessionToken) => {
  const headers = {
    "Content-Type": "application/json"
  };
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }
  const response = await fetch(
    "https://registry-api.tscircuit.com/packages/search",
    {
      method: "POST",
      headers,
      body: JSON.stringify({ query })
    }
  );
  if (!response.ok) {
    throw new Error(`tscircuit registry error: ${response.status}`);
  }
  const data = await response.json();
  return data.packages ?? [];
};

// lib/components/ImportComponentDialog2/hooks/useTscircuitPackageSearch.ts
var useTscircuitPackageSearch = ({
  sessionToken
}) => {
  const [results, setResults] = useState13([]);
  const [isSearching, setIsSearching] = useState13(false);
  const [error, setError] = useState13(null);
  const [hasSearched, setHasSearched] = useState13(false);
  const search = useCallback3(
    async (query) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return [];
      setIsSearching(true);
      setError(null);
      try {
        const packages = await searchTscircuitPackages(
          trimmedQuery,
          sessionToken
        );
        const mappedResults = packages.map((pkg) => ({
          source: "tscircuit.com",
          package: pkg
        }));
        setResults(mappedResults);
        return mappedResults;
      } catch (error2) {
        console.error("Error searching tscircuit packages", error2);
        setResults([]);
        setError(
          error2 instanceof Error ? error2.message : "Failed to search tscircuit packages"
        );
        return [];
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
    },
    [sessionToken]
  );
  const reset = useCallback3(() => {
    setResults([]);
    setIsSearching(false);
    setError(null);
    setHasSearched(false);
  }, []);
  return {
    results,
    isSearching,
    error,
    hasSearched,
    search,
    reset
  };
};

// lib/components/ImportComponentDialog2/hooks/useJlcpcbComponentSearch.ts
import { useCallback as useCallback4, useState as useState14 } from "react";

// lib/components/ImportComponentDialog2/direct-jlcpcb-lookup.ts
var createDirectJlcpcbLookupResult = (query) => {
  const match = /^C(\d+)$/i.exec(query.trim());
  if (!match) return null;
  const lcscId = Number(match[1]);
  if (!Number.isSafeInteger(lcscId)) return null;
  const partNumber = `C${match[1]}`;
  return {
    source: "jlcpcb",
    component: {
      lcscId,
      manufacturer: partNumber,
      partNumber,
      description: "Import directly from EasyEDA; stock and availability are unknown",
      package: "",
      isDirectLookup: true
    }
  };
};
var addDirectJlcpcbLookupResult = (query, results) => {
  const directResult = createDirectJlcpcbLookupResult(query);
  if (!directResult) return results;
  const alreadyIncluded = results.some(
    (result) => result.component.partNumber.toUpperCase() === directResult.component.partNumber
  );
  return alreadyIncluded ? results : [directResult, ...results];
};

// lib/components/ImportComponentDialog2/hooks/useJlcpcbComponentSearch.ts
var normalizeQuery = (query) => {
  const trimmedQuery = query.trim();
  const isPartNumber = /^C\d+/i.test(trimmedQuery);
  if (isPartNumber) {
    return trimmedQuery.replace(/^C/i, "");
  }
  return trimmedQuery;
};
var useJlcpcbComponentSearch = () => {
  const [results, setResults] = useState14([]);
  const [isSearching, setIsSearching] = useState14(false);
  const [error, setError] = useState14(null);
  const [hasSearched, setHasSearched] = useState14(false);
  const search = useCallback4(async (query) => {
    const normalizedQuery = normalizeQuery(query);
    if (!normalizedQuery) return [];
    setIsSearching(true);
    setError(null);
    try {
      const components = await searchJlcpcbComponents(normalizedQuery, 10);
      const mappedResults = addDirectJlcpcbLookupResult(
        query,
        components.map((component) => ({
          source: "jlcpcb",
          component: mapJlcpcbComponentToSummary(component)
        }))
      );
      setResults(mappedResults);
      return mappedResults;
    } catch (error2) {
      console.error("Error searching JLCPCB components", error2);
      const directResults = addDirectJlcpcbLookupResult(query, []);
      setResults(directResults);
      setError(
        directResults.length > 0 ? null : error2 instanceof Error ? error2.message : "Failed to search JLCPCB components"
      );
      return directResults;
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, []);
  const reset = useCallback4(() => {
    setResults([]);
    setIsSearching(false);
    setError(null);
    setHasSearched(false);
  }, []);
  return {
    results,
    isSearching,
    error,
    hasSearched,
    search,
    reset
  };
};

// lib/components/ImportComponentDialog2/hooks/useKicadFootprintSearch.ts
import { useCallback as useCallback5, useState as useState15 } from "react";
var useKicadFootprintSearch = () => {
  const [results, setResults] = useState15([]);
  const [isSearching, setIsSearching] = useState15(false);
  const [error, setError] = useState15(null);
  const [hasSearched, setHasSearched] = useState15(false);
  const search = useCallback5(async (query) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return [];
    setIsSearching(true);
    setError(null);
    try {
      const footprints = await searchKicadFootprints(trimmedQuery, 20);
      const mappedResults = footprints.map((footprintPath) => ({
        source: "kicad",
        footprint: mapKicadFootprintToSummary(footprintPath)
      }));
      setResults(mappedResults);
      return mappedResults;
    } catch (error2) {
      console.error("Error searching KiCad footprints", error2);
      setResults([]);
      setError(
        error2 instanceof Error ? error2.message : "Failed to search KiCad footprints"
      );
      return [];
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  }, []);
  const reset = useCallback5(() => {
    setResults([]);
    setIsSearching(false);
    setError(null);
    setHasSearched(false);
  }, []);
  return {
    results,
    isSearching,
    error,
    hasSearched,
    search,
    reset
  };
};

// lib/components/ImportComponentDialog2/ImportComponentDialog2.tsx
import { jsx as jsx28, jsxs as jsxs21 } from "react/jsx-runtime";
var computeAvailableSources = ({
  onTscircuitPackageSelected,
  onJlcpcbComponentTsxLoaded,
  onKicadStringSelected
}) => {
  const sources = [];
  if (onTscircuitPackageSelected) sources.push("tscircuit.com");
  if (onJlcpcbComponentTsxLoaded) sources.push("jlcpcb");
  if (onKicadStringSelected) sources.push("kicad");
  return sources;
};
var ImportComponentDialog2 = ({
  isOpen,
  onClose,
  jlcpcbProxyRequestHeaders,
  onKicadStringSelected,
  onTscircuitPackageSelected,
  onJlcpcbComponentTsxLoaded,
  jlcpcbProxyApiBase,
  tscircuitSessionToken
}) => {
  useStyles();
  const availableSources = React12.useMemo(
    () => computeAvailableSources({
      onKicadStringSelected,
      onTscircuitPackageSelected,
      onJlcpcbComponentTsxLoaded
    }),
    [
      onKicadStringSelected,
      onTscircuitPackageSelected,
      onJlcpcbComponentTsxLoaded
    ]
  );
  const hasSources = availableSources.length > 0;
  const singleSource = availableSources.length === 1;
  const [activeSource, setActiveSource] = React12.useState(
    availableSources[0] ?? "tscircuit.com"
  );
  const [searchQuery, setSearchQuery] = React12.useState("");
  const [selectedSearchResult, setSelectedSearchResult] = React12.useState(null);
  const {
    results: tscircuitResults,
    isSearching: isTscircuitSearching,
    error: tscircuitError,
    hasSearched: hasTscircuitSearched,
    search: searchTscircuit,
    reset: resetTscircuitSearch
  } = useTscircuitPackageSearch({
    sessionToken: tscircuitSessionToken
  });
  const {
    results: jlcpcbResults,
    isSearching: isJlcpcbSearching,
    error: jlcpcbError,
    hasSearched: hasJlcpcbSearched,
    search: searchJlcpcb,
    reset: resetJlcpcbSearch
  } = useJlcpcbComponentSearch();
  const {
    results: kicadResults,
    isSearching: isKicadSearching,
    error: kicadError,
    hasSearched: hasKicadSearched,
    search: searchKicad,
    reset: resetKicadSearch
  } = useKicadFootprintSearch();
  const {
    details: packageDetails,
    isLoading: isPackageDetailsLoading,
    fetchDetails: fetchPackageDetails,
    reset: resetPackageDetails
  } = useTscircuitPackageDetails();
  const [componentForDetails, setComponentForDetails] = React12.useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React12.useState(false);
  const [detailsPreviewTab, setDetailsPreviewTab] = React12.useState("pcb");
  const [importErrorMessage, setImportErrorMessage] = React12.useState(null);
  const [isSubmittingImport, setIsSubmittingImport] = React12.useState(false);
  const footprintPreviewOptions = React12.useMemo(
    () => ({
      jlcpcb: {
        headers: jlcpcbProxyRequestHeaders,
        apiBase: jlcpcbProxyApiBase
      }
    }),
    [jlcpcbProxyApiBase, jlcpcbProxyRequestHeaders]
  );
  const {
    circuitJson: footprintPreviewCircuitJson,
    error: footprintPreviewError,
    isLoading: isFootprintPreviewLoading
  } = useFootprintPreviewCircuitJson(
    selectedSearchResult,
    footprintPreviewOptions
  );
  const showFootprintPreview = canPreviewFootprint(selectedSearchResult);
  React12.useEffect(() => {
    setImportErrorMessage(null);
  }, [selectedSearchResult]);
  const resetAllSearches = React12.useCallback(() => {
    resetTscircuitSearch();
    resetJlcpcbSearch();
    resetKicadSearch();
    setSelectedSearchResult(null);
  }, [resetJlcpcbSearch, resetKicadSearch, resetTscircuitSearch]);
  React12.useEffect(() => {
    if (!isOpen) {
      resetAllSearches();
      setSearchQuery("");
      setIsDetailsDialogOpen(false);
      setComponentForDetails(null);
      setImportErrorMessage(null);
    }
  }, [isOpen, resetAllSearches]);
  React12.useEffect(() => {
    setSearchQuery("");
    setSelectedSearchResult(null);
    if (activeSource === "tscircuit.com") {
      resetTscircuitSearch();
    } else if (activeSource === "jlcpcb") {
      resetJlcpcbSearch();
    } else if (activeSource === "kicad") {
      resetKicadSearch();
    }
  }, [activeSource, resetJlcpcbSearch, resetKicadSearch, resetTscircuitSearch]);
  const handleShowDetails = (component) => {
    setSelectedSearchResult(component);
    setComponentForDetails(component);
    setDetailsPreviewTab("pcb");
    setIsDetailsDialogOpen(true);
    resetPackageDetails();
    const owner = component.package.org_owner_tscircuit_handle;
    const unscopedName = component.package.unscoped_name;
    if (owner && unscopedName) {
      const packageName = unscopedName.split("/").pop() ?? unscopedName;
      fetchPackageDetails(owner, packageName);
    }
  };
  const performSearch = async () => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    setSelectedSearchResult(null);
    if (activeSource === "tscircuit.com") {
      await searchTscircuit(searchQuery);
    } else if (activeSource === "jlcpcb") {
      await searchJlcpcb(searchQuery);
    } else if (activeSource === "kicad") {
      await searchKicad(searchQuery);
    }
  };
  const performActionForComponent = async (result) => {
    try {
      setImportErrorMessage(null);
      setIsSubmittingImport(true);
      if (result.source === "kicad") {
        if (!onKicadStringSelected) {
          throw new Error("KiCad handler not provided");
        }
        await onKicadStringSelected({
          result,
          footprint: result.footprint.qualifiedName
        });
      } else if (result.source === "jlcpcb") {
        if (!onJlcpcbComponentTsxLoaded) {
          throw new Error("JLCPCB handler not provided");
        }
        const tsx = await loadJlcpcbComponentTsx(result.component.partNumber, {
          headers: jlcpcbProxyRequestHeaders,
          apiBase: jlcpcbProxyApiBase
        });
        await onJlcpcbComponentTsxLoaded({ result, tsx });
      } else if (result.source === "tscircuit.com") {
        if (!onTscircuitPackageSelected) {
          throw new Error("tscircuit package handler not provided");
        }
        const owner = result.package.org_owner_tscircuit_handle;
        const unscopedName = result.package.unscoped_name;
        if (!owner || !unscopedName) {
          throw new Error("Missing package metadata");
        }
        const packageName = unscopedName.split("/").pop() ?? unscopedName;
        const fullPackageName = `@tsci/${owner}.${packageName}`;
        await onTscircuitPackageSelected({
          result,
          fullPackageName
        });
      }
      return true;
    } catch (error) {
      console.error("Failed to import component", error);
      setImportErrorMessage(
        error instanceof Error ? error.message : "Failed to import component"
      );
      return false;
    } finally {
      setIsSubmittingImport(false);
    }
  };
  let searchResults = [];
  let isSearching = false;
  let searchError = null;
  let hasExecutedSearch = false;
  if (activeSource === "tscircuit.com") {
    searchResults = tscircuitResults;
    isSearching = isTscircuitSearching;
    searchError = tscircuitError;
    hasExecutedSearch = hasTscircuitSearched;
  } else if (activeSource === "jlcpcb") {
    searchResults = jlcpcbResults;
    isSearching = isJlcpcbSearching;
    searchError = jlcpcbError;
    hasExecutedSearch = hasJlcpcbSearched;
  } else if (activeSource === "kicad") {
    searchResults = kicadResults;
    isSearching = isKicadSearching;
    searchError = kicadError;
    hasExecutedSearch = hasKicadSearched;
  }
  const handleConfirm = async () => {
    if (!selectedSearchResult) return;
    const succeeded = await performActionForComponent(selectedSearchResult);
    if (succeeded) {
      onClose();
      resetAllSearches();
      setSearchQuery("");
    }
  };
  const handleDialogClose = (open) => {
    if (!open) {
      onClose();
    }
  };
  const handleDetailsClose = (open) => {
    setIsDetailsDialogOpen(open);
    if (!open) {
      setComponentForDetails(null);
    }
  };
  return /* @__PURE__ */ jsxs21(Dialog, { open: isOpen, onOpenChange: handleDialogClose, children: [
    /* @__PURE__ */ jsxs21(
      DialogContent,
      {
        style: {
          width: "calc(100vw - 2rem)",
          maxWidth: showFootprintPreview ? "min(1120px, calc(100vw - 2rem))" : "min(672px, calc(100vw - 2rem))",
          zIndex: zIndexMap.importComponentDialog
        },
        className: "rf-rounded-sm rf-max-h-[90vh] rf-overflow-y-auto rf-overflow-x-hidden rf-flex rf-flex-col",
        children: [
          /* @__PURE__ */ jsxs21(DialogHeader, { children: [
            /* @__PURE__ */ jsxs21(DialogTitle, { className: "rf-text-lg sm:rf-text-xl", children: [
              "Import ",
              singleSource ? SOURCE_CONFIG[activeSource].label : "",
              " ",
              "Component"
            ] }),
            /* @__PURE__ */ jsx28(DialogDescription, { className: "rf-text-sm", children: hasSources ? "Search for components from available sources." : "Import options are disabled because no handlers were provided." })
          ] }),
          hasSources ? /* @__PURE__ */ jsxs21(
            Tabs,
            {
              value: activeSource,
              onValueChange: (value) => setActiveSource(value),
              className: "rf-min-w-0 rf-w-full",
              children: [
                !singleSource && /* @__PURE__ */ jsx28(TabsList, { className: "rf-flex rf-w-full rf-gap-2", children: availableSources.map((source) => /* @__PURE__ */ jsx28(
                  TabsTrigger,
                  {
                    value: source,
                    className: "rf-flex-1 rf-text-xs sm:rf-text-sm",
                    children: SOURCE_CONFIG[source].label
                  },
                  source
                )) }),
                /* @__PURE__ */ jsxs21(
                  "div",
                  {
                    className: "rf-min-w-0",
                    style: showFootprintPreview ? {
                      display: "grid",
                      gridTemplateColumns: "minmax(0, 1fr) minmax(360px, 0.95fr)",
                      gap: "1.5rem",
                      alignItems: "start"
                    } : void 0,
                    children: [
                      /* @__PURE__ */ jsxs21("div", { className: "rf-min-w-0", children: [
                        /* @__PURE__ */ jsx28(
                          SearchBar,
                          {
                            query: searchQuery,
                            placeholder: SOURCE_CONFIG[activeSource].placeholder,
                            isSearching,
                            onQueryChange: setSearchQuery,
                            onSubmit: performSearch
                          }
                        ),
                        /* @__PURE__ */ jsx28("div", { className: "no-scrollbar rf-mt-4 rf-flex-1 rf-min-h-[200px] !rf-max-h-[40vh] !rf-overflow-y-auto rf-overflow-x-hidden rf-border rf-rounded-md rf-min-w-0", children: isSearching ? /* @__PURE__ */ jsxs21("div", { className: "rf-p-8 rf-text-center rf-text-zinc-500", children: [
                          /* @__PURE__ */ jsx28(Loader25, { className: "rf-h-8 rf-w-8 rf-animate-spin rf-mx-auto rf-mb-2" }),
                          /* @__PURE__ */ jsx28("p", { children: "Searching..." })
                        ] }) : searchResults.length > 0 ? /* @__PURE__ */ jsx28(
                          SearchResultsList,
                          {
                            results: searchResults,
                            selected: selectedSearchResult,
                            onSelect: setSelectedSearchResult,
                            onShowDetails: activeSource === "tscircuit.com" ? handleShowDetails : void 0
                          }
                        ) : /* @__PURE__ */ jsx28("div", { className: "rf-p-8 rf-text-center rf-text-zinc-500", children: searchError ? `Error: ${searchError}` : hasExecutedSearch ? SOURCE_CONFIG[activeSource].emptyMessage : "Enter a search term to find components" }) })
                      ] }),
                      showFootprintPreview ? /* @__PURE__ */ jsx28("div", { className: "rf-mt-4", children: /* @__PURE__ */ jsx28(
                        FootprintPreviewPanel,
                        {
                          circuitJson: footprintPreviewCircuitJson,
                          error: footprintPreviewError,
                          isLoading: isFootprintPreviewLoading,
                          height: 325
                        }
                      ) }) : null
                    ]
                  }
                )
              ]
            }
          ) : null,
          importErrorMessage ? /* @__PURE__ */ jsx28("div", { className: "rf-text-sm rf-text-red-600 rf-mt-2", children: importErrorMessage }) : null,
          /* @__PURE__ */ jsxs21(DialogFooter, { className: "rf-flex rf-flex-col sm:rf-flex-row rf-gap-2", children: [
            /* @__PURE__ */ jsx28(
              Button,
              {
                variant: "outline",
                onClick: onClose,
                className: "rf-order-2 sm:rf-order-1",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsx28(
              Button,
              {
                onClick: handleConfirm,
                disabled: !selectedSearchResult || isSubmittingImport,
                className: "rf-order-1 sm:rf-order-2",
                children: isSubmittingImport ? /* @__PURE__ */ jsx28(Loader25, { className: "rf-h-4 rf-w-4 rf-animate-spin" }) : "Import"
              }
            )
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsx28(
      TscircuitPackageDetailsDialog,
      {
        packageResult: componentForDetails,
        isOpen: isDetailsDialogOpen,
        onOpenChange: handleDetailsClose,
        isLoading: isPackageDetailsLoading,
        details: packageDetails,
        previewTab: detailsPreviewTab,
        onPreviewTabChange: (value) => setDetailsPreviewTab(value),
        isSubmitting: isSubmittingImport,
        onImport: () => {
          if (!componentForDetails) return;
          performActionForComponent(componentForDetails).then((succeeded) => {
            if (succeeded) {
              setIsDetailsDialogOpen(false);
              onClose();
              resetAllSearches();
              setSearchQuery("");
            }
          });
        }
      }
    )
  ] });
};

// lib/components/ImportComponentDialog2/ImportComponentDialogForCli.tsx
import "react";
import { jsx as jsx29 } from "react/jsx-runtime";
var extractComponentName = (tsx) => {
  const match = tsx.match(/export const (\w+) =/);
  if (!match) {
    throw new Error("Could not determine component name from TSX contents");
  }
  return match[1];
};
var ImportComponentDialogForCli = (props) => {
  const pushEvent = useRunFrameStore((state) => state.pushEvent);
  const upsertFile = useRunFrameStore((state) => state.upsertFile);
  const handleTscircuitPackageSelected = async ({
    result,
    fullPackageName
  }) => {
    const packageName = result.package.unscoped_name;
    const displayName = packageName ?? result.package.name;
    await toast.promise(
      pushEvent({
        event_type: "INSTALL_PACKAGE",
        full_package_name: fullPackageName
      }),
      {
        loading: `Requesting install for "${displayName}"`,
        success: `Install requested for "${displayName}"`,
        error: (error) => `Failed to request install: ${error instanceof Error ? error.message : String(error)}`
      }
    );
  };
  const handleKicadStringSelected = async ({
    footprint
  }) => {
    await toast.promise(navigator.clipboard.writeText(footprint), {
      loading: `Copying "${footprint}"`,
      success: `Copied "${footprint}" to clipboard`,
      error: (error) => `Failed to copy footprint: ${error instanceof Error ? error.message : String(error)}`
    });
  };
  const handleJlcpcbComponentTsxLoaded = async ({
    result,
    tsx
  }) => {
    const componentName = extractComponentName(tsx);
    const filePath = `imports/${componentName}.tsx`;
    await toast.promise(upsertFile(filePath, tsx), {
      loading: `Importing ${result.component.partNumber}`,
      success: `Imported to "${filePath}"`,
      error: (error) => `Failed to import component: ${error instanceof Error ? error.message : String(error)}`
    });
  };
  return /* @__PURE__ */ jsx29(
    ImportComponentDialog2,
    {
      ...props,
      onTscircuitPackageSelected: handleTscircuitPackageSelected,
      onKicadStringSelected: handleKicadStringSelected,
      onJlcpcbComponentTsxLoaded: handleJlcpcbComponentTsxLoaded
    }
  );
};
ImportComponentDialogForCli.displayName = "ImportComponentDialogForCli";

// lib/optional-features/exporting/formats/export-altium-project.ts
var createAltiumProjectZip = async ({
  circuitJson,
  projectName
}) => {
  const { convertCircuitJsonToAltiumZip } = await import("circuit-json-to-altium");
  const bytes = await convertCircuitJsonToAltiumZip(circuitJson, projectName);
  return new Blob([new Uint8Array(bytes)], { type: "application/zip" });
};
var exportAltiumProject = async ({
  circuitJson,
  projectName
}) => {
  await toast.promise(
    (async () => {
      const zipBlob = await createAltiumProjectZip({ circuitJson, projectName });
      openForDownload(zipBlob, {
        fileName: `${projectName}_altium_project.zip`
      });
    })(),
    {
      loading: "Generating Altium project...",
      success: "Altium project ZIP ready",
      error: (error) => `Failed to generate Altium project: ${error instanceof Error ? error.message : String(error)}`
    }
  );
};

// lib/optional-features/exporting/formats/export-assembly-step.ts
import JSZip from "jszip";

// lib/optional-features/exporting/get-step-converter.ts
var getStepConverter = async () => {
  return await import("circuit-json-to-step");
};

// lib/optional-features/exporting/formats/export-assembly-step.ts
var exportAssemblyStep = async ({
  circuitJson,
  projectName
}) => {
  try {
    const { circuitJsonToStep } = await getStepConverter();
    const files = await circuitJsonToStep(circuitJson, {
      exportMode: "assembly"
    });
    const zip = new JSZip();
    for (const [fileName, stepText] of Object.entries(files)) {
      zip.file(fileName, stepText);
    }
    openForDownload(await zip.generateAsync({ type: "blob" }), {
      fileName: `${projectName}-assembly.zip`
    });
  } catch (error) {
    toast.error(
      `Failed to export assembly STEP: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

// lib/optional-features/exporting/formats/export-fabrication-files.ts
import importer3 from "@tscircuit/internal-dynamic-import";
import JSZip2 from "jszip";
var exportFabricationFiles = async ({
  circuitJson,
  projectName
}) => {
  await toast.promise(
    (async () => {
      const zip = new JSZip2();
      const [
        gerberConverter,
        { convertCircuitJsonToBomRows, convertBomRowsToCsv },
        { convertCircuitJsonToPickAndPlaceCsv }
      ] = await Promise.all([
        importer3("circuit-json-to-gerber"),
        importer3("circuit-json-to-bom-csv"),
        importer3("circuit-json-to-pnp-csv")
      ]);
      const filteredCircuitJson = circuitJson.filter(
        (element) => !("error_type" in element) && !("warning_type" in element)
      );
      const gerberFiles = gerberConverter.convertCircuitJsonToGerberFiles(
        filteredCircuitJson,
        {
          flip_y_axis: false
        }
      );
      for (const [fileName, fileContents] of Object.entries(gerberFiles)) {
        zip.file(`gerber/${fileName}`, fileContents);
      }
      const bomRows = await convertCircuitJsonToBomRows({ circuitJson });
      const bomCsv = await convertBomRowsToCsv(bomRows);
      zip.file("bom.csv", bomCsv);
      const pnpCsv = await convertCircuitJsonToPickAndPlaceCsv(circuitJson, {
        supplier: "jlcpcb"
      });
      zip.file("pick_and_place.csv", pnpCsv);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      openForDownload(zipBlob, {
        fileName: `${projectName}_fabrication_files.zip`
      });
    })(),
    {
      loading: "Generating fabrication files...",
      success: "Fabrication ZIP ready",
      error: (error) => `Failed to generate fabrication files: ${error instanceof Error ? error.message : String(error)}`
    }
  );
};

// lib/optional-features/exporting/formats/export-fdm-component-box.ts
import importer4 from "@tscircuit/internal-dynamic-import";
var generateFdmComponentBox = async (circuitJson) => {
  const { createFdmComponentBox, renderFdmComponentBoxPng } = await importer4(
    "circuit-json-to-fdm-component-box"
  );
  const [result, previewPng] = await Promise.all([
    createFdmComponentBox(circuitJson),
    renderFdmComponentBoxPng(circuitJson, {}, { width: 960, height: 640 })
  ]);
  return { ...result, previewPng };
};
var generateFdmComponentBox3mf = async (circuitJson) => {
  const { createFdmComponentBox } = await importer4(
    "circuit-json-to-fdm-component-box"
  );
  return createFdmComponentBox(circuitJson);
};
var downloadFdmComponentBox = ({
  generatedBox,
  projectName
}) => {
  const bytes = Uint8Array.from(generatedBox.threeMf);
  openForDownload(new Blob([bytes.buffer], { type: "model/3mf" }), {
    fileName: `${sanitizeFileName(projectName)}-component-box.3mf`
  });
};
var exportFdmComponentBox = async ({
  circuitJson,
  projectName
}) => {
  await toast.promise(
    (async () => {
      const generatedBox = await generateFdmComponentBox3mf(circuitJson);
      downloadFdmComponentBox({
        generatedBox,
        projectName
      });
    })(),
    {
      loading: "Generating component box...",
      success: "Component box 3MF ready",
      error: (error) => `Failed to generate component box: ${error instanceof Error ? error.message : String(error)}`
    }
  );
};

// lib/optional-features/exporting/formats/export-glb.ts
import importer5 from "@tscircuit/internal-dynamic-import";
var exportGlb = async ({
  circuitJson,
  projectName
}) => {
  let blob;
  try {
    const { convertCircuitJsonToGltf } = await importer5("circuit-json-to-gltf");
    console.log("convertCircuitJsonToGltf", convertCircuitJsonToGltf);
    const glbArrayBuffer = await convertCircuitJsonToGltf(circuitJson, {
      format: "glb",
      boardTextureResolution: 1024
    });
    if (!glbArrayBuffer || !(glbArrayBuffer instanceof ArrayBuffer)) {
      throw new Error("Invalid GLB data returned from converter");
    }
    blob = new Blob([glbArrayBuffer], {
      type: "model/gltf-binary"
    });
  } catch (error) {
    console.error("GLB Export Error:", error);
    return;
  }
  openForDownload(blob, {
    fileName: `${projectName}.glb`
  });
};

// lib/optional-features/exporting/formats/export-kicad-library.ts
import importer6 from "@tscircuit/internal-dynamic-import";
import JSZip3 from "jszip";
var createKicadLibraryZip = async ({
  circuitJson,
  libraryName
}) => {
  const { CircuitJsonToKicadLibraryConverter } = await importer6(
    "circuit-json-to-kicad"
  );
  const libConverter = new CircuitJsonToKicadLibraryConverter(
    circuitJson,
    {
      libraryName,
      footprintLibraryName: libraryName
    }
  );
  libConverter.runUntilFinished();
  const libOutput = libConverter.getOutput();
  const zip = new JSZip3();
  zip.file(`${libraryName}.kicad_sym`, libOutput.kicadSymString);
  for (const fp of libOutput.footprints) {
    const libraryFolder = zip.folder(`${libraryName}.pretty`);
    if (libraryFolder) {
      libraryFolder.file(
        `${fp.footprintName}.kicad_mod`,
        `${fp.kicadModString}
`
      );
    }
  }
  if (libOutput.model3dSourcePaths.length > 0) {
    const shapesFolder = zip.folder(`${libraryName}.3dshapes`);
    if (shapesFolder) {
      for (const modelPath of libOutput.model3dSourcePaths) {
        try {
          const filename = modelPath.split("/").pop() || modelPath;
          const response = await fetch(modelPath);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            shapesFolder.file(filename, arrayBuffer);
          }
        } catch {
        }
      }
    }
  }
  zip.file("fp-lib-table", libOutput.fpLibTableString);
  zip.file("sym-lib-table", libOutput.symLibTableString);
  return zip;
};
var exportKicadLibrary = async ({
  circuitJson,
  projectName
}) => {
  await toast.promise(
    (async () => {
      const zip = await createKicadLibraryZip({
        circuitJson,
        libraryName: projectName
      });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      openForDownload(zipBlob, {
        fileName: `${projectName}_kicad_library.zip`
      });
    })(),
    {
      loading: "Generating KiCad library...",
      success: "KiCad library ZIP ready",
      error: (error) => `Failed to generate KiCad library: ${error instanceof Error ? error.message : String(error)}`
    }
  );
};

// lib/optional-features/exporting/formats/export-kicad-project.ts
import importer7 from "@tscircuit/internal-dynamic-import";
import JSZip4 from "jszip";
var createKicadProjectZip = async ({
  circuitJson,
  projectName
}) => {
  const {
    CircuitJsonToKicadPcbConverter,
    CircuitJsonToKicadSchConverter,
    CircuitJsonToKicadProConverter,
    resolveAndLoadKicad3dModelFiles
  } = await importer7("circuit-json-to-kicad");
  const schConverter = new CircuitJsonToKicadSchConverter(circuitJson);
  schConverter.runUntilFinished();
  const schContent = schConverter.getOutputString();
  const pcbConverter = new CircuitJsonToKicadPcbConverter(circuitJson, {
    includeBuiltin3dModels: true,
    projectName
  });
  pcbConverter.runUntilFinished();
  const pcbContent = pcbConverter.getOutputString();
  const proConverter = new CircuitJsonToKicadProConverter(circuitJson, {
    projectName,
    schematicFilename: `${projectName}.kicad_sch`,
    pcbFilename: `${projectName}.kicad_pcb`
  });
  proConverter.runUntilFinished();
  const proContent = proConverter.getOutputString();
  const zip = new JSZip4();
  zip.file(`${projectName}.kicad_sch`, schContent);
  zip.file(`${projectName}.kicad_pcb`, pcbContent);
  zip.file(`${projectName}.kicad_pro`, proContent);
  await resolveAndLoadKicad3dModelFiles({
    projectName,
    model3dSourcePaths: pcbConverter.getModel3dSourcePaths(),
    fetch,
    onModelFile: ({ outputPath, content }) => {
      zip.file(outputPath, content);
    },
    onError: ({ sourcePath }) => {
      console.warn(`Failed to load 3D model from ${sourcePath}`);
    }
  });
  return zip;
};
var exportKicadProject = async ({
  circuitJson,
  projectName
}) => {
  await toast.promise(
    (async () => {
      const zip = await createKicadProjectZip({ circuitJson, projectName });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      openForDownload(zipBlob, {
        fileName: `${projectName}_kicad_project.zip`
      });
    })(),
    {
      loading: "Generating KiCad project...",
      success: "KiCad project ZIP ready",
      error: (error) => `Failed to generate KiCad project: ${error instanceof Error ? error.message : String(error)}`
    }
  );
};

// lib/optional-features/exporting/formats/export-lbrn.ts
import importer8 from "@tscircuit/internal-dynamic-import";
var exportLbrn = async ({
  circuitJson,
  projectName,
  options = {}
}) => {
  try {
    const { convertCircuitJsonToLbrn } = await importer8("circuit-json-to-lbrn");
    const lbrnProject = await convertCircuitJsonToLbrn(circuitJson, {
      includeSilkscreen: options.includeSilkscreen ?? false,
      includeOxidationCleaningLayer: options.includeOxidationCleaningLayer ?? true
    });
    const lbrnContent = lbrnProject.toXml();
    const blob = new Blob([lbrnContent], {
      type: "application/lbrn"
    });
    openForDownload(blob, {
      fileName: `${projectName}.lbrn2`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.error(`Failed to export to LBRN format: ${errorMessage}`);
  }
};

// lib/optional-features/exporting/formats/export-pinout-svg.ts
import importer9 from "@tscircuit/internal-dynamic-import";
var exportPinoutSvg = async ({
  circuitJson,
  projectName
}) => {
  const { convertCircuitJsonToPinoutSvg } = await importer9("circuit-to-svg");
  const svgString = convertCircuitJsonToPinoutSvg(circuitJson);
  openForDownload(svgString, {
    fileName: `${projectName}-pinout.svg`,
    mimeType: "image/svg+xml"
  });
};

// lib/optional-features/exporting/formats/export-step.ts
import importer10 from "@tscircuit/internal-dynamic-import";
var exportStep = async ({
  circuitJson,
  projectName
}) => {
  const { circuitJsonToStep } = await importer10("circuit-json-to-step");
  const pcbBoard = circuitJson.find((el) => el.type === "pcb_board");
  const boardWidth = pcbBoard && "width" in pcbBoard ? pcbBoard.width : void 0;
  const boardHeight = pcbBoard && "height" in pcbBoard ? pcbBoard.height : void 0;
  const boardThickness = pcbBoard && "thickness" in pcbBoard ? pcbBoard.thickness : void 0;
  if (boardWidth === void 0 || boardHeight === void 0 || boardThickness === void 0) {
    toast.error(
      "Board dimensions not found. Please add a pcb_board with width, height, and thickness to your circuit."
    );
    return;
  }
  let stepText;
  try {
    stepText = await circuitJsonToStep(circuitJson, {
      boardWidth,
      boardHeight,
      boardThickness,
      productName: projectName,
      includeComponents: true,
      includeExternalMeshes: true
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.error(`Failed to convert circuit to STEP format: ${errorMessage}`);
    return;
  }
  const blob = new Blob([stepText], {
    type: "application/step"
  });
  try {
    openForDownload(blob, {
      fileName: `${projectName}.step`
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    toast.error(`Failed to download STEP file: ${errorMessage}`);
  }
};

// lib/optional-features/exporting/export-and-download.ts
var availableExports = [
  { extension: "json", name: "Circuit JSON" },
  { extension: "json", name: "Simple Route JSON" },
  { extension: "zip", name: "Fabrication Files" },
  { extension: "zip", name: "KiCad Project" },
  { extension: "zip", name: "Altium Project" },
  { extension: "zip", name: "KiCad Library" },
  { extension: "glb", name: "GLB (Binary GLTF)" },
  { extension: "svg", name: "Pinout SVG" },
  { extension: "step", name: "STEP" },
  { extension: "zip", name: "Assembly STEP" },
  { extension: "lbrn2", name: "LightBurn" }
  // { extension: "svg", name: "SVG" },
  // { extension: "dsn", name: "Specctra DSN" },
  // { extension: "kicad_mod", name: "KiCad Module" },
  // { extension: "gbr", name: "Gerbers" },
];
var exportAndDownload = async ({
  exportName,
  circuitJson,
  simpleRouteJson,
  projectName: rawProjectName
}) => {
  const projectName = sanitizeFileName(rawProjectName);
  if (exportName === "Fabrication Files") {
    await exportFabricationFiles({ circuitJson, projectName });
    return;
  }
  if (exportName === "KiCad Project") {
    await exportKicadProject({ circuitJson, projectName });
    return;
  }
  if (exportName === "Altium Project") {
    await exportAltiumProject({ circuitJson, projectName });
    return;
  }
  if (exportName === "KiCad Library") {
    await exportKicadLibrary({ circuitJson, projectName });
    return;
  }
  if (exportName === "Circuit JSON") {
    openForDownload(JSON.stringify(circuitJson, null, 2), {
      fileName: `${projectName}.circuit.json`,
      mimeType: "application/json"
    });
    return;
  }
  if (exportName === "Simple Route JSON") {
    if (!simpleRouteJson) {
      throw new Error("No Simple Route JSON available to export");
    }
    openForDownload(JSON.stringify(simpleRouteJson, null, 2), {
      fileName: `${projectName}.simple-route.json`,
      mimeType: "application/json"
    });
    return;
  }
  if (exportName === "GLB (Binary GLTF)") {
    await exportGlb({ circuitJson, projectName });
    return;
  }
  if (exportName === "Pinout SVG") {
    exportPinoutSvg({ circuitJson, projectName });
    return;
  }
  if (exportName === "STEP") {
    await exportStep({ circuitJson, projectName });
    return;
  }
  if (exportName === "Assembly STEP") {
    await exportAssemblyStep({ circuitJson, projectName });
    return;
  }
  if (exportName === "Component Box (3MF)") {
    await exportFdmComponentBox({ circuitJson, projectName });
    return;
  }
  if (exportName === "LightBurn") {
    await exportLbrn({ circuitJson, projectName });
    return;
  }
  throw new Error(`Unsupported export type: "${exportName}"`);
};

// lib/components/AiReviewDialog/AiReviewDialog.tsx
import { useState as useState19 } from "react";

// lib/components/AiReviewDialog/ListAiReviewsView.tsx
import { useEffect as useEffect13, useState as useState17 } from "react";
import { Fragment as Fragment5, jsx as jsx30, jsxs as jsxs22 } from "react/jsx-runtime";
var AiReviewListView = ({
  packageName,
  onSelectReview
}) => {
  const fsMap = useRunFrameStore((s) => s.fsMap);
  const circuitJson = useRunFrameStore((s) => s.circuitJson);
  const [reviews, setReviews] = useState17([]);
  const [loading, setLoading] = useState17(false);
  const [creating, setCreating] = useState17(false);
  useEffect13(() => {
    if (!packageName || !hasRegistryToken()) return;
    setLoading(true);
    registryKy.get("ai_reviews/list", { searchParams: { package_name: packageName } }).json().then((data) => setReviews(data.ai_reviews)).catch((err) => {
      console.error("Failed to load AI reviews", err);
      toast.error("Failed to load AI reviews");
    }).finally(() => setLoading(false));
  }, [packageName]);
  const requestReview = async () => {
    if (!circuitJson) {
      toast.error("Need Circuit JSON to Request AI Review");
      return;
    }
    if (!hasRegistryToken()) {
      toast.error("Missing registry token");
      return;
    }
    setCreating(true);
    try {
      const { ai_review } = await registryKy.post("ai_reviews/create", {
        json: {
          package_name: packageName ?? "unknown",
          fs_map: Object.fromEntries(fsMap),
          circuit_json: circuitJson
        }
      }).json();
      setReviews((r) => [ai_review, ...r]);
      onSelectReview(ai_review);
      toast.success("AI review requested");
    } catch (err) {
      console.error("Failed to create AI review", err);
      toast.error("Failed to request AI review");
    } finally {
      setCreating(false);
    }
  };
  return /* @__PURE__ */ jsxs22(Fragment5, { children: [
    /* @__PURE__ */ jsxs22(DialogHeader, { children: [
      /* @__PURE__ */ jsx30(DialogTitle, { children: "AI Review" }),
      /* @__PURE__ */ jsx30(DialogDescription, { children: "Select an AI review or request a new one." })
    ] }),
    /* @__PURE__ */ jsx30("div", { className: "rf-flex rf-gap-4 rf-mt-4", children: /* @__PURE__ */ jsx30("div", { className: "rf-w-48 rf-h-64 rf-overflow-y-auto rf-border rf-rounded rf-p-2 rf-flex-shrink-0", children: loading ? /* @__PURE__ */ jsx30("div", { className: "rf-text-sm", children: "Loading..." }) : reviews.length > 0 ? reviews.map((review) => /* @__PURE__ */ jsx30(
      "div",
      {
        className: "rf-text-sm rf-p-2 rf-cursor-pointer rf-rounded hover:rf-bg-zinc-100",
        onClick: () => onSelectReview(review),
        children: new Date(review.created_at || "").toLocaleString()
      },
      review.ai_review_id
    )) : /* @__PURE__ */ jsx30("div", { className: "rf-text-sm rf-text-muted-foreground", children: "No AI reviews found." }) }) }),
    /* @__PURE__ */ jsx30(DialogFooter, { className: "rf-mt-4", children: /* @__PURE__ */ jsx30(Button, { onClick: requestReview, disabled: creating, children: creating ? "Requesting..." : "Review my Board" }) })
  ] });
};

// lib/components/AiReviewDialog/ViewAiReviewView.tsx
import { useEffect as useEffect14, useMemo as useMemo6, useState as useState18 } from "react";
import { marked } from "marked";
import { Fragment as Fragment6, jsx as jsx31, jsxs as jsxs23 } from "react/jsx-runtime";
var AiReviewViewView = ({
  review,
  onBack
}) => {
  const [aiReviewText, setAiReviewText] = useState18(
    review.ai_review_text ?? null
  );
  const registryKy2 = getRegistryKy();
  const aiReviewId = review.ai_review_id;
  useEffect14(() => {
    if (!aiReviewId) return;
    let timeout;
    async function loadAiReviewText() {
      try {
        const response = await registryKy2.get(
          "ai_reviews/get",
          {
            searchParams: { ai_review_id: aiReviewId }
          }
        );
        const { ai_review: newAiReview } = await response.json();
        if (newAiReview.ai_review_text) {
          setAiReviewText(newAiReview.ai_review_text);
          return;
        }
      } catch (e) {
        console.error("Failed to load AI review text", e);
      }
      timeout = setTimeout(loadAiReviewText, 1e3);
    }
    timeout = setTimeout(loadAiReviewText, 1e3);
    return () => clearTimeout(timeout);
  }, [aiReviewId]);
  const html = useMemo6(
    () => marked.parse(review.ai_review_text || ""),
    [review.ai_review_text]
  );
  return /* @__PURE__ */ jsxs23(Fragment6, { children: [
    /* @__PURE__ */ jsxs23(DialogHeader, { className: "rf-flex rf-flex-row rf-items-center rf-justify-between", children: [
      /* @__PURE__ */ jsx31(Button, { variant: "ghost", size: "sm", onClick: onBack, children: "Back" }),
      /* @__PURE__ */ jsx31(DialogTitle, { children: "AI Review" })
    ] }),
    aiReviewText ? /* @__PURE__ */ jsx31(
      "div",
      {
        className: "rf-h-64 rf-overflow-y-auto rf-prose rf-max-w-none rf-mt-2",
        dangerouslySetInnerHTML: { __html: html }
      }
    ) : /* @__PURE__ */ jsx31("div", { className: "rf-h-64 rf-overflow-y-auto rf-prose rf-max-w-none rf-mt-2", children: /* @__PURE__ */ jsxs23("div", { className: "rf-flex rf-items-center rf-justify-center rf-h-full", children: [
      /* @__PURE__ */ jsxs23(
        "svg",
        {
          className: "rf-animate-spin rf-h-6 rf-w-6 rf-text-zinc-400 rf-mr-2",
          xmlns: "http://www.w3.org/2000/svg",
          fill: "none",
          viewBox: "0 0 24 24",
          "aria-hidden": "true",
          children: [
            /* @__PURE__ */ jsx31(
              "circle",
              {
                className: "rf-opacity-25",
                cx: "12",
                cy: "12",
                r: "10",
                stroke: "currentColor",
                strokeWidth: "4"
              }
            ),
            /* @__PURE__ */ jsx31(
              "path",
              {
                className: "rf-opacity-75",
                fill: "currentColor",
                d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              }
            )
          ]
        }
      ),
      /* @__PURE__ */ jsx31("span", { children: "Loading..." })
    ] }) })
  ] });
};

// lib/components/AiReviewDialog/AiReviewDialog.tsx
import { jsx as jsx32, jsxs as jsxs24 } from "react/jsx-runtime";
var AiReviewDialog = ({
  isOpen,
  onClose,
  packageName
}) => {
  const [stage, setStage] = useState19(
    "list_reviews"
  );
  const [selectedReview, setSelectedReview] = useState19(null);
  const handleSelect = (review) => {
    setSelectedReview(review);
    setStage("view_review");
  };
  return /* @__PURE__ */ jsx32(
    Dialog,
    {
      open: isOpen,
      onOpenChange: (open) => {
        if (!open) {
          setStage("list_reviews");
          setSelectedReview(null);
          onClose();
        }
      },
      children: /* @__PURE__ */ jsxs24(DialogContent, { className: "rf-max-w-2xl", children: [
        stage === "list_reviews" && /* @__PURE__ */ jsx32(
          AiReviewListView,
          {
            packageName,
            onSelectReview: handleSelect
          }
        ),
        stage === "view_review" && selectedReview && /* @__PURE__ */ jsx32(
          AiReviewViewView,
          {
            review: selectedReview,
            onBack: () => setStage("list_reviews")
          }
        )
      ] })
    }
  );
};

// lib/components/FileMenuLeftHeader.tsx
import { Toaster } from "react-hot-toast";

// lib/components/OrderDialog/OrderDialog.tsx
import { QueryClient, QueryClientProvider } from "react-query";

// lib/components/OrderDialog/InitialOrder.tsx
import { Loader2 as Loader26 } from "lucide-react";
import { GitHubLogoIcon as GitHubLogoIcon2 } from "@radix-ui/react-icons";
import { useEffect as useEffect15, useMemo as useMemo7, useState as useState20 } from "react";

// lib/components/OrderDialog/VendorQuoteCard.tsx
import { Truck, Package } from "lucide-react";
import { jsx as jsx33, jsxs as jsxs25 } from "react/jsx-runtime";
function VendorQuoteCard({
  orderQuote,
  selectedShippingCarrier,
  onSelectShippingCarrier,
  lowestShippingCarrierCost
}) {
  const selectedShipping = selectedShippingCarrier ? orderQuote.shipping_options.find(
    (ship) => ship.carrier === selectedShippingCarrier
  ) : null;
  return /* @__PURE__ */ jsxs25("div", { className: "rf-rounded-xl rf-bg-white rf-shadow-lg rf-border rf-border-gray-200", children: [
    /* @__PURE__ */ jsxs25("div", { className: "rf-flex rf-items-center rf-justify-between rf-px-6 rf-pt-4 rf-pb-2", children: [
      /* @__PURE__ */ jsxs25("div", { className: "rf-flex rf-items-center rf-gap-2", children: [
        /* @__PURE__ */ jsx33(Package, { className: "rf-w-6 rf-h-6 rf-text-blue-500" }),
        /* @__PURE__ */ jsx33("span", { className: "rf-font-semibold rf-text-lg", children: orderQuote.vendor_name.toUpperCase() })
      ] }),
      /* @__PURE__ */ jsxs25("div", { className: "rf-flex rf-flex-col rf-items-end", children: [
        /* @__PURE__ */ jsx33("span", { className: "rf-text-gray-500 rf-text-sm", children: "Fully Assembled PCB" }),
        /* @__PURE__ */ jsxs25("div", { className: "rf-flex rf-items-center rf-gap-2", children: [
          /* @__PURE__ */ jsxs25("span", { className: "rf-text-gray-400 rf-line-through rf-text-base", children: [
            "$",
            lowestShippingCarrierCost.toFixed(2)
          ] }),
          /* @__PURE__ */ jsx33("span", { className: "rf-font-bold rf-text-xl rf-text-blue-600", children: "$50.00" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx33("hr", { className: "rf-border-gray-200" }),
    /* @__PURE__ */ jsxs25("div", { className: "rf-px-6 rf-pt-4 rf-pb-2", children: [
      /* @__PURE__ */ jsx33("div", { className: "rf-mb-2 rf-text-sm rf-font-bold rf-text-gray-700", children: "Shipping Options:" }),
      /* @__PURE__ */ jsx33("div", { className: "rf-flex rf-flex-col rf-gap-2 rf-mb-2", children: orderQuote.shipping_options.map((ship, idx) => /* @__PURE__ */ jsxs25(
        "button",
        {
          type: "button",
          className: cn(
            "rf-flex rf-items-center rf-gap-3 rf-px-4 rf-py-3 rf-rounded-lg rf-border rf-min-w-[148px] rf-transition-colors rf-bg-white",
            selectedShippingCarrier === ship.carrier ? "rf-border-blue-600 rf-bg-blue-50 rf-ring-2 rf-ring-blue-500" : "rf-border-gray-300 rf-bg-gray-50 hover:rf-border-blue-300"
          ),
          onClick: () => onSelectShippingCarrier(ship.carrier),
          children: [
            /* @__PURE__ */ jsx33(Truck, { className: "rf-w-5 rf-h-5 rf-text-yellow-500" }),
            /* @__PURE__ */ jsxs25("div", { className: "rf-text-left rf-flex-1", children: [
              /* @__PURE__ */ jsx33("div", { className: "rf-leading-tight rf-font-medium", children: ship.carrier }),
              /* @__PURE__ */ jsx33("div", { className: "rf-text-xs rf-text-gray-500", children: "Express, 5-12 days" })
            ] }),
            /* @__PURE__ */ jsxs25("div", { className: "rf-flex rf-flex-col rf-items-end rf-ml-2", children: [
              /* @__PURE__ */ jsxs25("span", { className: "rf-text-gray-400 rf-line-through rf-text-sm", children: [
                "$",
                ship.cost.toFixed(2)
              ] }),
              /* @__PURE__ */ jsx33("span", { className: "rf-text-xs rf-text-blue-600 rf-font-medium", children: "waived" })
            ] })
          ]
        },
        ship.carrier + idx
      )) })
    ] }),
    selectedShippingCarrier !== null && selectedShipping && /* @__PURE__ */ jsx33("div", { className: "rf-px-6 rf-pb-4 rf-pt-2", children: /* @__PURE__ */ jsxs25("div", { className: "rf-flex rf-justify-between rf-items-center rf-mt-3 rf-mb-2", children: [
      /* @__PURE__ */ jsx33("span", { className: "rf-text-gray-700 rf-font-bold", children: "Total (incl. shipping):" }),
      /* @__PURE__ */ jsxs25("div", { className: "rf-flex rf-flex-col rf-items-end", children: [
        /* @__PURE__ */ jsxs25("div", { className: "rf-text-gray-400 rf-line-through rf-text-base", children: [
          "$",
          (orderQuote.total_cost_without_shipping + selectedShipping.cost).toFixed(2)
        ] }),
        /* @__PURE__ */ jsx33("div", { className: "rf-flex rf-items-center", children: /* @__PURE__ */ jsx33("span", { className: "rf-font-bold rf-text-xl rf-text-blue-600", children: "$50.00" }) })
      ] })
    ] }) })
  ] });
}

// lib/hooks/use-create-order-quote.ts
import { useMutation } from "react-query";

// lib/api/order-quotes.ts
import { HTTPError as HTTPError2 } from "ky";
var createOrderQuote = async (packageReleaseId) => {
  try {
    const { order_quote_id } = await registryKy.post("order_quotes/create", {
      json: {
        package_release_id: packageReleaseId,
        vendor_name: "jlcpcb"
        // TODO: Remove this once we have more vendor
      }
    }).json();
    return {
      order_quote_id
    };
  } catch (error) {
    if (error instanceof HTTPError2) {
      const errorBody = await error.response.json();
      throw {
        error: {
          message: errorBody.message,
          error_code: errorBody.error_code
        }
      };
    }
    throw error;
  }
};
var getOrderQuote = async (orderQuoteId) => {
  const { order_quote } = await registryKy.get(`order_quotes/get`, {
    searchParams: {
      order_quote_id: orderQuoteId
    }
  }).json();
  return order_quote;
};

// lib/hooks/use-create-order-quote.ts
import { useQueryClient } from "react-query";
var useCreateOrderQuote = () => {
  const queryClient2 = useQueryClient();
  return useMutation({
    mutationKey: ["createOrderQuote"],
    mutationFn: (packageReleaseId) => createOrderQuote(packageReleaseId),
    onSuccess: (data) => {
      queryClient2.invalidateQueries(["getOrderQuote", data.order_quote_id]);
    }
  });
};

// lib/hooks/use-order-quote-polling.ts
import { useQuery } from "react-query";
var useOrderQuotePolling = (orderQuoteId) => {
  const {
    data: orderQuote,
    error,
    status
  } = useQuery(
    ["getOrderQuote", orderQuoteId],
    () => getOrderQuote(orderQuoteId || ""),
    {
      enabled: !!orderQuoteId,
      refetchInterval: (data) => {
        if (data?.is_completed || data?.has_error) {
          return false;
        }
        return 4e3;
      },
      refetchIntervalInBackground: true,
      retry: false
    }
  );
  return {
    status: status === "loading" ? "loading" : status === "error" ? "error" : "success",
    data: orderQuote ?? null,
    error: error instanceof Error ? error : null
  };
};

// lib/components/OrderDialog/InitialOrder.tsx
import { Fragment as Fragment7, jsx as jsx34, jsxs as jsxs26 } from "react/jsx-runtime";
var InitialOrderScreen = ({
  onCancel,
  packageReleaseId,
  signIn,
  isLoggedIn
}) => {
  const [selectedShippingCarrier, setSelectedShippingCarrier] = useState20(null);
  const [orderQuoteId, setOrderQuoteId] = useState20(null);
  const { mutate: createOrderQuote2, error: createOrderQuoteError } = useCreateOrderQuote();
  useEffect15(() => {
    if (packageReleaseId) {
      createOrderQuote2(packageReleaseId, {
        onSuccess: (data) => {
          setOrderQuoteId(data.order_quote_id);
        }
      });
    }
  }, [packageReleaseId]);
  const { data: orderQuote } = useOrderQuotePolling(orderQuoteId || void 0);
  const errorMessage = createOrderQuoteError && createOrderQuoteError.error?.message || orderQuote?.error?.message;
  useErrorTelemetry({ errorMessage });
  const redirectToStripeCheckout = async (orderQuoteId2) => {
    const stripeCheckoutBaseUrl = getWindowVar(
      "TSCIRCUIT_STRIPE_CHECKOUT_BASE_URL"
    );
    window.location.href = `${stripeCheckoutBaseUrl}?client_reference_id=${orderQuoteId2}&shipping_option=${selectedShippingCarrier}`;
  };
  useEffect15(() => {
    if (selectedShippingCarrier === null && orderQuote && Array.isArray(orderQuote.shipping_options) && orderQuote.shipping_options.length > 0) {
      const lowest = orderQuote.shipping_options.reduce(
        (min, curr) => curr.cost < min.cost ? curr : min,
        orderQuote.shipping_options[0]
      );
      setSelectedShippingCarrier(lowest?.carrier || null);
    }
  }, [orderQuote]);
  const lowestShippingCarrierCost = useMemo7(() => {
    return orderQuote && Array.isArray(orderQuote.shipping_options) && orderQuote.shipping_options.length > 0 ? orderQuote.shipping_options.reduce(
      (min, curr) => curr.cost < min.cost ? curr : min,
      orderQuote.shipping_options[0]
    ).cost : 0;
  }, [orderQuote]);
  const isNoTokenError = createOrderQuoteError && createOrderQuoteError.error?.error_code?.includes("no_token") || orderQuote?.error?.error_code?.includes("no_token") && signIn;
  if (!isLoggedIn || isNoTokenError) {
    return /* @__PURE__ */ jsx34(SignInView, { signIn });
  }
  return /* @__PURE__ */ jsxs26(
    "div",
    {
      className: "\n      rf-w-full rf-mx-auto rf-bg-white rf-rounded-2xl \n      rf-p-4 sm:rf-p-6 md:rf-p-8 \n      rf-flex rf-flex-col rf-gap-3\n      rf-max-w-full sm:rf-max-w-md md:rf-max-w-lg lg:rf-max-w-xl\n    ",
      children: [
        /* @__PURE__ */ jsx34("h2", { className: "rf-text-xl sm:rf-text-2xl md:rf-text-3xl rf-font-bold rf-text-center", children: "Order PCB" }),
        !(createOrderQuoteError || orderQuote?.error) && (!orderQuoteId || !orderQuote || orderQuote?.is_processing) && /* @__PURE__ */ jsx34(LoadingMessage, { message: "Fetching quotes..." }),
        (createOrderQuoteError || orderQuote?.error) && /* @__PURE__ */ jsx34(
          ErrorMessage,
          {
            message: createOrderQuoteError && createOrderQuoteError.error?.message || orderQuote?.error?.message || "Failed to fetch quotes"
          }
        ),
        orderQuote?.is_completed && !createOrderQuoteError && !orderQuote?.error && Array.isArray(orderQuote?.shipping_options) && orderQuote.shipping_options.length > 0 && /* @__PURE__ */ jsxs26(Fragment7, { children: [
          /* @__PURE__ */ jsx34("div", { className: "rf-bg-blue-100 rf-text-blue-800 rf-p-2 sm:rf-p-3 rf-rounded-md rf-text-center rf-text-xs sm:rf-text-sm", children: "This board is eligible for the tscircuit Flat Fee" }),
          /* @__PURE__ */ jsx34(
            VendorQuoteCard,
            {
              orderQuote,
              selectedShippingCarrier,
              onSelectShippingCarrier: setSelectedShippingCarrier,
              lowestShippingCarrierCost: lowestShippingCarrierCost + (orderQuote.total_cost_without_shipping || 0)
            },
            orderQuote?.order_quote_id
          )
        ] }),
        /* @__PURE__ */ jsxs26("div", { className: "rf-flex rf-flex-col-reverse sm:rf-flex-row rf-justify-between rf-mt-5 rf-gap-3 sm:rf-gap-4", children: [
          /* @__PURE__ */ jsx34(
            Button,
            {
              variant: "outline",
              type: "button",
              className: "rf-w-full sm:rf-w-1/2 rf-border-red-500 rf-text-red-500 rf-hover:bg-red-50 rf-hover:text-red-600 rf-text-sm sm:rf-text-base",
              onClick: onCancel,
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx34(
            Button,
            {
              type: "button",
              className: "rf-w-full sm:rf-w-1/2 rf-bg-blue-600 rf-hover:bg-blue-700 rf-text-sm sm:rf-text-base",
              disabled: selectedShippingCarrier === null,
              onClick: () => {
                if (selectedShippingCarrier === null) {
                  toast.error("Please select a shipping option.");
                  return;
                }
                if (orderQuote) {
                  redirectToStripeCheckout(orderQuote.order_quote_id);
                }
              },
              children: "Continue"
            }
          )
        ] }),
        /* @__PURE__ */ jsx34("div", { className: "rf-text-xs rf-text-center rf-text-gray-400 rf-mt-3 sm:rf-mt-4 rf-px-2", children: "Pricing may vary based on specifications." })
      ]
    }
  );
};
var LoadingMessage = ({ message }) => /* @__PURE__ */ jsxs26("div", { className: "rf-flex rf-flex-col rf-items-center rf-gap-2 rf-my-12", children: [
  /* @__PURE__ */ jsx34(Loader26, { className: "rf-animate-spin rf-w-8 rf-h-8 rf-text-gray-400" }),
  /* @__PURE__ */ jsx34("p", { className: "rf-text-gray-600", children: message })
] });
var ErrorMessage = ({ message }) => /* @__PURE__ */ jsx34("div", { className: "rf-text-red-600 rf-text-center rf-py-12", children: message });
var SignInView = ({ signIn }) => /* @__PURE__ */ jsxs26(
  "div",
  {
    className: "\n    rf-w-full rf-mx-auto rf-bg-white rf-rounded-2xl \n    rf-p-4 sm:rf-p-6 md:rf-p-8 \n    rf-flex rf-flex-col rf-gap-3\n    rf-max-w-full sm:rf-max-w-md md:rf-max-w-lg lg:rf-max-w-xl\n  ",
    children: [
      /* @__PURE__ */ jsx34("h2", { className: "rf-text-xl sm:rf-text-2xl md:rf-text-3xl rf-font-bold rf-text-center", children: "Order PCB" }),
      /* @__PURE__ */ jsxs26("div", { className: "rf-flex rf-flex-col rf-items-center rf-gap-4 rf-py-4 sm:rf-py-6 md:rf-py-8", children: [
        /* @__PURE__ */ jsx34("p", { className: "rf-text-gray-600 rf-text-sm sm:rf-text-base rf-text-center rf-px-2", children: "Please sign in to continue" }),
        /* @__PURE__ */ jsxs26(
          Button,
          {
            onClick: signIn,
            className: "rf-flex rf-items-center rf-gap-2 rf-text-sm sm:rf-text-base rf-px-4 sm:rf-px-6",
            children: [
              /* @__PURE__ */ jsx34(GitHubLogoIcon2, { className: "rf-w-4 rf-h-4 sm:rf-w-5 sm:rf-h-5" }),
              "Sign in with GitHub"
            ]
          }
        )
      ] })
    ]
  }
);

// lib/components/OrderDialog/OrderDialog.tsx
import { jsx as jsx35 } from "react/jsx-runtime";
var queryClient = new QueryClient();
var OrderDialog = ({
  isOpen,
  onClose,
  stage,
  setStage,
  circuitJson,
  packageReleaseId,
  signIn,
  isLoggedIn
}) => {
  return /* @__PURE__ */ jsx35(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsx35(
    Dialog,
    {
      open: isOpen,
      onOpenChange: (open) => {
        if (!open) onClose();
      },
      children: /* @__PURE__ */ jsx35(
        DialogContent,
        {
          className: "\n          !rf-p-0 !rf-z-[101] rf-rounded-md\n          !rf-w-[95vw] !rf-max-w-[95vw]\n          sm:rf-w-[90vw] sm:rf-max-w-[500px]\n          md:rf-w-auto md:rf-max-w-[660px]\n          lg:rf-max-w-[720px]\n          xl:rf-max-w-[800px]\n          rf-max-h-[90vh] rf-overflow-y-auto\n        ",
          children: /* @__PURE__ */ jsx35("div", { className: "rf-relative rf-w-full", children: stage === "initial" && /* @__PURE__ */ jsx35(
            InitialOrderScreen,
            {
              onCancel: onClose,
              packageReleaseId: packageReleaseId ?? "",
              signIn: signIn ?? (() => {
              }),
              isLoggedIn
            }
          ) })
        }
      )
    }
  ) });
};

// lib/components/OrderDialog/CliOrderDialog.tsx
import { jsx as jsx36 } from "react/jsx-runtime";
var CliOrderDialog = ({
  isOpen,
  onClose,
  stage,
  setStage,
  signIn,
  isLoggedIn
}) => {
  const circuitJson = useRunFrameStore((state) => state.circuitJson);
  return /* @__PURE__ */ jsx36(
    OrderDialog,
    {
      signIn,
      isOpen,
      onClose,
      stage,
      setStage,
      circuitJson,
      isLoggedIn: isLoggedIn ?? false
    }
  );
};

// lib/components/OrderDialog/useOrderDialog.tsx
import { useState as useState21, useMemo as useMemo8, useCallback as useCallback7 } from "react";
import { jsx as jsx37 } from "react/jsx-runtime";
var useOrderDialogCli = () => {
  const [isOpen, setIsOpen] = useState21(false);
  const [stage, setStage] = useState21("initial");
  const handleClose = () => {
    setIsOpen(false);
    setStage("initial");
  };
  return {
    isOpen,
    stage,
    open: () => setIsOpen(true),
    close: handleClose,
    setStage,
    OrderDialog: CliOrderDialog
  };
};
var useOrderDialog = ({
  onSignIn,
  isLoggedIn,
  packageReleaseId
}) => {
  useStyles();
  const [isOpen, setIsOpen] = useState21(false);
  const [stage, setStage] = useState21("initial");
  const handleClose = useCallback7(() => {
    setIsOpen(false);
    setStage("initial");
  }, []);
  const open = useCallback7(() => setIsOpen(true), []);
  const MemoizedOrderDialog = useMemo8(() => {
    return (props) => /* @__PURE__ */ jsx37(
      OrderDialog,
      {
        ...props,
        signIn: onSignIn,
        isLoggedIn,
        packageReleaseId
      }
    );
  }, [isLoggedIn, packageReleaseId]);
  return {
    isOpen,
    stage,
    open,
    close: handleClose,
    setStage,
    OrderDialog: MemoizedOrderDialog
  };
};

// lib/components/useBugReportDialog.tsx
import clsx2 from "clsx";
import { HTTPError as HTTPError3 } from "ky";
import {
  useCallback as useCallback8,
  useEffect as useEffect16,
  useMemo as useMemo9,
  useRef as useRef4,
  useState as useState22
} from "react";
import { Fragment as Fragment8, jsx as jsx38, jsxs as jsxs27 } from "react/jsx-runtime";
async function getFilesFromServer() {
  const response = await fetch(`${API_BASE}/files/list`);
  const { file_list } = await response.json();
  const fileMap = /* @__PURE__ */ new Map();
  for (const file of file_list) {
    const fileResponse = await fetch(
      `${API_BASE}/files/get?file_path=${encodeURIComponent(file.file_path)}`
    );
    const fileData = await fileResponse.json();
    if (fileData.file?.text_content || fileData.file?.binary_content_b64) {
      fileMap.set(file.file_path, {
        text_content: fileData.file.text_content,
        binary_content_b64: fileData.file.binary_content_b64
      });
    }
  }
  return fileMap;
}
var BUG_REPORT_VIEW_BASE_URL = "https://api.tscircuit.com/bug_reports/view?bug_report_id=";
var buildBugReportUrl = (bugReportId) => `${BUG_REPORT_VIEW_BASE_URL}${bugReportId}`;
var useBugReportDialog = (options) => {
  const [isOpen, setIsOpen] = useState22(false);
  const [isSubmitting, setIsSubmitting] = useState22(false);
  const [errorMessage, setErrorMessage] = useState22(null);
  const [uploadProgress, setUploadProgress] = useState22(
    null
  );
  const [uploadErrors, setUploadErrors] = useState22([]);
  const textareaRef = useRef4(null);
  const [successState, setSuccessState] = useState22(null);
  const [bugReportFileCount, setBugReportFileCount] = useState22(0);
  const onLoginRequired = options?.onLoginRequired;
  const isSessionLoggedIn = useMemo9(() => {
    if (hasRegistryToken()) return true;
    if (typeof document === "undefined") return false;
    return document.cookie.split(";").some((cookie) => cookie.trim().startsWith("session="));
  }, [isOpen]);
  useEffect16(() => {
    if (isOpen && !successState && textareaRef.current) {
      const globalError = typeof window !== "undefined" ? window.__TSCIRCUIT_LAST_EXECUTION_ERROR : void 0;
      if (globalError) {
        textareaRef.current.value = `I'm getting this execution error:

${globalError}`;
      }
    }
  }, [isOpen, successState]);
  useEffect16(() => {
    if (isOpen && !successState) {
      getFilesFromServer().then((files) => {
        setBugReportFileCount(files.size);
      }).catch((error) => {
        console.error("Failed to fetch file count", error);
        setBugReportFileCount(0);
      });
    }
  }, [isOpen, successState]);
  const openBugReportDialog = useCallback8(() => {
    setErrorMessage(null);
    setSuccessState(null);
    setUploadProgress(null);
    setUploadErrors([]);
    if (textareaRef.current) {
      textareaRef.current.value = "";
    }
    setIsOpen(true);
  }, []);
  const closeBugReportDialog = useCallback8(() => {
    setIsOpen(false);
  }, []);
  const handleConfirmBugReport = useCallback8(async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setUploadProgress(null);
    setUploadErrors([]);
    const registryKy2 = getRegistryKy();
    const userText = textareaRef.current?.value || "";
    try {
      const filesFromServer = await getFilesFromServer();
      if (filesFromServer.size === 0) {
        toast.error("No project files available to include in the bug report");
        setIsSubmitting(false);
        return;
      }
      const deleteAt = new Date(Date.now() + 24 * 60 * 60 * 1e3).toISOString();
      const createResponse = await registryKy2.post("bug_reports/create", {
        json: {
          text: userText.trim() || void 0,
          is_auto_deleted: true,
          delete_at: deleteAt
        }
      }).json();
      const bugReportId = createResponse.bug_report.bug_report_id;
      const fileEntries = Array.from(filesFromServer.entries());
      const errors = [];
      for (let i = 0; i < fileEntries.length; i++) {
        const [filePath, fileContent] = fileEntries[i];
        setUploadProgress({
          current: i + 1,
          total: fileEntries.length,
          currentFile: filePath
        });
        try {
          const uploadPayload = {
            bug_report_id: bugReportId,
            file_path: filePath
          };
          if (fileContent.text_content) {
            uploadPayload.content_text = fileContent.text_content;
          }
          if (fileContent.binary_content_b64) {
            uploadPayload.content_base64 = fileContent.binary_content_b64;
          }
          await registryKy2.post("bug_reports/upload_file", {
            json: uploadPayload
          });
        } catch (uploadError) {
          const errorMsg = uploadError instanceof HTTPError3 ? `HTTP ${uploadError.response.status}` : uploadError instanceof Error ? uploadError.message : "Upload failed";
          errors.push({ filePath, message: errorMsg });
          setUploadErrors([...errors]);
        }
      }
      setUploadProgress(null);
      const bugReportUrl = buildBugReportUrl(bugReportId);
      setSuccessState({ bugReportUrl });
    } catch (error) {
      console.error("Failed to submit bug report", error);
      if (error instanceof HTTPError3) {
        if (error.response.status === 401) {
          if (isSessionLoggedIn) {
            const message = "Your session has expired. Please sign in again to continue.";
            setErrorMessage(message);
            toast.error(message);
            if (onLoginRequired) {
              closeBugReportDialog();
              onLoginRequired();
            }
          } else {
            const message = "You must be logged in to report a bug. Please sign in via cli and try again.";
            setErrorMessage(message);
            toast.error(message);
            setTimeout(() => {
              if (onLoginRequired) {
                closeBugReportDialog();
                onLoginRequired();
              }
            }, 1e3);
          }
        } else {
          const message = `Failed to submit bug report (${error.response.status})`;
          setErrorMessage(message);
          toast.error(message);
        }
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
        toast.error(error.message);
      } else {
        const message = "Failed to submit bug report";
        setErrorMessage(message);
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSessionLoggedIn, onLoginRequired]);
  const BugReportDialog = useMemo9(() => {
    const progressPercent = uploadProgress ? Math.round(uploadProgress.current / uploadProgress.total * 100) : 0;
    return /* @__PURE__ */ jsx38(
      AlertDialog,
      {
        open: isOpen,
        onOpenChange: (open) => {
          if (!open) {
            if (!isSubmitting) {
              closeBugReportDialog();
            }
          } else {
            setErrorMessage(null);
            setSuccessState(null);
            setUploadProgress(null);
            setUploadErrors([]);
            setIsOpen(true);
          }
        },
        children: /* @__PURE__ */ jsxs27(AlertDialogContent, { children: [
          /* @__PURE__ */ jsxs27(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsx38(AlertDialogTitle, { children: successState ? "Bug Report Created" : "Report Bug" }),
            /* @__PURE__ */ jsx38(AlertDialogDescription, { asChild: true, children: successState ? /* @__PURE__ */ jsxs27("div", { className: "rf-text-left rf-space-y-3 rf-text-sm", children: [
              /* @__PURE__ */ jsx38("p", { children: "Bug report created successfully." }),
              uploadErrors.length > 0 && /* @__PURE__ */ jsxs27("div", { className: "rf-bg-red-50 rf-border rf-border-red-200 rf-rounded rf-p-2 rf-max-h-28 rf-overflow-y-auto rf-overflow-x-hidden", children: [
                /* @__PURE__ */ jsxs27("p", { className: "rf-text-red-700 rf-font-medium rf-text-xs rf-mb-1", children: [
                  uploadErrors.length,
                  " file(s) failed:"
                ] }),
                uploadErrors.map((err, idx) => /* @__PURE__ */ jsxs27(
                  "div",
                  {
                    className: "rf-text-red-600 rf-text-xs rf-mb-0.5",
                    title: `${err.filePath}: ${err.message}`,
                    children: [
                      /* @__PURE__ */ jsx38("span", { className: "rf-font-medium rf-break-all", children: err.filePath.split("/").pop() }),
                      /* @__PURE__ */ jsx38("span", { className: "rf-text-red-500 rf-block rf-truncate", children: err.message })
                    ]
                  },
                  idx
                ))
              ] }),
              /* @__PURE__ */ jsx38("div", { children: /* @__PURE__ */ jsx38(
                "a",
                {
                  className: "rf-text-blue-600 hover:rf-underline",
                  href: successState.bugReportUrl,
                  target: "_blank",
                  rel: "noreferrer",
                  children: "View bug report"
                }
              ) }),
              /* @__PURE__ */ jsxs27("p", { children: [
                "Please share this link privately with tscircuit staff so we can help debug. Join the",
                /* @__PURE__ */ jsx38(
                  "a",
                  {
                    className: "rf-ml-1 rf-text-blue-600 hover:rf-underline",
                    href: "https://tscircuit.com/join",
                    target: "_blank",
                    rel: "noreferrer",
                    children: "tscircuit Discord"
                  }
                ),
                "."
              ] })
            ] }) : /* @__PURE__ */ jsx38("div", { className: "rf-text-left rf-space-y-3 rf-text-sm", children: uploadProgress ? /* @__PURE__ */ jsxs27("div", { className: "rf-space-y-2 rf-overflow-hidden", children: [
              /* @__PURE__ */ jsxs27("div", { className: "rf-flex rf-justify-between rf-text-xs", children: [
                /* @__PURE__ */ jsx38("span", { children: "Uploading files..." }),
                /* @__PURE__ */ jsxs27("span", { children: [
                  uploadProgress.current,
                  "/",
                  uploadProgress.total
                ] })
              ] }),
              /* @__PURE__ */ jsx38("div", { className: "rf-w-full rf-h-2 rf-bg-gray-200 rf-rounded-full rf-overflow-hidden", children: /* @__PURE__ */ jsx38(
                "div",
                {
                  className: "rf-h-full rf-bg-blue-500 rf-transition-all rf-duration-150",
                  style: { width: `${progressPercent}%` }
                }
              ) }),
              /* @__PURE__ */ jsx38("p", { className: "rf-text-xs rf-text-gray-500 rf-break-all rf-truncate rf-w-full rf-max-w-full", children: `${uploadProgress.currentFile.slice(0, 60)}${uploadProgress.currentFile.length > 60 ? "..." : ""}` }),
              uploadErrors.length > 0 && /* @__PURE__ */ jsx38("div", { className: "rf-bg-red-50 rf-border rf-border-red-200 rf-rounded rf-p-2 rf-max-h-20 rf-overflow-y-auto rf-overflow-x-hidden", children: uploadErrors.map((err, idx) => /* @__PURE__ */ jsxs27(
                "div",
                {
                  className: "rf-text-red-600 rf-text-xs rf-mb-0.5",
                  title: `${err.filePath}: ${err.message}`,
                  children: [
                    /* @__PURE__ */ jsx38("span", { className: "rf-font-medium rf-break-all", children: err.filePath.split("/").pop() }),
                    /* @__PURE__ */ jsx38("span", { className: "rf-text-red-500 rf-block rf-truncate", children: err.message })
                  ]
                },
                idx
              )) })
            ] }) : /* @__PURE__ */ jsxs27(Fragment8, { children: [
              /* @__PURE__ */ jsxs27("p", { children: [
                "Reporting a bug will upload your entire project",
                bugReportFileCount > 0 ? ` (${bugReportFileCount} file${bugReportFileCount === 1 ? "" : "s"})` : "",
                " ",
                "to tscircuit support."
              ] }),
              /* @__PURE__ */ jsxs27("div", { className: "rf-space-y-2", children: [
                /* @__PURE__ */ jsx38(
                  "label",
                  {
                    htmlFor: "bug-description",
                    className: "rf-block rf-font-medium",
                    children: "Description (optional)"
                  }
                ),
                /* @__PURE__ */ jsx38(
                  "textarea",
                  {
                    ref: textareaRef,
                    id: "bug-description",
                    className: "rf-w-full rf-min-h-[100px] rf-px-3 rf-py-2 rf-text-sm rf-border rf-border-gray-300 rf-rounded-md focus:rf-outline-none focus:rf-ring-2 focus:rf-ring-blue-500",
                    placeholder: "Describe the issue you're experiencing...",
                    disabled: isSubmitting
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs27("p", { children: [
                "Share the generated bug report link privately with tscircuit staff so we can help debug your issue. You can also reach out on our",
                /* @__PURE__ */ jsx38(
                  "a",
                  {
                    className: "rf-ml-1 rf-text-blue-600 hover:rf-underline",
                    href: "https://tscircuit.com/join",
                    target: "_blank",
                    rel: "noreferrer",
                    children: "Discord community"
                  }
                ),
                "."
              ] }),
              !isSessionLoggedIn && /* @__PURE__ */ jsx38("p", { className: "rf-text-red-600", children: "You appear to be logged out. Please log in before reporting a bug or the upload will fail." }),
              errorMessage && /* @__PURE__ */ jsx38("p", { className: "rf-text-red-600", children: errorMessage })
            ] }) }) })
          ] }),
          /* @__PURE__ */ jsx38(AlertDialogFooter, { children: successState ? /* @__PURE__ */ jsx38(
            "button",
            {
              type: "button",
              className: buttonVariants(),
              onClick: () => {
                closeBugReportDialog();
              },
              children: "Close"
            }
          ) : /* @__PURE__ */ jsxs27(Fragment8, { children: [
            /* @__PURE__ */ jsx38(
              AlertDialogCancel,
              {
                disabled: isSubmitting,
                onClick: () => {
                  if (!isSubmitting) {
                    closeBugReportDialog();
                  }
                },
                children: "Cancel"
              }
            ),
            !isSessionLoggedIn && onLoginRequired ? /* @__PURE__ */ jsx38(
              "button",
              {
                type: "button",
                className: buttonVariants(),
                onClick: (event) => {
                  event.preventDefault();
                  closeBugReportDialog();
                  onLoginRequired();
                },
                children: "Sign In"
              }
            ) : /* @__PURE__ */ jsx38(
              "button",
              {
                type: "button",
                className: clsx2(
                  buttonVariants(),
                  isSubmitting && "rf-opacity-70 rf-cursor-not-allowed"
                ),
                disabled: isSubmitting,
                onClick: (event) => {
                  event.preventDefault();
                  void handleConfirmBugReport();
                },
                children: isSubmitting ? "Reporting..." : "Upload & Report"
              }
            )
          ] }) })
        ] })
      },
      "bug-report-dialog"
    );
  }, [
    isOpen,
    isSubmitting,
    closeBugReportDialog,
    errorMessage,
    successState,
    bugReportFileCount,
    isSessionLoggedIn,
    handleConfirmBugReport,
    onLoginRequired,
    uploadProgress,
    uploadErrors
  ]);
  return {
    BugReportDialog,
    openBugReportDialog
  };
};

// lib/components/LbrnExportOptionsDialog.tsx
import { useState as useState23 } from "react";
import { jsx as jsx39, jsxs as jsxs28 } from "react/jsx-runtime";
function LbrnExportOptionsDialog({
  open,
  onOpenChange,
  onExport
}) {
  const [includeSilkscreen, setIncludeSilkscreen] = useState23(false);
  const handleExport = () => {
    onExport({ includeSilkscreen });
    onOpenChange(false);
  };
  const handleCancel = () => {
    onOpenChange(false);
  };
  return /* @__PURE__ */ jsx39(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxs28(DialogContent, { children: [
    /* @__PURE__ */ jsxs28(DialogHeader, { children: [
      /* @__PURE__ */ jsx39(DialogTitle, { children: "LightBurn Export Options" }),
      /* @__PURE__ */ jsx39(DialogDescription, { children: "Configure export settings for PCB laser ablation with LightBurn" })
    ] }),
    /* @__PURE__ */ jsx39("div", { className: "rf-flex rf-flex-col rf-gap-4 rf-py-4", children: /* @__PURE__ */ jsxs28("div", { className: "rf-flex rf-items-center rf-space-x-2", children: [
      /* @__PURE__ */ jsx39(
        Checkbox,
        {
          id: "includeSilkscreen",
          checked: includeSilkscreen,
          onCheckedChange: (checked) => setIncludeSilkscreen(checked === true)
        }
      ),
      /* @__PURE__ */ jsx39(
        "label",
        {
          htmlFor: "includeSilkscreen",
          className: "rf-text-xs rf-font-medium rf-leading-none peer-disabled:rf-cursor-not-allowed peer-disabled:rf-opacity-70",
          children: "Include silkscreen layer"
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxs28(DialogFooter, { children: [
      /* @__PURE__ */ jsx39(Button, { variant: "outline", onClick: handleCancel, children: "Cancel" }),
      /* @__PURE__ */ jsx39(Button, { onClick: handleExport, children: "Export" })
    ] })
  ] }) });
}

// lib/utils/get-latest-autorouting-log-entry.ts
var BOARD_NUMBER_REGEX = /#(\d+)/;
var getBoardNumberFromKey = (key) => {
  const match = key.match(BOARD_NUMBER_REGEX);
  if (!match) return null;
  const boardNumber = Number.parseInt(match[1], 10);
  return Number.isFinite(boardNumber) ? boardNumber : null;
};
var getCreatedAtTimestamp = (createdAt) => {
  if (typeof createdAt === "number") {
    return Number.isFinite(createdAt) ? createdAt : null;
  }
  if (typeof createdAt === "string") {
    const timestamp = new Date(createdAt).getTime();
    return Number.isFinite(timestamp) ? timestamp : null;
  }
  return null;
};
var getLatestAutoroutingLogEntry = (autoroutingLog) => {
  if (!autoroutingLog) return null;
  let latestEntry = null;
  let latestBoardNumber = -1;
  let latestCreatedAt = -1;
  for (const [key, value] of Object.entries(autoroutingLog)) {
    const boardNumber = getBoardNumberFromKey(key);
    const createdAt = getCreatedAtTimestamp(value.createdAt);
    if (boardNumber !== null) {
      if (boardNumber > latestBoardNumber) {
        latestBoardNumber = boardNumber;
        latestEntry = { key, value };
      }
      continue;
    }
    if (latestBoardNumber !== -1) {
      continue;
    }
    if (createdAt !== null && createdAt > latestCreatedAt) {
      latestCreatedAt = createdAt;
      latestEntry = { key, value };
      continue;
    }
    if (!latestEntry) {
      latestEntry = { key, value };
    }
  }
  return latestEntry;
};

// lib/components/ExportAccessoryDialog.tsx
import { Download as Download2, LoaderCircle, PackageOpen } from "lucide-react";
import { useEffect as useEffect17, useState as useState24 } from "react";

// lib/components/ui/select.tsx
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check as Check4, ChevronDown as ChevronDown2, ChevronUp } from "lucide-react";
import * as React14 from "react";
import { jsx as jsx40, jsxs as jsxs29 } from "react/jsx-runtime";
var Select = SelectPrimitive.Root;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React14.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs29(
  SelectPrimitive.Trigger,
  {
    ref,
    className: cn(
      "rf-flex rf-h-10 rf-w-full rf-items-center rf-justify-between rf-rounded-md rf-border rf-border-input rf-bg-background rf-px-3 rf-py-2 rf-text-sm rf-ring-offset-background rf-placeholder:text-muted-foreground focus:rf-outline-none focus:rf-ring-2 focus:rf-ring-ring focus:rf-ring-offset-2 disabled:rf-cursor-not-allowed disabled:rf-opacity-50 [&>span]:rf-line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsx40(SelectPrimitive.Icon, { asChild: true, children: /* @__PURE__ */ jsx40(ChevronDown2, { className: "rf-h-4 rf-w-4 rf-opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx40(
  SelectPrimitive.ScrollUpButton,
  {
    ref,
    className: cn(
      "rf-flex rf-cursor-default rf-items-center rf-justify-center rf-py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx40(ChevronUp, { className: "rf-h-4 rf-w-4" })
  }
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx40(
  SelectPrimitive.ScrollDownButton,
  {
    ref,
    className: cn(
      "rf-flex rf-cursor-default rf-items-center rf-justify-center rf-py-1",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsx40(ChevronDown2, { className: "rf-h-4 rf-w-4" })
  }
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React14.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx40(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs29(
  SelectPrimitive.Content,
  {
    ref,
    className: cn(
      "rf-relative rf-z-[100] rf-max-h-96 rf-min-w-[8rem] rf-overflow-hidden rf-rounded-md rf-border rf-bg-white rf-text-black rf-shadow-md data-[state=open]:rf-animate-in data-[state=closed]:rf-animate-out data-[state=closed]:rf-fade-out-0 data-[state=open]:rf-fade-in-0 data-[state=closed]:rf-zoom-out-95 data-[state=open]:rf-zoom-in-95 data-[side=bottom]:rf-slide-in-from-top-2 data-[side=left]:rf-slide-in-from-right-2 data-[side=right]:rf-slide-in-from-left-2 data-[side=top]:rf-slide-in-from-bottom-2",
      position === "popper" && "data-[side=bottom]:rf-translate-y-1 data-[side=left]:-rf-translate-x-1 data-[side=right]:rf-translate-x-1 data-[side=top]:-rf-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsx40(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsx40(
        SelectPrimitive.Viewport,
        {
          className: cn(
            "rf-p-1",
            position === "popper" && "rf-h-[var(--radix-select-trigger-height)] rf-w-full rf-min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsx40(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx40(
  SelectPrimitive.Label,
  {
    ref,
    className: cn(
      "rf-py-1.5 rf-pl-8 rf-pr-2 rf-text-sm rf-font-semibold",
      className
    ),
    ...props
  }
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React14.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs29(
  SelectPrimitive.Item,
  {
    ref,
    className: cn(
      "rf-relative rf-flex rf-w-full rf-cursor-default rf-select-none rf-items-center rf-rounded-sm rf-py-1.5 rf-pl-8 rf-pr-2 rf-text-sm rf-text-gray-800 rf-outline-none focus:rf-bg-gray-100 focus:rf-text-gray-900 data-[disabled]:rf-pointer-events-none data-[disabled]:rf-opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsx40("span", { className: "rf-absolute rf-left-2 rf-flex rf-h-3.5 rf-w-3.5 rf-items-center rf-justify-center", children: /* @__PURE__ */ jsx40(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx40(Check4, { className: "rf-h-4 rf-w-4" }) }) }),
      /* @__PURE__ */ jsx40(SelectPrimitive.ItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React14.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx40(
  SelectPrimitive.Separator,
  {
    ref,
    className: cn("-rf-mx-1 rf-my-1 rf-h-px rf-bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// lib/components/ExportAccessoryDialog.tsx
import { jsx as jsx41, jsxs as jsxs30 } from "react/jsx-runtime";
var COMPONENT_BOX = "Component Box (3MF)";
var formatMillimetres = (value) => `${value.toFixed(1)} mm`;
function ExportAccessoryDialog({
  open,
  onOpenChange,
  circuitJson,
  projectName
}) {
  useStyles();
  const [selectedAccessory, setSelectedAccessory] = useState24("");
  const [generatedBox, setGeneratedBox] = useState24(null);
  const [previewUrl, setPreviewUrl] = useState24(null);
  const [isGenerating, setIsGenerating] = useState24(false);
  const [error, setError] = useState24(null);
  useEffect17(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);
  useEffect17(() => {
    if (!open || selectedAccessory !== COMPONENT_BOX) return;
    let cancelled = false;
    setIsGenerating(true);
    setGeneratedBox(null);
    setError(null);
    generateFdmComponentBox(circuitJson).then((result) => {
      if (cancelled) return;
      const pngBytes = Uint8Array.from(result.previewPng);
      setGeneratedBox(result);
      setPreviewUrl(
        URL.createObjectURL(
          new Blob([pngBytes.buffer], { type: "image/png" })
        )
      );
    }).catch((generationError) => {
      if (cancelled) return;
      setError(
        generationError instanceof Error ? generationError.message : String(generationError)
      );
    }).finally(() => {
      if (!cancelled) setIsGenerating(false);
    });
    return () => {
      cancelled = true;
    };
  }, [circuitJson, open, selectedAccessory]);
  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) {
      setSelectedAccessory("");
      setGeneratedBox(null);
      setPreviewUrl(null);
      setError(null);
      setIsGenerating(false);
    }
    onOpenChange(nextOpen);
  };
  return /* @__PURE__ */ jsx41(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxs30(DialogContent, { className: "rf-max-h-[90vh] rf-max-w-3xl rf-overflow-y-auto", children: [
    /* @__PURE__ */ jsxs30(DialogHeader, { children: [
      /* @__PURE__ */ jsx41(DialogTitle, { children: "Export Accessory" }),
      /* @__PURE__ */ jsx41(DialogDescription, { children: "Generate a printable accessory from the components in this circuit." })
    ] }),
    /* @__PURE__ */ jsxs30("div", { className: "rf-grid rf-gap-5 md:rf-grid-cols-[220px_1fr]", children: [
      /* @__PURE__ */ jsxs30("div", { className: "rf-space-y-2", children: [
        /* @__PURE__ */ jsx41(
          "label",
          {
            htmlFor: "accessory-select",
            className: "rf-text-sm rf-font-medium",
            children: "Accessory"
          }
        ),
        /* @__PURE__ */ jsxs30(
          Select,
          {
            value: selectedAccessory,
            onValueChange: (value) => setSelectedAccessory(value),
            children: [
              /* @__PURE__ */ jsx41(SelectTrigger, { id: "accessory-select", children: /* @__PURE__ */ jsx41(SelectValue, { placeholder: "Choose an accessory" }) }),
              /* @__PURE__ */ jsx41(SelectContent, { children: /* @__PURE__ */ jsx41(SelectItem, { value: COMPONENT_BOX, children: "Component Box" }) })
            ]
          }
        ),
        /* @__PURE__ */ jsx41("p", { className: "rf-text-xs rf-leading-relaxed rf-text-zinc-500", children: "Creates grouped compartments with raised refdes labels as a multi-material 3MF." })
      ] }),
      /* @__PURE__ */ jsxs30("div", { className: "rf-overflow-hidden rf-rounded-lg rf-border rf-border-zinc-200 rf-bg-zinc-50 dark:rf-border-zinc-800 dark:rf-bg-zinc-900", children: [
        /* @__PURE__ */ jsxs30("div", { className: "rf-flex rf-min-h-56 rf-items-center rf-justify-center", children: [
          !selectedAccessory && /* @__PURE__ */ jsxs30("div", { className: "rf-flex rf-flex-col rf-items-center rf-gap-3 rf-p-8 rf-text-center rf-text-zinc-500", children: [
            /* @__PURE__ */ jsx41(PackageOpen, { className: "rf-h-10 rf-w-10 rf-stroke-1" }),
            /* @__PURE__ */ jsx41("p", { className: "rf-text-sm", children: "Choose an accessory to generate its preview." })
          ] }),
          isGenerating && /* @__PURE__ */ jsxs30("div", { className: "rf-flex rf-flex-col rf-items-center rf-gap-3 rf-p-8 rf-text-zinc-600 dark:rf-text-zinc-300", children: [
            /* @__PURE__ */ jsx41(LoaderCircle, { className: "rf-h-8 rf-w-8 rf-animate-spin" }),
            /* @__PURE__ */ jsx41("p", { className: "rf-text-sm", children: "Generating component box\u2026" })
          ] }),
          error && !isGenerating && /* @__PURE__ */ jsxs30("div", { className: "rf-p-8 rf-text-center", children: [
            /* @__PURE__ */ jsx41("p", { className: "rf-text-sm rf-font-medium rf-text-red-600", children: "Could not generate the preview" }),
            /* @__PURE__ */ jsx41("p", { className: "rf-mt-1 rf-text-xs rf-text-red-500", children: error })
          ] }),
          previewUrl && generatedBox && !isGenerating && /* @__PURE__ */ jsx41(
            "img",
            {
              src: previewUrl,
              alt: "Generated component box preview",
              className: "rf-block rf-h-auto rf-max-h-[300px] rf-w-full rf-object-contain"
            }
          )
        ] }),
        generatedBox && !isGenerating && /* @__PURE__ */ jsxs30("div", { className: "rf-flex rf-flex-wrap rf-gap-x-5 rf-gap-y-1 rf-border-t rf-border-zinc-200 rf-bg-white rf-px-4 rf-py-3 rf-text-xs rf-text-zinc-600 dark:rf-border-zinc-800 dark:rf-bg-zinc-950 dark:rf-text-zinc-300", children: [
          /* @__PURE__ */ jsxs30("span", { children: [
            generatedBox.compartments.length,
            " compartments"
          ] }),
          /* @__PURE__ */ jsxs30("span", { children: [
            formatMillimetres(generatedBox.dimensions.width),
            " \xD7",
            " ",
            formatMillimetres(generatedBox.dimensions.depth),
            " \xD7",
            " ",
            formatMillimetres(generatedBox.dimensions.height)
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs30(DialogFooter, { children: [
      /* @__PURE__ */ jsx41(Button, { variant: "outline", onClick: () => handleOpenChange(false), children: "Cancel" }),
      /* @__PURE__ */ jsxs30(
        Button,
        {
          disabled: !generatedBox || isGenerating,
          onClick: () => {
            if (!generatedBox) return;
            downloadFdmComponentBox({ generatedBox, projectName });
          },
          children: [
            /* @__PURE__ */ jsx41(Download2, {}),
            "Download 3MF"
          ]
        }
      )
    ] })
  ] }) });
}

// lib/components/FileMenuLeftHeader.tsx
import { Fragment as Fragment9, jsx as jsx42, jsxs as jsxs31 } from "react/jsx-runtime";
var FileMenuLeftHeader = (props) => {
  const lastRunEvalVersion = useRunnerStore((s) => s.lastRunEvalVersion);
  const currentMainComponentPath = useRunFrameStore(
    (s) => s.currentMainComponentPath
  );
  const [snippetName, setSnippetName] = useState25(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState25(false);
  const [hasNeverBeenSaved, setHasNeverBeenSaved] = useState25(true);
  const [isSaving, setIsSaving] = useState25(false);
  const [requestToSaveSentAt, setRequestToSaveSentAt] = useState25(
    null
  );
  const [availableSnippets, setAvailableSnippets] = useState25(
    null
  );
  const [isSelectSnippetDialogOpen, setIsSelectSnippetDialogOpen] = useState25(false);
  const [notificationMessage, setNotificationMessage] = useState25(
    null
  );
  const [errorMessage, setErrorMessage] = useState25(null);
  const [isError, setIsError] = useState25(false);
  const [isExporting, setisExporting] = useState25(false);
  const [isLbrnDialogOpen, setIsLbrnDialogOpen] = useState25(false);
  const [isExportAccessoryDialogOpen, setIsExportAccessoryDialogOpen] = useState25(false);
  const [pendingLbrnExport, setPendingLbrnExport] = useState25(null);
  const orderDialog = useOrderDialogCli();
  const pushEvent = useRunFrameStore((state) => state.pushEvent);
  const recentEvents = useRunFrameStore((state) => state.recentEvents);
  const firstRenderTime = useMemo10(() => Date.now(), []);
  useEventHandler((event) => {
    if (new Date(event.created_at).valueOf() < firstRenderTime + 500) return;
    if (event.event_type === "FILE_UPDATED") {
      setHasUnsavedChanges(true);
      return;
    }
    if (event.event_type === "SNIPPET_SAVED") {
      setHasUnsavedChanges(false);
      setHasNeverBeenSaved(false);
      setNotificationMessage("Snippet saved successfully.");
      setIsError(false);
      return;
    }
    if (event.event_type === "REQUEST_EXPORT") {
      setisExporting(true);
      setNotificationMessage("Export processing...");
      setIsError(false);
    }
    if (event.event_type === "EXPORT_CREATED") {
      setNotificationMessage(`Export created: ${event.exportFilePath}`);
      setIsError(false);
      setisExporting(false);
    }
  });
  useEffect18(() => {
    if (!isSaving || requestToSaveSentAt === null) return;
    const eventsSinceRequestToSave = recentEvents.filter(
      (event) => new Date(event.created_at).valueOf() > requestToSaveSentAt
    );
    const saveFailedEvent = eventsSinceRequestToSave.find(
      (event) => event.event_type === "FAILED_TO_SAVE_SNIPPET"
    );
    const saveSuccessEvent = eventsSinceRequestToSave.find(
      (event) => event.event_type === "SNIPPET_SAVED"
    );
    if (saveFailedEvent) {
      setIsSaving(false);
      setRequestToSaveSentAt(null);
      setErrorMessage(
        saveFailedEvent.message ?? "Failed to save snippet. See console for error."
      );
      console.error(saveFailedEvent.message);
      setIsError(true);
      if (saveFailedEvent.error_code === "SNIPPET_UNSET" && saveFailedEvent.available_snippet_names) {
        setAvailableSnippets(saveFailedEvent.available_snippet_names);
        setIsSelectSnippetDialogOpen(true);
      }
    }
    if (saveSuccessEvent) {
      setIsSaving(false);
      setRequestToSaveSentAt(null);
      setNotificationMessage("Snippet saved successfully.");
      setIsError(false);
    }
  }, [recentEvents, isSaving]);
  const triggerSaveSnippet = async () => {
    setIsSaving(true);
    setRequestToSaveSentAt(Date.now());
    setNotificationMessage(null);
    setIsError(false);
    await pushEvent({
      event_type: "REQUEST_TO_SAVE_SNIPPET",
      snippet_name: snippetName
    });
  };
  const storeCircuitJson = useRunFrameStore((state) => state.circuitJson);
  const circuitJson = storeCircuitJson ?? props.circuitJson;
  const exportProjectName = useMemo10(() => {
    let projectNameFromPath = "Untitled";
    if (currentMainComponentPath) {
      const filename = currentMainComponentPath.split("/").pop();
      if (filename) projectNameFromPath = filename.replace(/\.[^.]+$/, "");
    }
    return (props.projectName ?? snippetName ?? projectNameFromPath).replace(
      /\.(board|circuit)$/,
      ""
    );
  }, [currentMainComponentPath, props.projectName, snippetName]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState25(false);
  const [isAiReviewDialogOpen, setIsAiReviewDialogOpen] = useState25(false);
  const { BugReportDialog, openBugReportDialog } = useBugReportDialog({
    onLoginRequired: props.onLoginRequired
  });
  const handleLbrnExport = async (options) => {
    if (!pendingLbrnExport) return;
    await exportLbrn({
      circuitJson: pendingLbrnExport.circuitJson,
      projectName: pendingLbrnExport.projectName,
      options
    });
    setPendingLbrnExport(null);
  };
  const latestAutoroutingLogEntry = useMemo10(
    () => getLatestAutoroutingLogEntry(props.autoroutingLog),
    [props.autoroutingLog]
  );
  const handleExport = (exportName) => {
    if (!circuitJson) {
      toast.error("No Circuit JSON to export");
      return;
    }
    const simpleRouteJson = latestAutoroutingLogEntry?.value.simpleRouteJson;
    if (exportName === "LightBurn") {
      setPendingLbrnExport({
        circuitJson,
        projectName: exportProjectName
      });
      setIsLbrnDialogOpen(true);
      return;
    }
    exportAndDownload({
      exportName,
      circuitJson,
      simpleRouteJson,
      projectName: exportProjectName
    });
  };
  return /* @__PURE__ */ jsxs31(Fragment9, { children: [
    /* @__PURE__ */ jsxs31("div", { className: "rf-flex rf-items-center rf-gap-1 rf-flex-shrink-0", children: [
      /* @__PURE__ */ jsxs31(DropdownMenu, { children: [
        /* @__PURE__ */ jsx42(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx42("div", { className: "rf-whitespace-nowrap rf-text-xs font-medium rf-p-2 rf-mx-1 rf-cursor-pointer rf-relative", children: "File" }) }),
        /* @__PURE__ */ jsxs31(DropdownMenuContent, { className: "rf-z-[101]", children: [
          !props.isWebEmbedded && /* @__PURE__ */ jsxs31(Fragment9, { children: [
            /* @__PURE__ */ jsx42(
              DropdownMenuItem,
              {
                className: "rf-text-xs",
                onSelect: triggerSaveSnippet,
                disabled: isSaving,
                children: isSaving ? "Saving..." : "Push"
              }
            ),
            parseInt(window.location.port) > 5e3 && /* @__PURE__ */ jsx42(
              DropdownMenuItem,
              {
                className: "rf-text-xs",
                onSelect: () => {
                  orderDialog.open();
                },
                children: "Order"
              }
            ),
            /* @__PURE__ */ jsx42(
              DropdownMenuItem,
              {
                className: "rf-text-xs",
                onSelect: () => setIsImportDialogOpen(true),
                disabled: isSaving,
                children: "Import"
              }
            ),
            /* @__PURE__ */ jsx42(
              DropdownMenuItem,
              {
                className: "rf-text-xs",
                onSelect: () => {
                  if (!hasRegistryToken()) {
                    toast.error("Requires tscircuit token");
                    return;
                  }
                  setIsAiReviewDialogOpen(true);
                },
                children: "AI Review"
              }
            )
          ] }),
          !props.isWebEmbedded && props.onLoginRequired && /* @__PURE__ */ jsx42(
            DropdownMenuItem,
            {
              className: "rf-text-xs",
              onSelect: () => {
                props.onLoginRequired?.();
              },
              children: "Sign In"
            }
          ),
          !props.isWebEmbedded && /* @__PURE__ */ jsxs31(DropdownMenuSub, { children: [
            /* @__PURE__ */ jsx42(DropdownMenuSubTrigger, { className: "rf-text-xs", children: "Report Bug" }),
            /* @__PURE__ */ jsx42(DropdownMenuPortal, { children: /* @__PURE__ */ jsxs31(DropdownMenuSubContent, { children: [
              /* @__PURE__ */ jsx42(
                DropdownMenuItem,
                {
                  className: "rf-text-xs",
                  onSelect: () => {
                    openBugReportDialog();
                  },
                  children: "Report Entire Circuit"
                }
              ),
              /* @__PURE__ */ jsx42(
                DropdownMenuItem,
                {
                  className: "rf-text-xs",
                  disabled: !latestAutoroutingLogEntry || !props.onReportAutoroutingLog,
                  onSelect: () => {
                    if (!latestAutoroutingLogEntry || !props.onReportAutoroutingLog) {
                      return;
                    }
                    props.onReportAutoroutingLog(
                      latestAutoroutingLogEntry.key,
                      {
                        simpleRouteJson: latestAutoroutingLogEntry.value.simpleRouteJson
                      }
                    );
                  },
                  children: "Report Autorouter Bug"
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs31(DropdownMenuSub, { children: [
            /* @__PURE__ */ jsx42(
              DropdownMenuSubTrigger,
              {
                className: "rf-text-xs",
                disabled: isExporting,
                children: isExporting ? "Exporting..." : "Export"
              }
            ),
            /* @__PURE__ */ jsx42(DropdownMenuPortal, { children: /* @__PURE__ */ jsx42(DropdownMenuSubContent, { children: availableExports.map((exp, i) => /* @__PURE__ */ jsx42(
              DropdownMenuItem,
              {
                onSelect: () => handleExport(exp.name),
                disabled: isExporting || exp.name === "Simple Route JSON" && !latestAutoroutingLogEntry,
                children: /* @__PURE__ */ jsx42("span", { className: "rf-text-xs", children: exp.name })
              },
              i
            )) }) })
          ] }),
          /* @__PURE__ */ jsx42(
            DropdownMenuItem,
            {
              className: "rf-text-xs",
              disabled: isExporting,
              onSelect: () => {
                if (!circuitJson) {
                  toast.error("No Circuit JSON to export");
                  return;
                }
                setIsExportAccessoryDialogOpen(true);
              },
              children: "Export Accessory\u2026"
            }
          ),
          !props.isWebEmbedded && /* @__PURE__ */ jsxs31(DropdownMenuSub, { children: [
            /* @__PURE__ */ jsx42(DropdownMenuSubTrigger, { className: "rf-text-xs", children: "Advanced" }),
            /* @__PURE__ */ jsx42(DropdownMenuPortal, { children: /* @__PURE__ */ jsxs31(DropdownMenuSubContent, { children: [
              /* @__PURE__ */ jsx42(DropdownMenuItem, { className: "rf-flex rf-items-center rf-gap-2", children: /* @__PURE__ */ jsxs31("div", { className: "rf-flex rf-items-center rf-gap-2", children: [
                /* @__PURE__ */ jsx42(
                  Checkbox,
                  {
                    id: "load-latest-eval",
                    checked: props.shouldLoadLatestEval,
                    onCheckedChange: (checked) => {
                      props.onChangeShouldLoadLatestEval?.(
                        checked === true
                      );
                    }
                  }
                ),
                /* @__PURE__ */ jsx42(
                  "label",
                  {
                    htmlFor: "load-latest-eval",
                    className: "rf-text-xs rf-cursor-pointer",
                    children: "Force Latest @tscircuit/eval"
                  }
                )
              ] }) }),
              lastRunEvalVersion && /* @__PURE__ */ jsx42(DropdownMenuItem, { className: "rf-flex rf-items-center rf-gap-2", children: /* @__PURE__ */ jsx42("div", { className: "rf-flex rf-items-center rf-gap-2", children: /* @__PURE__ */ jsxs31("span", { className: "rf-text-xs", children: [
                "@tscircuit/eval@",
                lastRunEvalVersion
              ] }) }) }),
              /* @__PURE__ */ jsx42(DropdownMenuItem, { className: "rf-flex rf-items-center rf-gap-2", children: /* @__PURE__ */ jsx42("div", { className: "rf-flex rf-items-center rf-gap-2", children: /* @__PURE__ */ jsxs31("span", { className: "rf-text-xs", children: [
                "@tscircuit/runframe@",
                package_default.version
              ] }) }) }),
              /* @__PURE__ */ jsx42(
                DropdownMenuItem,
                {
                  className: "rf-flex rf-items-center rf-gap-2",
                  onClick: () => {
                    window.open("/api/admin", "_blank");
                  },
                  children: /* @__PURE__ */ jsx42("div", { className: "rf-flex rf-items-center rf-gap-2", children: /* @__PURE__ */ jsx42("span", { className: "rf-text-xs", children: "CLI Admin Panel" }) })
                }
              )
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsx42(AlertDialog, { open: isError, onOpenChange: setIsError, children: /* @__PURE__ */ jsxs31(AlertDialogContent, { children: [
          /* @__PURE__ */ jsxs31(AlertDialogHeader, { children: [
            /* @__PURE__ */ jsx42(AlertDialogTitle, { children: "Error Saving Snippet" }),
            /* @__PURE__ */ jsx42(AlertDialogDescription, { children: errorMessage })
          ] }),
          /* @__PURE__ */ jsx42(AlertDialogFooter, { children: /* @__PURE__ */ jsx42(AlertDialogCancel, { onClick: () => setIsError(false), children: "Dismiss" }) })
        ] }) }),
        /* @__PURE__ */ jsx42(
          SelectSnippetDialog,
          {
            snippetNames: availableSnippets ?? [],
            onSelect: async (name) => {
              setIsSaving(true);
              setRequestToSaveSentAt(Date.now());
              setSnippetName(name);
              await pushEvent({
                event_type: "REQUEST_TO_SAVE_SNIPPET",
                snippet_name: name
              });
              setIsSelectSnippetDialogOpen(false);
            },
            onCancel: () => setIsSelectSnippetDialogOpen(false),
            isOpen: isSelectSnippetDialogOpen
          }
        )
      ] }),
      /* @__PURE__ */ jsxs31(DropdownMenu, { children: [
        /* @__PURE__ */ jsx42(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx42("div", { className: "rf-whitespace-nowrap rf-text-xs font-medium rf-p-2 rf-mx-1 rf-cursor-pointer rf-relative", children: "View" }) }),
        /* @__PURE__ */ jsx42(DropdownMenuContent, { className: "rf-z-[101]", children: /* @__PURE__ */ jsxs31(DropdownMenuSub, { children: [
          /* @__PURE__ */ jsx42(DropdownMenuSubTrigger, { className: "rf-text-xs", children: "Schematic" }),
          /* @__PURE__ */ jsx42(DropdownMenuPortal, { children: /* @__PURE__ */ jsxs31(DropdownMenuSubContent, { children: [
            /* @__PURE__ */ jsx42(
              DropdownMenuItem,
              {
                className: "rf-flex rf-items-center rf-gap-2",
                onSelect: (e) => e.preventDefault(),
                children: /* @__PURE__ */ jsxs31("div", { className: "rf-flex rf-items-center rf-gap-2", children: [
                  /* @__PURE__ */ jsx42(
                    Checkbox,
                    {
                      id: "show-schematic-ports",
                      checked: props.showSchematicPorts,
                      onCheckedChange: (checked) => {
                        props.onChangeShowSchematicPorts?.(checked === true);
                      }
                    }
                  ),
                  /* @__PURE__ */ jsx42(
                    "label",
                    {
                      htmlFor: "show-schematic-ports",
                      className: "rf-text-xs rf-cursor-pointer",
                      children: "Show Schematic Ports"
                    }
                  )
                ] })
              }
            ),
            /* @__PURE__ */ jsx42(
              DropdownMenuItem,
              {
                className: "rf-flex rf-items-center rf-gap-2",
                onSelect: (e) => e.preventDefault(),
                children: /* @__PURE__ */ jsxs31("div", { className: "rf-flex rf-items-center rf-gap-2", children: [
                  /* @__PURE__ */ jsx42(
                    Checkbox,
                    {
                      id: "show-schematic-grid",
                      checked: props.showSchematicDebugGrid,
                      onCheckedChange: (checked) => {
                        props.onChangeShowSchematicDebugGrid?.(
                          checked === true
                        );
                      }
                    }
                  ),
                  /* @__PURE__ */ jsx42(
                    "label",
                    {
                      htmlFor: "show-schematic-grid",
                      className: "rf-text-xs rf-cursor-pointer",
                      children: "Show Schematic Grid"
                    }
                  )
                ] })
              }
            )
          ] }) })
        ] }) })
      ] })
    ] }),
    BugReportDialog,
    /* @__PURE__ */ jsx42(
      LbrnExportOptionsDialog,
      {
        open: isLbrnDialogOpen,
        onOpenChange: setIsLbrnDialogOpen,
        onExport: handleLbrnExport
      }
    ),
    circuitJson && /* @__PURE__ */ jsx42(
      ExportAccessoryDialog,
      {
        open: isExportAccessoryDialogOpen,
        onOpenChange: setIsExportAccessoryDialogOpen,
        circuitJson,
        projectName: exportProjectName
      }
    ),
    /* @__PURE__ */ jsx42(
      ImportComponentDialogForCli,
      {
        isOpen: isImportDialogOpen,
        onClose: () => setIsImportDialogOpen(false)
      }
    ),
    /* @__PURE__ */ jsx42(
      AiReviewDialog,
      {
        isOpen: isAiReviewDialogOpen,
        onClose: () => setIsAiReviewDialogOpen(false),
        packageName: snippetName
      }
    ),
    /* @__PURE__ */ jsx42(
      Toaster,
      {
        position: "top-center",
        reverseOrder: false,
        containerStyle: { zIndex: 1e5 },
        toastOptions: {
          className: "rf-break-all",
          style: { zIndex: 1e5 }
        }
      }
    ),
    /* @__PURE__ */ jsx42(
      orderDialog.OrderDialog,
      {
        isOpen: orderDialog.isOpen,
        onClose: orderDialog.close,
        stage: orderDialog.stage,
        setStage: orderDialog.setStage
      }
    )
  ] });
};

// lib/components/CircuitJsonPreview/CrispFeedbackButton.tsx
import { MessageCircleQuestion } from "lucide-react";

// lib/components/ui/tooltip.tsx
import * as React15 from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { jsx as jsx43 } from "react/jsx-runtime";
var TooltipProvider = TooltipPrimitive.Provider;
var Tooltip = TooltipPrimitive.Root;
var TooltipTrigger = TooltipPrimitive.Trigger;
var TooltipContent = React15.forwardRef(({ className, sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsx43(
  TooltipPrimitive.Content,
  {
    ref,
    sideOffset,
    className: cn(
      "z-50 overflow-hidden rounded-md bg-slate-900 px-3 py-1.5 text-xs text-slate-50 animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:bg-slate-50 dark:text-slate-900",
      className
    ),
    ...props
  }
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

// lib/components/CircuitJsonPreview/CrispFeedbackButton.tsx
import { jsx as jsx44, jsxs as jsxs32 } from "react/jsx-runtime";
var CRISP_WEBSITE_ID = "24b58135-86c7-4e4b-bf6e-cca862bc4b26";
var CRISP_SCRIPT_ID = "runframe-crisp-chat-script";
var TSCIRCUIT_HOSTNAME = "tscircuit.com";
var pushCrispCommand = (command) => {
  window.$crisp = window.$crisp || [];
  window.$crisp.push(command);
};
var configureCrisp = () => {
  window.$crisp = window.$crisp || [];
  window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
  if (!window.__RUNFRAME_CRISP_CONFIGURED__) {
    window.__RUNFRAME_CRISP_CONFIGURED__ = true;
    pushCrispCommand(["do", "chat:hide"]);
    pushCrispCommand([
      "on",
      "chat:closed",
      () => pushCrispCommand(["do", "chat:hide"])
    ]);
  }
  if (!document.getElementById(CRISP_SCRIPT_ID)) {
    const script = document.createElement("script");
    script.id = CRISP_SCRIPT_ID;
    script.src = "https://client.crisp.chat/l.js";
    script.async = true;
    document.head.appendChild(script);
  }
};
var openCrispChat = () => {
  configureCrisp();
  pushCrispCommand(["do", "chat:show"]);
  pushCrispCommand(["do", "chat:open"]);
};
var shouldShowCrispFeedbackButton = ({
  isCli,
  hostname = typeof window !== "undefined" ? window.location.hostname : void 0
} = {}) => {
  if (hostname?.toLowerCase() === TSCIRCUIT_HOSTNAME) return false;
  if (isCli) return true;
  return false;
};
var CrispFeedbackButton = () => {
  return /* @__PURE__ */ jsx44(TooltipProvider, { children: /* @__PURE__ */ jsxs32(Tooltip, { children: [
    /* @__PURE__ */ jsx44(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx44(
      Button,
      {
        type: "button",
        variant: "ghost",
        size: "icon",
        "aria-label": "Get Support or Give Feedback",
        onClick: openCrispChat,
        className: "rf-h-8 rf-w-8",
        children: /* @__PURE__ */ jsx44(MessageCircleQuestion, { className: "rf-h-4 rf-w-4 rf-text-gray-500" })
      }
    ) }),
    /* @__PURE__ */ jsx44(TooltipContent, { side: "bottom", children: "Get Support or Give Feedback" })
  ] }) });
};

// lib/components/CircuitJsonPreview/CircuitJsonPreview.tsx
import { jsx as jsx45, jsxs as jsxs33 } from "react/jsx-runtime";
var dropdownMenuItems = [
  "assembly",
  "pinout",
  "analog_simulation",
  "bom",
  "circuit_json",
  "errors",
  "render_log",
  "autorouting",
  "solvers"
];
var getErrorMessage = (error) => error instanceof Error ? error.message : "An unknown error occurred";
var CircuitJsonPreview = ({
  platformConfig,
  code,
  fsMap,
  onRunClicked = void 0,
  errorMessage,
  errorStack,
  circuitJson,
  autoroutingGraphics,
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
  autoroutingLog,
  onReportAutoroutingLog,
  isRunningCode,
  hasCodeChangedSinceLastRun,
  onEditEvent,
  editEvents,
  defaultActiveTab,
  defaultTab,
  availableTabs,
  autoRotate3dViewerDisabled,
  showSchematicDebugGrid: showSchematicDebugGridProp = false,
  showSchematicPorts: showSchematicPortsProp = false,
  onChangeShowSchematicDebugGrid,
  onChangeShowSchematicPorts,
  showToggleFullScreen = true,
  defaultToFullScreen = false,
  activeEffectName,
  allowSelectingVersion = getWindowVar(
    "TSCIRCUIT_ALLOW_SELECTING_EVAL_VERSION"
  ) !== false,
  showFileMenu = false,
  isWebEmbedded = false,
  isCli = false,
  projectName,
  schematicSvgOptions,
  hideSchematicInAnalogSimulation = false,
  onRerunWithDebug,
  solverEvents,
  autoroutingPhases,
  onPcbBoundsSelected
}) => {
  useStyles();
  const {
    versions: evalVersions,
    latestVersion,
    lastRunEvalVersion,
    search: evalSearch,
    setSearch: setEvalSearch,
    selectVersion: selectEvalVersion
  } = useEvalVersions(allowSelectingVersion);
  const circuitJsonErrors = useMemo11(() => {
    if (!circuitJson) return null;
    return circuitJson.filter(
      (e) => e && "error_type" in e || e.type.includes("error")
    );
  }, [circuitJson]);
  const circuitJsonWarnings = useMemo11(() => {
    if (!circuitJson) return null;
    return circuitJson.filter(
      (e) => e && "warning_type" in e || e.type.includes("warning")
    );
  }, [circuitJson]);
  const hasSchematicGroup = useMemo11(() => {
    if (!circuitJson) return true;
    return circuitJson.some((e) => e.type === "schematic_group");
  }, [circuitJson]);
  const hasPanels = useMemo11(() => {
    return circuitJson?.some((e) => e.type === "pcb_panel");
  }, [circuitJson]);
  const schematicNavigationEnabled = (!availableTabs || availableTabs.includes("schematic")) && hasSchematicGroup && !hasPanels;
  const { controller: schematicController, focusSchematicComponent } = useSchematicViewerController();
  const { controller: pcbController, focusPcbComponent } = usePcbViewerController();
  const pcbNavigationEnabled = !availableTabs || availableTabs.includes("pcb");
  const handleViewPcbComponent = pcbNavigationEnabled ? ({ source_component_id }) => {
    const component = circuitJson?.find(
      (element) => element.type === "pcb_component" && element.source_component_id === source_component_id
    );
    if (component?.type !== "pcb_component") return;
    focusPcbComponent(component.pcb_component_id);
    setActiveTab("pcb");
  } : void 0;
  const handleViewSchematicComponent = schematicNavigationEnabled ? ({ source_component_id }) => {
    const component = circuitJson?.find(
      (element) => element.type === "schematic_component" && element.source_component_id === source_component_id
    );
    if (component?.type !== "schematic_component") return;
    focusSchematicComponent(component.schematic_component_id);
    setActiveTab("schematic");
  } : void 0;
  const isAnalogSimulationGraphPending = useMemo11(() => {
    if (!circuitJson || !isRunningCode) return false;
    if (circuitJsonErrors?.length) return false;
    const hasSimulationExperiment = circuitJson.some(
      (e) => e.type === "simulation_experiment"
    );
    return hasSimulationExperiment && !hasSimulationAnalysisResult(circuitJson);
  }, [circuitJson, circuitJsonErrors, isRunningCode]);
  const analogSimulationError = useMemo11(() => {
    return circuitJsonErrors?.find((e) => e.type.startsWith("simulation_"));
  }, [circuitJsonErrors]);
  useErrorTelemetry({
    errorMessage,
    errorStack,
    circuitJsonErrors
  });
  const fallbackTab = defaultTab ?? availableTabs?.[0] ?? "pcb";
  const [activeTab, setActiveTabState] = useLocalStorageState(
    "runframe-active-tab",
    defaultActiveTab ?? fallbackTab,
    defaultActiveTab
  );
  usePostHogActivity({
    source: "runframe",
    component: "CircuitJsonPreview",
    isWebEmbedded,
    activeTab
  });
  const [lastActiveTab, setLastActiveTab] = useState26(null);
  const [isFullScreen, setIsFullScreen] = useState26(defaultToFullScreen);
  const [internalShowSchematicDebugGrid, setInternalShowSchematicDebugGrid] = useState26(showSchematicDebugGridProp);
  const [internalShowSchematicPorts, setInternalShowSchematicPorts] = useState26(
    showSchematicPortsProp
  );
  const showSchematicDebugGrid = onChangeShowSchematicDebugGrid ? showSchematicDebugGridProp : internalShowSchematicDebugGrid;
  const showSchematicPorts = onChangeShowSchematicPorts ? showSchematicPortsProp : internalShowSchematicPorts;
  const setShowSchematicDebugGrid = onChangeShowSchematicDebugGrid ?? setInternalShowSchematicDebugGrid;
  const setShowSchematicPorts = onChangeShowSchematicPorts ?? setInternalShowSchematicPorts;
  useFullscreenBodyScroll(isFullScreen);
  const setActiveTab = useCallback9(
    (tab) => {
      setActiveTabState(tab);
      onActiveTabChange?.(tab);
    },
    [onActiveTabChange, setActiveTabState]
  );
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  useEffect19(() => {
    if (errorMessage) {
      if (activeTab !== "errors") {
        setLastActiveTab(activeTab);
      }
      setActiveTab("errors");
    }
  }, [errorMessage]);
  useEffect19(() => {
    if ((activeTab === "code" || activeTab === "errors") && circuitJson && !errorMessage) {
      setActiveTab(
        lastActiveTab ?? defaultActiveTab ?? defaultTab ?? availableTabs?.[0] ?? "pcb"
      );
    }
  }, [circuitJson]);
  const setCadViewerRef = useCallback9((value) => {
    window.TSCIRCUIT_3D_OBJECT_REF = value === null ? void 0 : value;
  }, []);
  return /* @__PURE__ */ jsx45(
    "div",
    {
      className: cn(
        "flex flex-col relative rf-overflow-x-hidden rf-h-full",
        className
      ),
      children: /* @__PURE__ */ jsx45(
        "div",
        {
          className: cn(
            "rf-md:sticky rf-md:top-2 rf-h-full",
            isFullScreen && "rf-fixed rf-top-0 rf-left-0 rf-w-full rf-h-full rf-bg-white rf-overflow-hidden"
          ),
          children: /* @__PURE__ */ jsxs33(
            Tabs,
            {
              value: activeTab,
              onValueChange: setActiveTab,
              className: "rf-flex-grow rf-flex rf-flex-col rf-h-full",
              children: [
                /* @__PURE__ */ jsxs33(
                  "div",
                  {
                    className: cn(
                      "rf-flex rf-items-center rf-gap-2 rf-p-2 rf-pb-0",
                      headerClassName
                    ),
                    children: [
                      leftHeaderContent,
                      showFileMenu && !leftHeaderContent && /* @__PURE__ */ jsx45(
                        FileMenuLeftHeader,
                        {
                          isWebEmbedded,
                          circuitJson,
                          projectName,
                          autoroutingLog,
                          onReportAutoroutingLog,
                          showSchematicDebugGrid,
                          onChangeShowSchematicDebugGrid: setShowSchematicDebugGrid,
                          showSchematicPorts,
                          onChangeShowSchematicPorts: setShowSchematicPorts
                        }
                      ),
                      (leftHeaderContent || showFileMenu) && /* @__PURE__ */ jsx45("div", { className: "rf-flex-grow" }),
                      !leftHeaderContent && !showFileMenu && isRunningCode && /* @__PURE__ */ jsx45(Loader27, { className: "rf-w-4 rf-h-4 rf-animate-spin" }),
                      !leftHeaderContent && !showFileMenu && /* @__PURE__ */ jsx45("div", { className: "rf-flex-grow" }),
                      renderLog && renderLog.progress !== 1 && !errorMessage && /* @__PURE__ */ jsxs33("div", { className: "rf-flex rf-items-center rf-gap-2 rf-min-w-0 rf-max-w-xs", children: [
                        activeEffectName ? /* @__PURE__ */ jsx45(
                          "div",
                          {
                            className: "rf-text-xs rf-text-gray-500 rf-truncate rf-min-w-0",
                            title: activeEffectName,
                            children: activeEffectName
                          }
                        ) : renderLog.lastRenderEvent && /* @__PURE__ */ jsx45(
                          "div",
                          {
                            className: "rf-text-xs rf-text-gray-500 rf-truncate rf-min-w-0",
                            title: renderLog.lastRenderEvent?.phase ?? "",
                            children: renderLog.lastRenderEvent?.phase ?? ""
                          }
                        ),
                        /* @__PURE__ */ jsx45("div", { className: "rf-w-4 rf-h-4 rf-bg-blue-500 rf-opacity-50 rf-rounded-full rf-text-white rf-flex-shrink-0", children: /* @__PURE__ */ jsx45(LoaderCircleIcon, { className: "rf-w-4 rf-h-4 rf-animate-spin" }) }),
                        /* @__PURE__ */ jsxs33("div", { className: "rf-text-xs rf-font-bold rf-text-gray-700 rf-tabular-nums rf-flex-shrink-0", children: [
                          ((renderLog.progress ?? 0) * 100).toFixed(1),
                          "%"
                        ] })
                      ] }),
                      showRightHeaderContent && shouldShowCrispFeedbackButton({ isCli }) && /* @__PURE__ */ jsx45(CrispFeedbackButton, {}),
                      showRightHeaderContent && /* @__PURE__ */ jsxs33(TabsList, { children: [
                        showCodeTab && /* @__PURE__ */ jsx45(TabsTrigger, { value: "code", children: "Code" }),
                        !availableTabs || availableTabs.includes("pcb") ? /* @__PURE__ */ jsxs33(TabsTrigger, { value: "pcb", className: "rf-whitespace-nowrap", children: [
                          circuitJson && /* @__PURE__ */ jsx45(
                            "span",
                            {
                              className: cn(
                                "rf-inline-flex rf-items-center rf-justify-center rf-w-2 rf-h-2 rf-mr-1 rf-text-xs rf-font-bold rf-text-white rf-rounded-full",
                                !hasCodeChangedSinceLastRun ? "rf-bg-blue-500" : "rf-bg-gray-500"
                              )
                            }
                          ),
                          "PCB"
                        ] }) : null,
                        !availableTabs || availableTabs.includes("schematic") ? /* @__PURE__ */ jsxs33(
                          TabsTrigger,
                          {
                            value: "schematic",
                            className: cn(
                              "rf-whitespace-nowrap",
                              circuitJson && !hasSchematicGroup && "rf-opacity-50"
                            ),
                            disabled: circuitJson ? !hasSchematicGroup || hasPanels : false,
                            children: [
                              circuitJson && /* @__PURE__ */ jsx45(
                                "span",
                                {
                                  className: cn(
                                    "rf-inline-flex rf-items-center rf-justify-center rf-w-2 rf-h-2 rf-mr-1 rf-text-xs rf-font-bold rf-text-white rf-rounded-full",
                                    !hasCodeChangedSinceLastRun ? "rf-bg-blue-500" : "rf-bg-gray-500"
                                  )
                                }
                              ),
                              "Schematic"
                            ]
                          }
                        ) : null,
                        !availableTabs || availableTabs.includes("cad") ? /* @__PURE__ */ jsxs33(TabsTrigger, { value: "cad", children: [
                          circuitJson && /* @__PURE__ */ jsx45(
                            "span",
                            {
                              className: cn(
                                "inline-flex items-center justify-center w-2 h-2 mr-1 text-xs font-bold text-white rounded-full",
                                !hasCodeChangedSinceLastRun ? "rf-bg-blue-500" : "rf-bg-gray-500"
                              )
                            }
                          ),
                          "3D"
                        ] }) : null,
                        !["pcb", "cad", "schematic"].includes(activeTab) && /* @__PURE__ */ jsx45(TabsTrigger, { value: activeTab, children: capitalizeFirstLetters(activeTab) }),
                        /* @__PURE__ */ jsxs33(DropdownMenu, { children: [
                          /* @__PURE__ */ jsx45(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs33(
                            "button",
                            {
                              type: "button",
                              "aria-label": "More views",
                              className: "rf-whitespace-nowrap rf-p-2 rf-mr-1 rf-cursor-pointer rf-relative",
                              children: [
                                /* @__PURE__ */ jsx45(EllipsisIcon, { className: "rf-w-4 rf-h-4" }),
                                (circuitJsonErrors && circuitJsonErrors.length > 0 || errorMessage) && /* @__PURE__ */ jsx45("span", { className: "rf-inline-flex rf-absolute rf-top-[6px] rf-right-[4px] rf-items-center rf-justify-center rf-w-1 rf-h-1 rf-ml-2 rf-text-[8px] rf-font-bold rf-text-white rf-bg-red-500 rf-rounded-full" })
                              ]
                            }
                          ) }),
                          /* @__PURE__ */ jsxs33(DropdownMenuContent, { className: "rf-*:text-xs rf-z-[101]", children: [
                            dropdownMenuItems.filter(
                              (item) => !availableTabs || availableTabs.includes(item)
                            ).map((item) => /* @__PURE__ */ jsxs33(
                              DropdownMenuItem,
                              {
                                onSelect: () => setActiveTab(item),
                                children: [
                                  activeTab !== item && /* @__PURE__ */ jsx45(Circle2, { className: "rf-w-3 rf-h-3 rf-opacity-30" }),
                                  activeTab === item && /* @__PURE__ */ jsx45(CheckIcon, { className: "rf-w-3 rf-h-3" }),
                                  /* @__PURE__ */ jsx45("div", { className: "rf-pr-2", children: capitalizeFirstLetters(item) }),
                                  item === "errors" && (circuitJsonErrors && circuitJsonErrors.length > 0 || errorMessage) && /* @__PURE__ */ jsx45("span", { className: "rf-inline-flex rf-items-center rf-justify-center rf-w-3 rf-h-3 rf-ml-2 rf-text-[8px] rf-font-bold rf-text-white rf-bg-red-500 rf-rounded-full", children: errorMessage ? 1 : circuitJsonErrors?.length }),
                                  item === "solvers" && solverEvents && solverEvents.length > 0 && /* @__PURE__ */ jsx45("span", { className: "rf-inline-flex rf-items-center rf-justify-center rf-min-w-[12px] rf-h-3 rf-px-1 rf-ml-2 rf-text-[8px] rf-font-bold rf-text-white rf-bg-blue-500 rf-rounded-full", children: solverEvents.length })
                                ]
                              },
                              item
                            )),
                            /* @__PURE__ */ jsx45(
                              DropdownMenuItem,
                              {
                                disabled: true,
                                className: "rf-opacity-60 rf-cursor-default rf-select-none",
                                children: /* @__PURE__ */ jsxs33("div", { className: "rf-pr-2 rf-text-xs rf-text-gray-500", children: [
                                  "@tscircuit/runframe@",
                                  version.split(".").map(
                                    (part, i) => i === 2 ? parseInt(part) + 1 : part
                                  ).join(".")
                                ] })
                              }
                            ),
                            allowSelectingVersion ? /* @__PURE__ */ jsxs33(
                              DropdownMenuSub,
                              {
                                onOpenChange: (open) => !open && setEvalSearch(""),
                                children: [
                                  /* @__PURE__ */ jsx45(DropdownMenuSubTrigger, { className: "rf-text-xs rf-opacity-60", children: /* @__PURE__ */ jsxs33("div", { className: "rf-pr-2 rf-text-xs rf-text-gray-500", children: [
                                    "@tscircuit/eval@",
                                    lastRunEvalVersion ?? latestVersion ?? "latest"
                                  ] }) }),
                                  /* @__PURE__ */ jsx45(DropdownMenuPortal, { children: /* @__PURE__ */ jsxs33(DropdownMenuSubContent, { className: "rf-*:text-xs rf-w-40 rf-max-h-[200px] rf-overflow-y-auto", children: [
                                    /* @__PURE__ */ jsx45("div", { className: "rf-p-1", children: /* @__PURE__ */ jsx45(
                                      Input,
                                      {
                                        value: evalSearch,
                                        onChange: (e) => setEvalSearch(e.target.value),
                                        placeholder: "Search...",
                                        className: "rf-h-7 rf-text-xs"
                                      }
                                    ) }),
                                    /* @__PURE__ */ jsx45(DropdownMenuSeparator, {}),
                                    /* @__PURE__ */ jsx45(
                                      DropdownMenuItem,
                                      {
                                        onSelect: () => selectEvalVersion(null),
                                        children: latestVersion ? `${latestVersion} (latest)` : "latest"
                                      }
                                    ),
                                    evalVersions.map((v) => /* @__PURE__ */ jsx45(
                                      DropdownMenuItem,
                                      {
                                        onSelect: () => selectEvalVersion(v),
                                        children: v
                                      },
                                      v
                                    ))
                                  ] }) })
                                ]
                              }
                            ) : lastRunEvalVersion && /* @__PURE__ */ jsx45(
                              DropdownMenuItem,
                              {
                                disabled: true,
                                className: "rf-opacity-60 rf-cursor-default rf-select-none",
                                children: /* @__PURE__ */ jsxs33("div", { className: "rf-pr-2 rf-text-xs rf-text-gray-500", children: [
                                  "@tscircuit/eval@",
                                  lastRunEvalVersion
                                ] })
                              }
                            )
                          ] })
                        ] })
                      ] }),
                      showToggleFullScreen && /* @__PURE__ */ jsx45(Button, { onClick: toggleFullScreen, variant: "ghost", children: isFullScreen ? /* @__PURE__ */ jsx45(MinimizeIcon, { size: 16 }) : /* @__PURE__ */ jsx45(FullscreenIcon, { size: 16 }) })
                    ]
                  }
                ),
                showCodeTab && /* @__PURE__ */ jsx45(
                  TabsContent,
                  {
                    value: "code",
                    className: "rf-flex-grow rf-overflow-hidden",
                    children: /* @__PURE__ */ jsx45("div", { className: "rf-h-full", children: codeTabContent })
                  }
                ),
                (!availableTabs || availableTabs.includes("pcb")) && /* @__PURE__ */ jsx45(TabsContent, { value: "pcb", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-hidden",
                      isFullScreen ? "rf-h-[calc(100vh-52px)]" : "rf-h-full"
                    ),
                    children: /* @__PURE__ */ jsx45(
                      ErrorBoundary2,
                      {
                        fallbackRender: ({ error }) => /* @__PURE__ */ jsx45("div", { className: "rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200", children: /* @__PURE__ */ jsxs33("div", { className: "rf-p-4", children: [
                          /* @__PURE__ */ jsx45("h3", { className: "rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-3", children: "Error loading PCB viewer" }),
                          /* @__PURE__ */ jsx45("p", { className: "rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600 rf-mt-2", children: getErrorMessage(error) })
                        ] }) }),
                        children: circuitJson ? /* @__PURE__ */ jsx45(
                          PcbViewerWithContainerHeight,
                          {
                            controller: pcbController,
                            focusOnHover: false,
                            circuitJson,
                            debugGraphics: autoroutingGraphics,
                            onBoundsSelected: onPcbBoundsSelected,
                            onViewSchematicComponent: handleViewSchematicComponent,
                            containerClassName: cn(
                              "rf-h-full rf-w-full",
                              isFullScreen ? "rf-min-h-[calc(100vh-240px)]" : "rf-min-h-[620px]"
                            ),
                            onEditEventsChanged: (editEvents2) => {
                              if (onEditEvent) {
                                for (const e of editEvents2) {
                                  onEditEvent(e);
                                }
                              }
                            }
                          }
                        ) : /* @__PURE__ */ jsx45(PreviewEmptyState_default, { onRunClicked })
                      }
                    )
                  }
                ) }),
                (!availableTabs || availableTabs.includes("assembly")) && /* @__PURE__ */ jsx45(TabsContent, { value: "assembly", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-auto",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full  rf-min-h-[620px]"
                    ),
                    children: /* @__PURE__ */ jsx45(ErrorBoundary2, { fallback: /* @__PURE__ */ jsx45("div", { children: "Error loading Assembly" }), children: circuitJson ? /* @__PURE__ */ jsx45(
                      AssemblyViewer,
                      {
                        circuitJson,
                        containerStyle: {
                          height: "100%"
                        },
                        editingEnabled: true,
                        debugGrid: true
                      }
                    ) : /* @__PURE__ */ jsx45(PreviewEmptyState_default, { onRunClicked }) })
                  }
                ) }),
                (!availableTabs || availableTabs.includes("pinout")) && /* @__PURE__ */ jsx45(TabsContent, { value: "pinout", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-auto",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full  rf-min-h-[620px]"
                    ),
                    children: /* @__PURE__ */ jsx45(
                      ErrorBoundary2,
                      {
                        fallback: /* @__PURE__ */ jsx45("div", { children: "Error loading Pinout Viewer" }),
                        children: circuitJson ? /* @__PURE__ */ jsx45(
                          PinoutViewer,
                          {
                            circuitJson,
                            containerStyle: {
                              height: "100%"
                            }
                          }
                        ) : /* @__PURE__ */ jsx45(PreviewEmptyState_default, { onRunClicked })
                      }
                    )
                  }
                ) }),
                (!availableTabs || availableTabs.includes("schematic")) && /* @__PURE__ */ jsx45(TabsContent, { value: "schematic", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-auto rf-bg-white",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full  rf-min-h-[620px]"
                    ),
                    children: /* @__PURE__ */ jsx45(
                      ErrorBoundary2,
                      {
                        fallbackRender: ({ error }) => /* @__PURE__ */ jsx45("div", { className: "rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200", children: /* @__PURE__ */ jsxs33("div", { className: "rf-p-4", children: [
                          /* @__PURE__ */ jsx45("h3", { className: "rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-3", children: "Error loading Schematic" }),
                          /* @__PURE__ */ jsx45("p", { className: "rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600 rf-mt-2", children: getErrorMessage(error) })
                        ] }) }),
                        children: circuitJson ? /* @__PURE__ */ jsx45(
                          SchematicViewer,
                          {
                            platformConfig,
                            onViewPcbComponent: handleViewPcbComponent,
                            controller: schematicController,
                            circuitJson,
                            containerStyle: {
                              height: "100%"
                            },
                            debugGrid: showSchematicDebugGrid,
                            showSchematicPorts,
                            css: schematicSvgOptions?.css,
                            className: schematicSvgOptions?.className
                          }
                        ) : /* @__PURE__ */ jsx45(PreviewEmptyState_default, { onRunClicked })
                      }
                    )
                  }
                ) }),
                (!availableTabs || availableTabs.includes("cad")) && /* @__PURE__ */ jsx45(TabsContent, { value: "cad", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-auto",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full  rf-min-h-[620px]"
                    ),
                    children: /* @__PURE__ */ jsx45(
                      ErrorBoundary2,
                      {
                        fallbackRender: ({ error, resetErrorBoundary }) => /* @__PURE__ */ jsx45(
                          ErrorFallback,
                          {
                            error,
                            resetErrorBoundary
                          }
                        ),
                        children: circuitJson ? /* @__PURE__ */ jsx45(
                          CadViewer,
                          {
                            ref: setCadViewerRef,
                            circuitJson,
                            autoRotateDisabled: autoRotate3dViewerDisabled,
                            onViewSchematicComponent: handleViewSchematicComponent
                          },
                          `cad-${isFullScreen}`
                        ) : /* @__PURE__ */ jsx45(PreviewEmptyState_default, { onRunClicked })
                      }
                    )
                  }
                ) }),
                (!availableTabs || availableTabs.includes("analog_simulation")) && /* @__PURE__ */ jsx45(TabsContent, { value: "analog_simulation", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-auto",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full  rf-min-h-[620px]"
                    ),
                    children: /* @__PURE__ */ jsx45(
                      ErrorBoundary2,
                      {
                        fallback: /* @__PURE__ */ jsx45("div", { children: "Error loading Analog Simulation" }),
                        children: circuitJson ? analogSimulationError ? /* @__PURE__ */ jsx45("div", { className: "rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200", children: /* @__PURE__ */ jsxs33("div", { className: "rf-p-4", children: [
                          /* @__PURE__ */ jsx45("h3", { className: "rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-3", children: "Error running analog simulation" }),
                          /* @__PURE__ */ jsx45("p", { className: "rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600 rf-mt-2", children: analogSimulationError.message })
                        ] }) }) : isAnalogSimulationGraphPending ? /* @__PURE__ */ jsx45("div", { className: "rf-flex rf-h-full rf-min-h-[300px] rf-items-center rf-justify-center rf-bg-slate-50", children: /* @__PURE__ */ jsxs33("div", { className: "rf-flex rf-items-center rf-gap-2 rf-text-sm rf-text-slate-600", children: [
                          /* @__PURE__ */ jsx45(Loader27, { className: "rf-h-4 rf-w-4 rf-animate-spin" }),
                          "Running analog simulation..."
                        ] }) }) : /* @__PURE__ */ jsx45(
                          AnalogSimulationViewer,
                          {
                            circuitJson,
                            hideSchematic: hideSchematicInAnalogSimulation,
                            containerStyle: {
                              height: "100%"
                            }
                          }
                        ) : /* @__PURE__ */ jsx45(PreviewEmptyState_default, { onRunClicked })
                      }
                    )
                  }
                ) }),
                (!availableTabs || availableTabs.includes("bom")) && /* @__PURE__ */ jsx45(TabsContent, { value: "bom", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-auto",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full  rf-min-h-[620px]"
                    ),
                    children: /* @__PURE__ */ jsx45(
                      ErrorBoundary2,
                      {
                        fallbackRender: ({ error }) => /* @__PURE__ */ jsx45("div", { className: "rf-mt-4 rf-bg-red-50 rf-rounded-md rf-border rf-border-red-200", children: /* @__PURE__ */ jsxs33("div", { className: "rf-p-4", children: [
                          /* @__PURE__ */ jsx45("h3", { className: "rf-text-lg rf-font-semibold rf-text-red-800 rf-mb-3", children: "Error loading Bill of Materials" }),
                          /* @__PURE__ */ jsx45("p", { className: "rf-text-xs rf-font-mono rf-whitespace-pre-wrap rf-text-red-600 rf-mt-2", children: getErrorMessage(error) })
                        ] }) }),
                        children: circuitJson ? /* @__PURE__ */ jsx45(BomTable, { circuitJson }) : /* @__PURE__ */ jsx45(PreviewEmptyState_default, { onRunClicked })
                      }
                    )
                  }
                ) }),
                (!availableTabs || availableTabs.includes("circuit_json")) && /* @__PURE__ */ jsx45(TabsContent, { value: "circuit_json", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-auto",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full  rf-min-h-[620px]"
                    ),
                    children: /* @__PURE__ */ jsx45(ErrorBoundary2, { fallback: /* @__PURE__ */ jsx45("div", { children: "Error loading JSON viewer" }), children: circuitJson ? /* @__PURE__ */ jsx45(CircuitJsonTableViewer, { elements: circuitJson }) : /* @__PURE__ */ jsx45(PreviewEmptyState_default, { onRunClicked }) })
                  }
                ) }),
                (!availableTabs || availableTabs.includes("errors")) && /* @__PURE__ */ jsx45(TabsContent, { value: "errors", className: "rf-h-full", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-hidden",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full rf-min-h-[620px]"
                    ),
                    children: errorMessage || circuitJsonErrors && circuitJsonErrors.length > 0 || circuitJson ? /* @__PURE__ */ jsx45(
                      ErrorTabContent,
                      {
                        code,
                        fsMap,
                        circuitJsonErrors,
                        circuitJsonWarnings,
                        errorMessage,
                        errorStack,
                        circuitJson,
                        evalVersion: lastRunEvalVersion,
                        autoroutingLog,
                        onReportAutoroutingLog
                      }
                    ) : /* @__PURE__ */ jsx45(PreviewEmptyState_default, { onRunClicked })
                  }
                ) }),
                showRenderLogTab && (!availableTabs || availableTabs.includes("render_log")) && /* @__PURE__ */ jsx45(TabsContent, { value: "render_log", children: /* @__PURE__ */ jsx45(
                  RenderLogViewer,
                  {
                    renderLog,
                    onRerunWithDebug
                  }
                ) }),
                (!availableTabs || availableTabs.includes("autorouting")) && /* @__PURE__ */ jsx45(TabsContent, { value: "autorouting", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-auto",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full rf-min-h-[620px]"
                    ),
                    children: /* @__PURE__ */ jsx45(
                      ErrorBoundary2,
                      {
                        fallback: /* @__PURE__ */ jsx45("div", { className: "rf-p-4", children: "Error loading autorouting captures" }),
                        children: /* @__PURE__ */ jsx45(
                          AutoroutingTabContent,
                          {
                            circuitJson,
                            phases: autoroutingPhases,
                            isRunning: isRunningCode
                          }
                        )
                      }
                    )
                  }
                ) }),
                (!availableTabs || availableTabs.includes("solvers")) && /* @__PURE__ */ jsx45(TabsContent, { value: "solvers", children: /* @__PURE__ */ jsx45(
                  "div",
                  {
                    className: cn(
                      "rf-overflow-hidden",
                      isFullScreen ? "rf-h-[calc(100vh-60px)]" : "rf-h-full rf-min-h-[620px]"
                    ),
                    children: /* @__PURE__ */ jsx45(ErrorBoundary2, { fallback: /* @__PURE__ */ jsx45("div", { children: "Error loading Solvers view" }), children: /* @__PURE__ */ jsx45(SolversTabContent, { solverEvents }) })
                  }
                ) })
              ]
            }
          )
        }
      )
    }
  );
};

// lib/preview.ts
import { CadViewer as CadViewer2 } from "@tscircuit/3d-viewer";
import { PCBViewer as PCBViewer4 } from "@tscircuit/pcb-viewer";
import {
  usePcbViewerController as usePcbViewerController2
} from "@tscircuit/pcb-viewer";
import {
  SchematicViewer as SchematicViewer2,
  useSchematicViewerController as useSchematicViewerController2
} from "@tscircuit/schematic-viewer";

export {
  getRegistryKy,
  registryKy,
  cn,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  toast,
  BomTable,
  Input,
  PcbViewerWithContainerHeight,
  useStyles,
  useLocalStorageState,
  captureAutoroutingPhase,
  usePostHogActivity,
  useRunnerStore,
  debug_default,
  API_BASE,
  useRunFrameStore,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  loadEasyedaBrowser,
  createEasyEdaProxyFetch,
  ImportComponentDialog2,
  ImportComponentDialogForCli,
  useOrderDialogCli,
  useOrderDialog,
  ExportAccessoryDialog,
  FileMenuLeftHeader,
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  CircuitJsonPreview,
  CadViewer2 as CadViewer,
  PCBViewer4 as PCBViewer,
  usePcbViewerController2 as usePcbViewerController,
  SchematicViewer2 as SchematicViewer,
  useSchematicViewerController2 as useSchematicViewerController
};
