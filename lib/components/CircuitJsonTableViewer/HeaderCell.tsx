import type React from "react"

interface HeaderCellProps {
  column: { name: string }
  field?: () => React.ReactNode
  onTextChange?: (value: string) => void
}

export const HeaderCell: React.FC<HeaderCellProps> = (p) => {
  return (
    <div className="rf-leading-5">
      <div className="rf-py-2 rf-font-bold">{p.column.name}</div>
      <div>
        {p.field?.() ?? (
          <input
            type="text"
            className="rf-border rf-rounded rf-p-1 rf-w-full"
            onChange={(e) => {
              p.onTextChange?.(e.target.value)
            }}
          />
        )}
      </div>
    </div>
  )
}
