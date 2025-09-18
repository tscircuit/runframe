import { useState } from "react"
import { EnhancedFileSelectorCombobox } from "lib/components/RunFrameWithApi/enhanced-file-selector-combobox"
import { useStyles } from "lib/hooks/use-styles"

export default () => {
  useStyles()
  const [currentFile, setCurrentFile] = useState("app.tsx")

  // Mock file structure with various path lengths to test dynamic width
  const mockFiles = [
    "app.tsx",
    "index.ts",
    "components/Button.tsx",
    "components/ui/Select.tsx",
    "pages/About.tsx",
    "features/dashboard/components/widgets/charts/LineChart.tsx",
    "lib/utils/helpers/data-processing/validators/EmailValidator.ts",
    "pages/Home.tsx",
    "styles/globals.css",
    "features/authentication/components/LoginForm.tsx",
    "config/database.ts",
    "components/ui/forms/Input.tsx",
    "lib/utils/helpers/data-processing/formatters/DateFormatter.tsx",
    "hooks/useAuth.ts",
    "types/User.ts",
    "middleware/auth.ts",
    "api/routes/users.ts",
    "tests/components/Button.test.tsx",
  ]

  return (
    <div className="rf-h-screen rf-flex rf-flex-col rf-p-2">
      <div className="rf-border rf-rounded-lg rf-p-6 rf-bg-gray-50 rf-flex rf-justify-center">
        <div className="rf-w-fit">
          <EnhancedFileSelectorCombobox
            files={mockFiles}
            currentFile={currentFile}
            onFileChange={setCurrentFile}
          />
        </div>
      </div>

      <div className="rf-mt-4 rf-text-xl rf-text-gray-600">
        <p>
          <strong>Current file:</strong> {currentFile}
        </p>
      </div>
    </div>
  )
}
