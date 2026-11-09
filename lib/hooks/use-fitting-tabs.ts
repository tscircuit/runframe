import { useLayoutEffect, useRef, useState } from "react"

/** Keep optional tabs in the overflow menu when the header cannot fit them. */
export const useFittingTabs = (layoutKey: string) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fittingTabs, setFittingTabs] = useState<string[]>([])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const measure = () => {
      const list = container.querySelector<HTMLElement>('[role="tablist"]')
      if (!list) return
      const optional = Array.from(
        list.querySelectorAll<HTMLElement>("[data-optional-tab]"),
      )
      // Hidden candidates stay measurable without taking up layout space.
      let remaining =
        container.clientWidth -
        8 -
        Array.from(container.children)
          .filter((child) => child !== list)
          .reduce(
            (width, child) => width + child.getBoundingClientRect().width + 8,
            0,
          )
      for (const child of Array.from(list.children)) {
        if (!(child as HTMLElement).dataset.optionalTab) {
          remaining -= child.getBoundingClientRect().width
        }
      }
      const next: string[] = []
      for (const tab of optional) {
        const width = tab.getBoundingClientRect().width
        if (width <= remaining) {
          next.push(tab.dataset.optionalTab!)
          remaining -= width
        }
      }
      setFittingTabs((previous) =>
        previous.join() === next.join() ? previous : next,
      )
    }
    measure()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measure)
    observer.observe(container)
    for (const child of Array.from(
      container.querySelectorAll('[role="tab"], button'),
    )) {
      observer.observe(child)
    }
    return () => observer.disconnect()
  }, [layoutKey])

  return { containerRef, fittingTabs }
}
