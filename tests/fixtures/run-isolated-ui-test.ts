import { fileURLToPath } from "node:url"

// Bun module mocks persist across test files. Run UI fixtures that replace
// dependencies separately so real worker and converter tests retain theirs.
export const runIsolatedUiTest = async (fixture: URL) => {
  const subprocess = Bun.spawn({
    cmd: [process.execPath, "test", fileURLToPath(fixture)],
    stdout: "pipe",
    stderr: "pipe",
  })
  const timeout = setTimeout(() => subprocess.kill(), 20000)
  try {
    const [exitCode, stdout, stderr] = await Promise.all([
      subprocess.exited,
      new Response(subprocess.stdout).text(),
      new Response(subprocess.stderr).text(),
    ])
    if (exitCode !== 0) {
      throw new Error(
        `Isolated UI test failed (${exitCode}):\n${stdout}${stderr}`,
      )
    }
  } finally {
    clearTimeout(timeout)
  }
}
