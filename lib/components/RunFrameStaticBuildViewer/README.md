# RunFrameStaticBuildViewer

The `RunFrameStaticBuildViewer` component provides the exact same UI as `RunFrameForCli` but works with prebuilt circuit JSON files instead of running tscircuit code. This is designed for viewing projects that have been prebuilt with `tsci build`.

## Features

- **Same UI as RunFrameForCli**: Identical layout, header, and functionality
- **Prebuilt Circuit JSON**: Works with circuit JSON files instead of running code
- **File Selection**: Switch between multiple circuit JSON files
- **Export Functionality**: Full export support (Circuit JSON, Fabrication Files, GLB)
- **No Code Execution**: Avoids running tscircuit in the browser for better performance

## Usage

### Basic Usage

```tsx
import { RunFrameStaticBuildViewer } from "@tscircuit/runframe/runner"

const App = () => (
  <RunFrameStaticBuildViewer
    circuitJsonFiles={{
      "main.circuit.json": myCircuitJson,
      "test.circuit.json": testCircuitJson,
    }}
    initialFile="main.circuit.json"
    projectName="My Project"
  />
)
```

### Loading from URLs

```tsx
import { 
  RunFrameStaticBuildViewer,
  autoLoadCircuitJsonFiles 
} from "@tscircuit/runframe/runner"

const App = () => {
  const [files, setFiles] = useState(null)
  
  useEffect(() => {
    autoLoadCircuitJsonFiles({
      baseUrl: "https://api.example.com/circuits/",
      filePaths: ["main.circuit.json", "test.circuit.json"]
    }).then(setFiles)
  }, [])
  
  if (!files) return <div>Loading...</div>
  
  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={files}
      projectName="Remote Project"
    />
  )
}
```

### Integration with tscircuit.com

```tsx
// This replaces the current RunFrame implementation at:
// https://tscircuit.com/seveibar/led-water-accelerometer/releases/8b90619f-14ef-4c5a-89f1-2476566c08a5/preview

const TscircuitPreview = ({ username, projectName, releaseId }) => {
  const [circuitFiles, setCircuitFiles] = useState(null)
  
  useEffect(() => {
    // Load prebuilt circuit JSON files from the release
    loadReleaseFiles(username, projectName, releaseId)
      .then(setCircuitFiles)
  }, [username, projectName, releaseId])
  
  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitFiles}
      projectName={`${username}/${projectName}`}
      isWebEmbedded={true}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `circuitJsonFiles` | `Record<string, CircuitJson>` | - | Map of file paths to circuit JSON data |
| `initialFile` | `string` | - | Initial file to display |
| `projectName` | `string` | `"circuit"` | Project name used for exports |
| `isWebEmbedded` | `boolean` | `false` | Whether embedded in a web page |
| `debug` | `boolean` | `false` | Enable debug mode |
| `scenarioSelectorContent` | `React.ReactNode` | - | Additional header content |

## Utility Functions

### `autoLoadCircuitJsonFiles`

Automatically loads circuit JSON files from various sources:

```tsx
// From URLs
const files = await autoLoadCircuitJsonFiles({
  baseUrl: "https://api.example.com/",
  filePaths: ["main.circuit.json", "test.circuit.json"]
})

// From strings
const files = await autoLoadCircuitJsonFiles({
  "main.circuit.json": '{"type": "circuit", ...}',
  "test.circuit.json": '{"type": "circuit", ...}'
})

// From objects
const files = await autoLoadCircuitJsonFiles({
  "main.circuit.json": circuitJsonObject,
  "test.circuit.json": anotherCircuitJsonObject
})
```

### `circuitJsonFileLoader`

Lower-level loading functions:

```tsx
import { circuitJsonFileLoader } from "@tscircuit/runframe/runner"

// Load from URLs
const files = await circuitJsonFileLoader.loadFromUrls(
  "https://api.example.com/",
  ["main.circuit.json", "test.circuit.json"]
)

// Load from JSON strings
const files = circuitJsonFileLoader.loadFromStrings({
  "main.circuit.json": jsonString
})

// Load from objects
const files = circuitJsonFileLoader.loadFromObjects({
  "main.circuit.json": circuitJsonObject
})
```

## Components

- `RunFrameStaticBuildViewer`: Main component
- `CircuitJsonFileSelector`: File selector for circuit JSON files
- `StaticBuildFileMenu`: File menu with export functionality

## Examples

See the examples directory for complete working examples:
- `example30-static-build-viewer.fixture.tsx`: Basic usage
- `example31-static-build-viewer-async.fixture.tsx`: Async loading
- `example32-tscircuit-integration.fixture.tsx`: tscircuit.com integration
