import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer"
import React, { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

const root = createRoot(document.getElementById("root")!)

function StaticBuildViewerApp() {
  const [buildDirectoryUrl, setBuildDirectoryUrl] = useState<string>("")
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    // Get build directory URL from URL parameters
    const params = new URLSearchParams(window.location.search)
    const buildUrl = params.get("buildUrl") || params.get("build_directory_url")
    
    if (buildUrl) {
      setBuildDirectoryUrl(buildUrl)
      setIsConfigured(true)
    } else {
      // Try to get from hash parameters (for embedded usage)
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const hashBuildUrl = hashParams.get("buildUrl") || hashParams.get("build_directory_url")
      
      if (hashBuildUrl) {
        setBuildDirectoryUrl(hashBuildUrl)
        setIsConfigured(true)
      } else {
        // Fallback: try to infer from current path
        const pathParts = window.location.pathname.split('/')
        const releasesIndex = pathParts.indexOf('releases')
        
        if (releasesIndex !== -1 && releasesIndex + 1 < pathParts.length) {
          const releaseId = pathParts[releasesIndex + 1]
          const inferredUrl = `${window.location.origin}/api/releases/${releaseId}/build`
          setBuildDirectoryUrl(inferredUrl)
          setIsConfigured(true)
        }
      }
    }
  }, [])

  if (!isConfigured) {
    return (
      <div style={{ 
        width: "100%", 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        flexDirection: "column",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#666"
      }}>
        <div style={{ fontSize: "18px", marginBottom: "16px" }}>
          Static Build Viewer
        </div>
        <div style={{ fontSize: "14px", textAlign: "center", maxWidth: "400px" }}>
          Please provide a build directory URL using the <code style={{ background: "#f5f5f5", padding: "2px 4px", borderRadius: "3px" }}>?buildUrl=</code> parameter.
        </div>
        <div style={{ fontSize: "12px", marginTop: "8px", color: "#999" }}>
          Example: <code style={{ background: "#f5f5f5", padding: "2px 4px", borderRadius: "3px" }}>
            ?buildUrl=/path/to/build/files
          </code>
        </div>
      </div>
    )
  }

  return (
    <RunFrameStaticBuildViewer
      buildDirectoryUrl={buildDirectoryUrl}
      debug={window.location.search.includes("debug")}
      defaultActiveTab="pcb"
      defaultToFullScreen={false}
      showToggleFullScreen={true}
      onCircuitJsonLoaded={(circuitJson) => {
        console.log("Static build circuit JSON loaded:", circuitJson)
        // Notify parent window if embedded
        if (window.parent !== window) {
          window.parent.postMessage({
            type: "static_build_viewer_loaded",
            circuitJson: circuitJson,
            buildDirectoryUrl: buildDirectoryUrl
          }, "*")
        }
      }}
    />
  )
}

root.render(
  <React.StrictMode>
    <StaticBuildViewerApp />
  </React.StrictMode>,
)
