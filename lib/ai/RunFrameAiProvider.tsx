import type { LanguageModel } from "ai"
import { createContext, useContext, type ReactNode } from "react"

/** AI is opt-in. The host owns provider selection, authentication and transport. */
export interface RunFrameAiConfig {
  /** An AI SDK model configured to use the host's authenticated backend proxy. */
  model: LanguageModel
}

const RunFrameAiContext = createContext<RunFrameAiConfig | undefined>(undefined)

export const RunFrameAiProvider = ({
  ai,
  children,
}: {
  ai?: RunFrameAiConfig
  children: ReactNode
}) => (
  <RunFrameAiContext.Provider value={ai}>{children}</RunFrameAiContext.Provider>
)

/** Returns undefined when AI has not been configured for this frame. */
export const useRunFrameAi = () => useContext(RunFrameAiContext)
