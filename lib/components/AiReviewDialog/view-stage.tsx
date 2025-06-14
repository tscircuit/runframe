import { useMemo } from "react"
import { Button } from "../ui/button"
import { DialogHeader, DialogTitle } from "../ui/dialog"
import { marked } from "marked"
import type { AiReview } from "./types"

export const AiReviewViewStage = ({
  review,
  onBack,
}: {
  review: AiReview
  onBack: () => void
}) => {
  const html = useMemo(
    () => marked.parse(review.ai_review_text || ""),
    [review.ai_review_text],
  )
  return (
    <>
      <DialogHeader className="rf-flex rf-flex-row rf-items-center rf-justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          Back
        </Button>
        <DialogTitle>AI Review</DialogTitle>
      </DialogHeader>
      <div
        className="rf-h-64 rf-overflow-y-auto rf-prose rf-max-w-none rf-mt-2"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  )
}
