import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface RunnerState {
  lastRunEvalVersion?: string

  setLastRunEvalVersion: (version?: string) => void
}

export const useRunnerStore = create<RunnerState>()(
  devtools(
    (set) => ({
      lastRunEvalVersion: undefined,

      setLastRunEvalVersion: (version?: string) => {
        set({ lastRunEvalVersion: version })
      },
    }),
    { name: "runframe-runner-store" },
  ),
)
