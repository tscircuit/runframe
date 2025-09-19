# RunFrame Integration Guide

This guide provides comprehensive instructions for integrating the RunFrameStaticBuildViewer component into your applications.

## Overview

The RunFrameStaticBuildViewer is a production-ready React component designed for viewing static circuit JSON files. It provides a clean, modular interface with support for multiple file selection, export functionality, and customizable UI elements.

## Prerequisites

Before integrating RunFrameStaticBuildViewer, ensure your project meets these requirements:

### Dependencies

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "circuit-json": "^1.0.0",
    "lucide-react": "^0.263.1"
  }
}
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true
  }
}
```

## Installation

### From Source

If you're working with the runframe source code:

```bash
# Clone the repository
git clone <runframe-repo-url>
cd runframe

# Install dependencies
npm install

# Build the project
npm run build
```

### As a Package

When runframe is published as a package:

```bash
npm install runframe
```

## Quick Start

### Basic Integration

```tsx
import { RunFrameStaticBuildViewer } from "runframe"
import type { CircuitJson } from "circuit-json"

function App() {
  // Your circuit JSON data
  const circuitFiles: Record<string, CircuitJson> = {
    "circuit.json": yourCircuitData,
    "board.json": yourBoardData,
  }

  return (
    <div className="h-screen">
      <RunFrameStaticBuildViewer
        circuitJsonFiles={circuitFiles}
        defaultFilename="circuit.json"
      />
    </div>
  )
}
```

## Integration Patterns

### 1. Static File Loading

For applications with pre-loaded circuit data:

```tsx
import { RunFrameStaticBuildViewer } from "runframe"
import { loadCircuitJsonFilesSync } from "runframe/utils"

function StaticCircuitViewer() {
  // Load circuit files from your data source
  const circuitFiles = loadCircuitJsonFilesSync({
    "circuit.json": fetchCircuitData(),
    "schematic.json": fetchSchematicData(),
  })

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitFiles}
      onFileChange={(filename, circuitJson) => {
        // Handle file changes
        console.log(`Loaded ${filename}`)
      }}
    />
  )
}
```

### 2. Dynamic Loading with State Management

For applications that need to manage circuit state:

```tsx
import { useState, useCallback } from "react"
import { RunFrameStaticBuildViewer } from "runframe"

function DynamicCircuitViewer() {
  const [circuitFiles, setCircuitFiles] = useState<Record<string, CircuitJson>>({})
  const [selectedFile, setSelectedFile] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  const loadCircuits = useCallback(async () => {
    try {
      setIsLoading(true)
      const files = await fetchCircuitFilesFromAPI()
      setCircuitFiles(files)
      setSelectedFile(Object.keys(files)[0] || "")
    } catch (error) {
      console.error("Failed to load circuits:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  if (isLoading) {
    return <div>Loading circuits...</div>
  }

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitFiles}
      defaultFilename={selectedFile}
      onFileChange={(filename, circuitJson) => {
        setSelectedFile(filename)
        // Update application state
      }}
    />
  )
}
```

### 3. Custom UI Integration

For applications requiring custom UI elements:

```tsx
import { RunFrameStaticBuildViewer } from "runframe"

function CustomCircuitViewer() {
  const customScenarioContent = (
    <div className="flex items-center gap-4">
      <button className="px-3 py-1 bg-blue-500 text-white rounded">
        Run Simulation
      </button>
      <select className="px-2 py-1 border rounded">
        <option>Scenario 1</option>
        <option>Scenario 2</option>
      </select>
    </div>
  )

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-100 border-b">
        <h1 className="text-xl font-bold">Circuit Designer</h1>
      </header>
      
      <div className="flex-1">
        <RunFrameStaticBuildViewer
          circuitJsonFiles={circuitFiles}
          scenarioSelectorContent={customScenarioContent}
          showFileSelector={true}
          showFileMenu={true}
          onExport={(format, filename) => {
            // Handle custom export logic
            handleExport(format, filename)
          }}
        />
      </div>
    </div>
  )
}
```

### 4. Multi-Panel Layout

For complex applications with multiple panels:

```tsx
import { RunFrameStaticBuildViewer } from "runframe"

