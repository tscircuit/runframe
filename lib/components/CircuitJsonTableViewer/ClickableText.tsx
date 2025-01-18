import type React from "react"

interface ClickableTextProps {
  text: string
  onClick: () => void
}

export const ClickableText: React.FC<ClickableTextProps> = ({
  text,
  onClick,
}) => {
  return (
    <span
      className="rf-cursor-pointer rf-underline rf-text-blue-300 rf-mx-2"
      onClick={onClick}
    >
      {text}
    </span>
  )
}
