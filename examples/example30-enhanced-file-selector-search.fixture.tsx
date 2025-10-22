import { useState } from "react"
import { EnhancedFileSelectorCombobox } from "lib/components/RunFrameWithApi/EnhancedFileSelectorCombobox"
import { useStyles } from "lib/hooks/use-styles"
import { useLocalStorageState } from "lib/hooks/use-local-storage-state"

export default () => {
  useStyles()
  const [currentFile, setCurrentFile] = useState("app.tsx")
  const [favorites, setFavorites] = useLocalStorageState<string[]>(
    "runframe:example30-search:favorites",
    ["app.tsx", "components/Button.tsx"],
  )

  const handleToggleFavorite = (filePath: string) => {
    setFavorites((prev) =>
      prev.includes(filePath)
        ? prev.filter((f) => f !== filePath)
        : [...prev, filePath],
    )
  }

  // Mock file structure with various path lengths to test dynamic width
  const mockFiles = [
    "app.tsx",
    "index.ts",
    "components/Button.tsx",
    "components/ui/Select.tsx",
    "pages/About.tsx",
    "features/feature-one-extended-version/subfeature-alpha-detailed-implementation/module-beta-expanded-core/components-and-shared-widgets/nested-deep-structure-with-hooks/level-six-extended-context/level-seven-detailed-services/level-eight-expanded-handlers/level-nine-extra-utilities/level-ten-finalized-renderers/level-eleven-ultra-specific/level-twelve-experimental-variants/level-thirteen-temporary-migration/DeepComponent.tsx",
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
    // Added very long file names and paths to test ellipsis
    "VeryLongFileNameThatShouldBeEllipsedInTheDropdown.tsx",
    "AnotherExtremelyLongFileNameForTestingPurposes.ts",
    "features/very-long-feature-name/components/deeply-nested/subdirectory/with-many-levels/VeryLongComponentNameForTesting.tsx",
    "src/components/extremely-verbose-directory-structure/nested-components/ui-elements/form-controls/advanced-inputs/SuperLongInputComponentWithManyFeatures.tsx",
    "lib/utilities/data-processing/advanced-algorithms/machine-learning/neural-networks/deep-learning/VeryComplexAIModelImplementation.ts",
    "pages/dashboard/analytics/reports/quarterly/financial/revenue/breakdown/DetailedRevenueAnalysisReportComponent.tsx",
  ]

  return (
    <div className="rf-h-screen rf-flex rf-flex-col rf-p-2">
      <div className="rf-border rf-rounded-lg rf-p-6 rf-bg-gray-50 rf-flex rf-justify-center">
        <div className="rf-w-fit">
          <EnhancedFileSelectorCombobox
            files={mockFiles}
            currentFile={currentFile}
            onFileChange={setCurrentFile}
            config={{
              pinnedFiles: favorites,
              onToggleFavorite: handleToggleFavorite,
            }}
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
