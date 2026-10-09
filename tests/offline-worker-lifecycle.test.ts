import { expect, test } from "bun:test"

test("offline worker startup, replacement and cleanup do not resolve public packages", async () => {
  const child = Bun.spawn(
    [
      process.execPath,
      new URL("./fixtures/offline-worker-lifecycle.tsx", import.meta.url)
        .pathname,
    ],
    { stdout: "pipe", stderr: "pipe" },
  )
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])
  expect({
    exitCode,
    diagnostics: exitCode ? `${stdout}\n${stderr}` : "",
  }).toEqual({ exitCode: 0, diagnostics: "" })
  expect(stdout).toContain("Offline worker lifecycle checks passed")
})
