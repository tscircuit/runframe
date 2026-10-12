import { fileURLToPath } from "node:url"

// Run fixtures with test-specific services separately so worker and converter
// tests in the parent process retain their real dependencies.
export const runIsolatedUiTest = async (fixture: URL, preload?: URL) => {
  const subprocess = Bun.spawn({
    cmd: [
      process.execPath,
      "test",
      ...(preload ? ["--preload", fileURLToPath(preload)] : []),
      fileURLToPath(fixture),
    ],
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
