import * as React from "react"
import type { AnyCircuitElement } from "circuit-json"
import {
  canPreviewFootprint,
  loadFootprintPreviewCircuitJson,
  type FootprintPreviewLoadOptions,
} from "../api/footprint-preview"
import { hasEasyEdaProxyEndpoint } from "lib/optional-features/importing/create-easyeda-proxy-fetch"
import type { ImportComponentDialogSearchResult } from "../types"

type FootprintPreviewState = {
  circuitJson: AnyCircuitElement[] | null
  error: string | null
  isLoading: boolean
}

export const useFootprintPreviewCircuitJson = (
  result: ImportComponentDialogSearchResult | null,
  opts?: FootprintPreviewLoadOptions,
): FootprintPreviewState => {
  const [state, setState] = React.useState<FootprintPreviewState>({
    circuitJson: null,
    error: null,
    isLoading: false,
  })

  React.useEffect(() => {
    if (!result || !canPreviewFootprint(result)) {
      setState({ circuitJson: null, error: null, isLoading: false })
      return
    }

    if (result.source === "jlcpcb" && !hasEasyEdaProxyEndpoint(opts?.jlcpcb)) {
      setState({
        circuitJson: null,
        error: "JLCPCB previews require an EasyEDA proxy from the host app.",
        isLoading: false,
      })
      return
    }

    let cancelled = false

    setState({ circuitJson: null, error: null, isLoading: true })

    loadFootprintPreviewCircuitJson(result, opts)
      .then((circuitJson) => {
        if (cancelled) return
        setState({ circuitJson, error: null, isLoading: false })
      })
      .catch((error) => {
        if (cancelled) return
        setState({
          circuitJson: null,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load footprint preview",
          isLoading: false,
        })
      })

    return () => {
      cancelled = true
    }
  }, [result, opts])

  return state
}
