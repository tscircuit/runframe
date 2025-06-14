import { useState } from "react"
import { Dialog, DialogContent } from "../ui/dialog"
import type { AiReview } from "./types"
import { AiReviewListView } from "./ListAiReviewsView"
import { AiReviewViewView } from "./ViewAiReviewView"

export const AiReviewDialog = ({
  isOpen,
  onClose,
  packageName,
}: {
  isOpen: boolean
  onClose: () => void
  packageName: string | null
}) => {
  const [stage, setStage] = useState<"list_reviews" | "view_review">(
    "list_reviews",
  )
  const [selectedReview, setSelectedReview] = useState<AiReview | null>(null)

  const handleSelect = (review: AiReview) => {
    setSelectedReview(review)
    setStage("view_review")
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setStage("list_reviews")
          setSelectedReview(null)
          onClose()
        }
      }}
    >
      <DialogContent className="rf-max-w-2xl">
        {stage === "list_reviews" && (
          <AiReviewListView
            packageName={packageName}
            onSelectReview={handleSelect}
          />
        )}
        {stage === "view_review" && selectedReview && (
          <AiReviewViewView
            review={selectedReview}
            onBack={() => setStage("list_reviews")}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
