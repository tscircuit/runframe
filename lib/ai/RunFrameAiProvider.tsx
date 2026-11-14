import { createContext, useContext, type ReactNode } from "react"

export interface RunFrameAiRequest {
  /** The exact prompt reviewed by the user. */
  prompt: string
  /** Only files explicitly attached by the user; no implicit project upload. */
  attachments: readonly File[]
  signal: AbortSignal
}

/** The host owns model selection, authentication, transport and agent tools. */
export interface RunFrameAi {
  generate: (request: RunFrameAiRequest) => Promise<string>
}

const RunFrameAiContext = createContext<RunFrameAi | undefined>(undefined)

/** Configuration only. Mounting this provider never starts a request. */
export const RunFrameAiProvider = ({
  ai,
  children,
}: {
  ai?: RunFrameAi
  children: ReactNode
}) => (
  <RunFrameAiContext.Provider value={ai}>{children}</RunFrameAiContext.Provider>
)

export const useRunFrameAi = () => useContext(RunFrameAiContext)
