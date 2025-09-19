import type { CircuitJson } from "circuit-json"

export interface CircuitJsonFileLoader {
  /**
   * Load circuit JSON files from a base URL
   * @param baseUrl Base URL where circuit JSON files are hosted
   * @param filePaths Array of file paths relative to the base URL
   */
  loadFromUrls: (baseUrl: string, filePaths: string[]) => Promise<Record<string, CircuitJson>>
  
  /**
   * Load circuit JSON files from a directory structure
   * @param files Record of file paths to file contents (JSON strings)
   */
  loadFromStrings: (files: Record<string, string>) => Record<string, CircuitJson>
  
  /**
   * Load circuit JSON files that are already parsed
   * @param files Record of file paths to circuit JSON objects
   */
  loadFromObjects: (files: Record<string, CircuitJson>) => Record<string, CircuitJson>
}

/**
 * Utility functions for loading circuit JSON files from various sources
 */
export const circuitJsonFileLoader: CircuitJsonFileLoader = {
  /**
   * Load circuit JSON files from URLs
   */
  loadFromUrls: async (baseUrl: string, filePaths: string[]): Promise<Record<string, CircuitJson>> => {
    const results: Record<string, CircuitJson> = {}
    
    await Promise.all(
      filePaths.map(async (filePath) => {
        try {
          const url = new URL(filePath, baseUrl).toString()
          const response = await fetch(url)
          
          if (!response.ok) {
            console.warn(`Failed to load circuit JSON from ${url}: ${response.statusText}`)
            return
          }
          
          const circuitJson = await response.json()
          results[filePath] = circuitJson
        } catch (error) {
          console.error(`Error loading circuit JSON from ${filePath}:`, error)
        }
      })
    )
    
    return results
  },

  /**
   * Load circuit JSON files from JSON strings
   */
  loadFromStrings: (files: Record<string, string>): Record<string, CircuitJson> => {
    const results: Record<string, CircuitJson> = {}
    
    for (const [filePath, jsonString] of Object.entries(files)) {
      try {
        const circuitJson = JSON.parse(jsonString)
        results[filePath] = circuitJson
      } catch (error) {
        console.error(`Error parsing circuit JSON from ${filePath}:`, error)
      }
    }
    
    return results
  },

  /**
   * Load circuit JSON files that are already objects (passthrough with validation)
   */
  loadFromObjects: (files: Record<string, CircuitJson>): Record<string, CircuitJson> => {
    const results: Record<string, CircuitJson> = {}
    
    for (const [filePath, circuitJson] of Object.entries(files)) {
      if (circuitJson && typeof circuitJson === 'object') {
        results[filePath] = circuitJson
      } else {
        console.warn(`Invalid circuit JSON object for ${filePath}`)
      }
    }
    
    return results
  }
}

/**
 * Helper function to automatically detect and load circuit JSON files from various formats
 */
export const autoLoadCircuitJsonFiles = async (
  input: string | Record<string, string | CircuitJson> | { baseUrl: string; filePaths: string[] }
): Promise<Record<string, CircuitJson>> => {
  // If input is a string, treat it as a single URL
  if (typeof input === 'string') {
    try {
      const response = await fetch(input)
      if (!response.ok) {
        throw new Error(`Failed to load: ${response.statusText}`)
      }
      const circuitJson = await response.json()
      return { [input]: circuitJson }
    } catch (error) {
      console.error(`Error loading circuit JSON from ${input}:`, error)
      return {}
    }
  }
  
  // If input has baseUrl and filePaths, load from URLs
  if ('baseUrl' in input && 'filePaths' in input) {
    return circuitJsonFileLoader.loadFromUrls(input.baseUrl, input.filePaths)
  }
  
  // Otherwise, treat as a record of files
  const files = input as Record<string, string | CircuitJson>
  const stringFiles: Record<string, string> = {}
  const objectFiles: Record<string, CircuitJson> = {}
  
  // Separate string and object files
  for (const [filePath, content] of Object.entries(files)) {
    if (typeof content === 'string') {
      stringFiles[filePath] = content
    } else {
      objectFiles[filePath] = content
    }
  }
  
  // Load both types and merge results
  const stringResults = circuitJsonFileLoader.loadFromStrings(stringFiles)
  const objectResults = circuitJsonFileLoader.loadFromObjects(objectFiles)
  
  return { ...stringResults, ...objectResults }
}
