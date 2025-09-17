import { RunFrameWithApi } from "lib/components/RunFrameWithApi/RunFrameWithApi"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useState, useEffect } from "react"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

export default () => {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.TSCIRCUIT_REGISTRY_API_BASE_URL = `${window.location.origin}/registry`
      window.TSCIRCUIT_REGISTRY_TOKEN =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiYWNjb3VudC0xMjM0IiwiZ2l0aHViX3VzZXJuYW1lIjoidGVzdHVzZXIiLCJzZXNzaW9uX2lkIjoic2Vzc2lvbi0xMjM0IiwidG9rZW4iOiIxMjM0In0.KvHMnB_ths0mI-f8Tj-t-OTOGRUPOEbFunima0dgMcQ"
    }
  }, [])

  useEffect(() => {
    setTimeout(async () => {
      // Reset events
      fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      // Create files with various path lengths to test dynamic width
      const filesToCreate = [
        {
          path: "app.tsx",
          content: `export default () => <div>App</div>`,
        },
        {
          path: "index.ts",
          content: `export * from './app'`,
        },
        {
          path: "components/Button.tsx",
          content: `export const Button = () => <button>Click me</button>`,
        },
        {
          path: "components/ui/Select.tsx",
          content: `export const Select = () => <select></select>`,
        },
        {
          path: "components/ui/forms/Input.tsx",
          content: `export const Input = () => <input />`,
        },
        {
          path: "lib/utils/helpers/data-processing/formatters/DateFormatter.tsx",
          content: `export const DateFormatter = () => null`,
        },
        {
          path: "lib/utils/helpers/data-processing/validators/EmailValidator.ts",
          content: `export const validateEmail = (email: string) => true`,
        },
        {
          path: "features/authentication/components/LoginForm.tsx",
          content: `export const LoginForm = () => <form></form>`,
        },
        {
          path: "features/dashboard/components/widgets/charts/LineChart.tsx",
          content: `export const LineChart = () => <div>Chart</div>`,
        },
        {
          path: "services/api/endpoints/users/authentication/oauth/providers/GoogleOAuthProvider.ts",
          content: `export const GoogleOAuthProvider = {}`,
        },
      ]

      // Create all files
      for (const file of filesToCreate) {
        await fetch("/api/files/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_path: file.path,
            text_content: file.content,
          }),
        })
      }
    }, 500)
  }, [])

  if (!isFileApiAccessible()) {
    return (
      <div className="rf-p-8">
        <h1 className="rf-text-2xl rf-font-bold rf-mb-4">
          Enhanced File Selector Search Test
        </h1>
        <p className="rf-text-muted-foreground">
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    )
  }

  return (
    <div className="rf-h-screen rf-flex rf-flex-col">
      <div className="rf-p-4 rf-border-b rf-bg-muted/50">
        <h1 className="rf-text-xl rf-font-semibold">
          Enhanced File Selector - Search Test
        </h1>
        <p className="rf-text-sm rf-text-muted-foreground rf-mt-2">
          Test the search functionality: Try searching for "Button", "Input",
          "Chart", or "Google". Notice how the dropdown width adjusts
          dynamically for long paths during search.
        </p>
      </div>

      <div className="rf-flex-1">
        <RunFrameWithApi
          debug
          showFilesSwitch
          showFileMenu
          useEnhancedFileSelector
        />
      </div>
    </div>
  )
}
