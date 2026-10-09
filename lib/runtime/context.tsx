import {
  createContext,
  useContext,
  type ComponentType,
  type ReactNode,
} from "react"
import { getDefaultRuntime } from "lib/runtime/default-runtime"
import type { RunFrameRuntime, RunFrameRuntimeProps } from "./types"

const RuntimeContext = createContext<RunFrameRuntime | null>(null)

export const RunFrameRuntimeProvider = ({
  runtime,
  children,
}: {
  runtime: RunFrameRuntime
  children: ReactNode
}) => (
  <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>
)

export const useRunFrameRuntime = () =>
  useContext(RuntimeContext) ?? getDefaultRuntime()

/** Give public components a runtime before their hooks and children execute. */
export const withRunFrameRuntime = <P extends object>(
  Component: ComponentType<P>,
) => {
  const WithRuntime = (props: P & RunFrameRuntimeProps) => {
    const inherited = useContext(RuntimeContext)
    const runtime = props.runtime ?? inherited ?? getDefaultRuntime()
    return (
      <RunFrameRuntimeProvider runtime={runtime}>
        <Component {...props} />
      </RunFrameRuntimeProvider>
    )
  }
  WithRuntime.displayName = `WithRuntime(${Component.displayName ?? Component.name})`
  return WithRuntime
}
