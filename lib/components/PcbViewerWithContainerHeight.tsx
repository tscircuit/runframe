import { PCBViewer } from "@tscircuit/pcb-viewer"
import type { AnyCircuitElement } from "circuit-json"
import { type ComponentProps, useLayoutEffect, useRef, useState } from "react"

type PCBViewerProps = ComponentProps<typeof PCBViewer>

export const PcbViewerWithContainerHeight = ({
  circuitJson,
  containerClassName,
  ...props
}: {
  containerClassName?: string
  circuitJson?: AnyCircuitElement[]
} & Omit<PCBViewerProps, "circuitJson">) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [computedHeight, setComputedHeight] = useState(620)

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight
        const screenHeight = window.innerHeight
        setComputedHeight(
          Math.min(Math.max(containerHeight, 620), screenHeight),
        )
      }
    }

    // Immediate synchronous calculation
    updateHeight()

    // Resize listener for dynamic changes
    const resizeObserver = new ResizeObserver(updateHeight)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Fallback for window resize
    window.addEventListener("resize", updateHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateHeight)
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={containerClassName || "rf-w-full rf-h-full"}
    >
      <PCBViewer
        {...props}
        circuitJson={circuitJson as PCBViewerProps["circuitJson"]}
        height={computedHeight}
      />
    </div>
  )
}
