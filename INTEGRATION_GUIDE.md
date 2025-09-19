# RunFrameStaticBuildViewer Integration Guide

This guide shows how to integrate the new `RunFrameStaticBuildViewer` component into tscircuit.com to replace the current RunFrame implementation for prebuilt projects.

## Overview

The `RunFrameStaticBuildViewer` component provides the exact same UI as `RunFrameForCli` but works with prebuilt circuit JSON files instead of running tscircuit code in the browser. This improves performance and allows viewing of projects that have been prebuilt with `tsci build`.

## Current vs New Implementation

### Current (to be replaced)
```
https://tscircuit.com/seveibar/led-water-accelerometer/releases/8b90619f-14ef-4c5a-89f1-2476566c08a5/preview
```
- Uses RunFrame component
- Rebuilds circuit in browser
- Slower initial load
- Requires tscircuit execution

### New (RunFrameStaticBuildViewer)
```
https://tscircuit.com/seveibar/led-water-accelerometer/releases/8b90619f-14ef-4c5a-89f1-2476566c08a5/preview
```
- Uses RunFrameStaticBuildViewer component
- Loads prebuilt circuit JSON files
- Faster initial load
- No code execution required

## Integration Steps

### 1. Install/Update Dependencies

Ensure you have the latest version of `@tscircuit/runframe` that includes the new component:

```bash
npm install @tscircuit/runframe@latest
# or
yarn add @tscircuit/runframe@latest
```

### 2. Import the Component

```tsx
import { 
  RunFrameStaticBuildViewer,
  autoLoadCircuitJsonFiles 
} from "@tscircuit/runframe/runner"
```

### 3. Replace Current Implementation

Replace the current RunFrame usage with RunFrameStaticBuildViewer:

```tsx
// Before (current implementation)
import { RunFrame } from "@tscircuit/runframe/runner"

const ProjectPreview = ({ username, projectName, releaseId }) => {
  // ... existing code that loads and runs tscircuit code
  return (
    <RunFrame
      fsMap={fsMap}
      entrypoint="main.tsx"
      // ... other props
    />
  )
}

// After (new implementation)
import { RunFrameStaticBuildViewer, autoLoadCircuitJsonFiles } from "@tscircuit/runframe/runner"

const ProjectPreview = ({ username, projectName, releaseId }) => {
  const [circuitJsonFiles, setCircuitJsonFiles] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadFiles = async () => {
      try {
        // Load prebuilt circuit JSON files from your API
        const baseUrl = `${API_BASE_URL}/projects/${username}/${projectName}/releases/${releaseId}/circuits/`
        const filePaths = await getCircuitFileList(username, projectName, releaseId)
        
        const files = await autoLoadCircuitJsonFiles({
          baseUrl,
          filePaths
        })
        
        setCircuitJsonFiles(files)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadFiles()
  }, [username, projectName, releaseId])

  if (loading) return <div>Loading project...</div>
  if (error) return <div>Error: {error}</div>
  if (!circuitJsonFiles) return <div>No circuit files found</div>

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitJsonFiles}
      initialFile="main.circuit.json" // or determine from API
      projectName={`${username}/${projectName}`}
      isWebEmbedded={true}
      scenarioSelectorContent={
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span>{username}/{projectName}</span>
          <span>•</span>
          <span>Release {releaseId.slice(0, 8)}</span>
        </div>
      }
    />
  )
}
```

### 4. API Changes Required

You'll need to ensure your API can serve prebuilt circuit JSON files. The expected structure:

```
GET /api/projects/{username}/{projectName}/releases/{releaseId}/circuits/
Response: ["main.circuit.json", "test.circuit.json", "production.circuit.json"]

GET /api/projects/{username}/{projectName}/releases/{releaseId}/circuits/main.circuit.json
Response: { /* circuit JSON object */ }
```

### 5. Build Process Integration

Ensure your build process generates circuit JSON files:

```bash
# During project build/release creation
tsci build --output-dir ./circuits/
# This should generate:
# - main.circuit.json
# - test.circuit.json (if tests exist)
# - Any other circuit variants
```

## Features Maintained

The new component maintains all the features of the original:

✅ **Same UI**: Identical layout and appearance  
✅ **Export functionality**: File > Export works exactly the same  
✅ **Multiple views**: PCB, Schematic, Assembly, 3D, BOM, Circuit JSON  
✅ **File switching**: Can switch between multiple circuit files  
✅ **Fullscreen mode**: Same fullscreen toggle behavior  
✅ **Error handling**: Proper error display and handling  

## Benefits

- **Performance**: No code execution in browser = faster loading
- **Reliability**: No risk of code execution errors
- **Scalability**: Better for serving many users
- **Caching**: Circuit JSON files can be cached effectively
- **SEO**: Faster initial load improves SEO metrics

## Testing

Test the integration with the provided examples:
1. `example30-static-build-viewer.fixture.tsx` - Basic functionality
2. `example31-static-build-viewer-async.fixture.tsx` - Async loading
3. `example32-tscircuit-integration.fixture.tsx` - Full integration example

## Rollback Plan

If issues arise, you can easily rollback by switching the import back to the original RunFrame component while keeping the same props structure.

## Support

For issues or questions about the integration, please refer to:
- Component documentation: `lib/components/RunFrameStaticBuildViewer/README.md`
- Example implementations in the `examples/` directory
- GitHub issue #1180 for the original requirements
