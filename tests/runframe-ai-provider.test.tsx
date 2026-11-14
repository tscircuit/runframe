import { expect, mock, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import {
  RunFrameAiProvider,
  useRunFrameAi,
  type RunFrameAi,
} from "../lib/ai/RunFrameAiProvider"

test("AI configuration is idle, scoped and optional", () => {
  const generate = mock(async () => "response")
  const ai: RunFrameAi = { generate }
  const seen: (RunFrameAi | undefined)[] = []
  const Probe = () => {
    seen.push(useRunFrameAi())
    return null
  }
  renderToStaticMarkup(
    <>
      <RunFrameAiProvider ai={ai}>
        <Probe />
        <RunFrameAiProvider>
          <Probe />
        </RunFrameAiProvider>
        <Probe />
      </RunFrameAiProvider>
      <Probe />
    </>,
  )
  expect(seen).toEqual([ai, undefined, ai, undefined])
  expect(generate).not.toHaveBeenCalled()
})
