import { expect, test } from "bun:test"
import { sanitizeFileName } from "../lib/utils/sanitizeFileName"

test.each([
  ["CON", "_CON"],
  ["con.txt", "_con.txt"],
  ["NUL.tar.gz", "_NUL.tar.gz"],
  ["PrN.board", "_PrN.board"],
  ["aux.revA", "_aux.revA"],
  ["COM1.board", "_COM1.board"],
  ["lpt9.json", "_lpt9.json"],
  ["COM¹.board", "_COM¹.board"],
  ["LPT²", "_LPT²"],
  ["com³", "_com³"],
])("prefixes reserved Windows project name %s", (input, expected) => {
  expect(sanitizeFileName(input)).toBe(expected)
})

test.each([
  ["control.board", "control.board"],
  ["board.NUL", "board.NUL"],
  ["COM10.board", "COM10.board"],
  ["lpt9-board", "lpt9-board"],
  [" example/board ", "example_board"],
  ["...", "untitled"],
])("preserves non-reserved project name %s", (input, expected) => {
  expect(sanitizeFileName(input)).toBe(expected)
})
