# RunFrameStaticBuildViewer

A production-ready React component for viewing static circuit JSON files with support for multiple file selection, export functionality, and customizable UI elements.

## Features

- **Static File Loading**: Load circuit JSON files directly from memory or static sources
- **Multiple File Support**: Switch between different circuit JSON files with a searchable selector
- **Export Functionality**: Export circuits in various formats (JSON, ZIP, GLB)
- **Customizable UI**: Toggle file selector, file menu, and other UI elements
- **Responsive Design**: Built with Tailwind CSS for modern, responsive layouts
- **TypeScript Support**: Full TypeScript type safety and IntelliSense
- **Modular Architecture**: Built with reusable components following runframe patterns

## Installation

The component is part of the runframe library. Ensure you have the required dependencies installed:

```bash
npm install circuit-json lucide-react react
```

## Quick Start

```tsx
import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer"
import type { CircuitJson } from "circuit-json"

// Example circuit data
const circuitFiles: Record<string, CircuitJson> = {
  "circuit.json": yourCircuitData1,
  "board.json": yourCircuitData2,
}

function App() {
  return (
    <div className="h-screen">
      <RunFrameStaticBuildViewer
        circuitJsonFiles={circuitFiles}
        defaultFilename="circuit.json"
        onFileChange={(filename, circuitJson) => {
          console.log(`Loaded ${filename}`, circuitJson)
        }}
      />
    </div>
  )
}
```

## Props

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `circuitJsonFiles` | `Record<string, CircuitJson>` | Object mapping filenames to CircuitJson data |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultFilename` | `string` | `"circuit.json"` | Default file to load initially |
| `debug` | `boolean` | `false` | Enable debug mode |
| `scenarioSelectorContent` | `ReactNode` | `undefined` | Content to display in scenario selector area |
| `defaultActiveTab` | `TabId` | `"pcb"` | Default active tab when component loads |
| `defaultToFullScreen` | `boolean` | `false` | Whether to start in full-screen mode |
| `showToggleFullScreen` | `boolean` | `true` | Whether to show the toggle full-screen button |
| `onCircuitJsonLoaded` | `(circuitJson: CircuitJson, filename: string) => void` | `undefined` | Callback when circuit JSON is loaded |
| `onFileChange` | `(filename: string, circuitJson: CircuitJson) => void` | `undefined` | Callback when file selection changes |
| `onExport` | `(format: string, filename: string) => void` | `undefined` | Callback when export is triggered |
| `showFileSelector` | `boolean` | `true` | Whether to show the file selector |
| `showFileMenu` | `boolean` | `true` | Whether to show the file menu |
| `exportFormats` | `string[]` | `["json", "zip", "glb"]` | Available export formats |
| `className` | `string` | `undefined` | Optional className for styling |

## Examples

### Basic Usage

```tsx
import { RunFrameStaticBuildViewer } from "lib/components/RunFrameStaticBuildViewer"

const basicExample = () => {
  const circuitFiles = {
    "simple-circuit.json": {
      // Your circuit JSON data
    }
  }

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitFiles}
      defaultFilename="simple-circuit.json"
    />
  )
}
```

### With Custom Callbacks

```tsx
const withCallbacksExample = () => {
  const handleFileChange = (filename: string, circuitJson: CircuitJson) => {
    console.log(`File changed to: ${filename}`)
    // Update your application state
  }

  const handleExport = (format: string, filename: string) => {
    console.log(`Exporting ${filename} as ${format}`)
    // Handle export logic
  }

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitFiles}
      onFileChange={handleFileChange}
      onExport={handleExport}
      exportFormats={["json", "zip"]}
    />
  )
}
```

### Custom UI Configuration

```tsx
const customUIExample = () => {
  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitFiles}
      showFileSelector={false} // Hide file selector
      showFileMenu={true}      // Show file menu
      defaultToFullScreen={true}
      showToggleFullScreen={false}
      className="border rounded-lg shadow-lg"
    />
  )
}
```

### With Scenario Selector

```tsx
const withScenarioExample = () => {
  const scenarioContent = (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Scenario:</span>
      <select className="px-2 py-1 border rounded text-sm">
        <option>Default</option>
        <option>Alternative</option>
      </select>
    </div>
  )

  return (
    <RunFrameStaticBuildViewer
      circuitJsonFiles={circuitFiles}
      scenarioSelectorContent={scenarioContent}
    />
  )
}
```

## Architecture

The `RunFrameStaticBuildViewer` is built with a modular architecture:

### Core Components

1. **RunFrameStaticBuildViewer** - Main orchestrator component
2. **CircuitJsonFileSelector** - Reusable file selection dropdown
3. **StaticBuildFileMenu** - File menu with export functionality
4. **CircuitJsonPreview** - Circuit preview and display

### Utilities

1. **autoLoadCircuitJsonFiles** - Data loading utility for static and async files
2. **loadCircuitJsonFilesSync** - Synchronous file loading for static data

### Data Flow

```
circuitJsonFiles → autoLoadCircuitJsonFiles → CircuitJsonFileSelector
                                                              ↓
RunFrameStaticBuildViewer ← StaticBuildFileMenu ← CircuitJsonPreview
```

## Styling

The component uses Tailwind CSS classes for styling. You can customize the appearance by:

1. Using the `className` prop to add custom styles
2. Overriding CSS variables in your stylesheet
3. Using the component's modular structure to style individual parts

## Error Handling

The component provides built-in error handling for:

- Missing or invalid circuit JSON files
- File loading failures
- Invalid file formats
- Network errors (for async loading)

Error states are displayed with user-friendly messages and available file information.

## Performance

- **Lazy Loading**: Components are loaded only when needed
- **Memoization**: React hooks are used to optimize re-renders
- **Efficient State Management**: Local state is managed efficiently
- **Virtual Scrolling**: Large circuit lists are handled efficiently

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

When contributing to this component:

1. Follow the established runframe patterns
2. Maintain TypeScript type safety
3. Add comprehensive JSDoc comments
4. Include examples for new features
5. Update documentation as needed

## License

This component is part of the runframe project and follows the same license terms.