function MultiPanelCircuitEditor() {
  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-50 border-r p-4">
        <h2 className="font-semibold mb-4">Components</h2>
        {/* Component list */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Circuit Viewer */}
        <div className="flex-1">
          <RunFrameStaticBuildViewer
            circuitJsonFiles={circuitFiles}
            showFileSelector={false}
            className="h-full"
          />
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-gray-50 border-l p-4">
          <h2 className="font-semibold mb-4">Properties</h2>
          {/* Properties editor */}
        </div>
      </div>
    </div>
  )
}
```

## Advanced Integration

### Custom Export Handlers

```tsx
function AdvancedCircuitViewer() {
  const handleExport = useCallback(async (format: string, filename: string) => {
    try {
      const circuitJson = circuitFiles[filename]
      
      switch (format) {
        case "json":
          await exportAsJSON(circuitJson, filename)
          break
        case "zip":
          await exportAsZIP(circuitJson, filename)
          break
        case "glb":
          await exportAsGLB(circuitJson, filename)
          break
        default:
          console.warn(`Unsupported export format: ${format}`)
      }
    } catch (error) {
      console.error(`Export failed for ${format}:`, error)
      // Show error to user
    }
  }, [circuitFiles])

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitFiles}
      onExport={handleExport}
      exportFormats={["json", "zip", "glb", "svg"]}
    />
  )
}
```

### Error Boundaries and Loading States

```tsx
import { ErrorBoundary } from "react-error-boundary"

function CircuitViewerWithErrorHandling() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p>Loading circuit viewer...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <h3 className="font-semibold mb-2">Failed to Load Circuit Viewer</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="font-semibold text-red-800 mb-2">Circuit Viewer Error</h3>
          <p className="text-red-600 mb-2">{error.message}</p>
          <button
            onClick={resetErrorBoundary}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    >
      <RunFrameStaticBuildViewer
        circuitJsonFiles={circuitFiles}
        onCircuitJsonLoaded={(circuitJson, filename) => {
          console.log(`Circuit loaded: ${filename}`)
        }}
      />
    </ErrorBoundary>
  )
}
```

## Performance Optimization

### Lazy Loading

```tsx
import { lazy, Suspense } from "react"

const RunFrameStaticBuildViewer = lazy(() => import("runframe").then(mod => ({
  default: mod.RunFrameStaticBuildViewer
})))

function LazyCircuitViewer() {
  return (
    <Suspense fallback={<div>Loading circuit viewer...</div>}>
      <RunFrameStaticBuildViewer
        circuitJsonFiles={circuitFiles}
      />
    </Suspense>
  )
}
```

### Memoization

```tsx
import { useMemo, useCallback } from "react"

function OptimizedCircuitViewer() {
  const memoizedCircuitFiles = useMemo(() => circuitFiles, [circuitFiles])
  
  const handleFileChange = useCallback((filename: string, circuitJson: CircuitJson) => {
    // Optimized callback
    updateSelectedFile(filename)
  }, [])

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={memoizedCircuitFiles}
      onFileChange={handleFileChange}
    />
  )
}
```

## Testing

### Unit Testing

```tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { RunFrameStaticBuildViewer } from "runframe"

describe("RunFrameStaticBuildViewer", () => {
  const mockCircuitFiles = {
    "test.json": { /* mock circuit data */ }
  }

  it("renders circuit viewer with files", () => {
    render(
      <RunFrameStaticBuildViewer
        circuitJsonFiles={mockCircuitFiles}
      />
    )
    
    expect(screen.getByText("Circuit File")).toBeInTheDocument()
  })

  it("calls onFileChange when file is selected", () => {
    const mockOnFileChange = jest.fn()
    
    render(
      <RunFrameStaticBuildViewer
        circuitJsonFiles={mockCircuitFiles}
        onFileChange={mockOnFileChange}
      />
    )
    
    // Simulate file selection
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "test.json" }
    })
    
    expect(mockOnFileChange).toHaveBeenCalledWith("test.json", expect.any(Object))
  })
})
```

## Troubleshooting

### Common Issues

1. **Module Not Found Errors**
   ```bash
   # Ensure proper module resolution
   npm install @types/react @types/node
   ```

2. **TypeScript Errors**
   ```tsx
   // Add proper type imports
   import type { CircuitJson } from "circuit-json"
   import type { RunFrameStaticBuildViewerProps } from "runframe"
   ```

3. **Styling Issues**
   ```css
   /* Ensure Tailwind CSS is properly configured */
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

### Debug Mode

Enable debug mode for troubleshooting:

```tsx
<RunFrameStaticBuildViewer
  circuitJsonFiles={circuitFiles}
  debug={true}
/>
```

## Best Practices

1. **State Management**: Use React's built-in state management for simple cases, or integrate with Redux/Zustand for complex applications
2. **Error Handling**: Always implement proper error boundaries and loading states
3. **Performance**: Use memoization and lazy loading for large applications
4. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
5. **Testing**: Write comprehensive unit and integration tests

## Support

For issues and questions:
- Check the [GitHub Issues](https://github.com/your-org/runframe/issues)
- Review the [API Documentation](./docs/api.md)
- Join our [Discord Community](https://discord.gg/runframe)

## Changelog

### Version 1.0.0
- Initial release of RunFrameStaticBuildViewer
- Support for static circuit JSON file loading
- Export functionality for JSON, ZIP, and GLB formats
- Customizable UI components
- TypeScript support
