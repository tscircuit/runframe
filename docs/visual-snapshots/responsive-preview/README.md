# Responsive preview rendered snapshots

These are genuine browser screenshot captures of the rendered Cosmos fixture,
not HTML/DOM serialization or generated mockups. They document the reproduction;
they are not automated pixel-diff assertions.

## Capture conditions

- Fixture: `examples/example63-responsive-file-selector.fixture.tsx`.
- Runtime source revision: `57332cbf1658eadac923d9e91a693eb02cfc27f0`.
- Browser: Codex in-app browser on macOS, 390 × 844 CSS pixels, device pixel ratio 1.
- Image format: JPEG, 390 × 844 pixels, full viewport, no cropping or image edits.
- Active view: PCB, render completed, initial fit, no pan/zoom, page scroll (0, 0).
- Selected file: `boards/power/VeryLongUnbrokenResponsivePowerSupplyBoardFilenameForTestingSmallScreenNavigation.tsx`.
- `before-closed.jpg`: selector closed, initial state.
- `before-open.jpg`: same state after opening the selector; empty search, recent files collapsed, `boards/power` folder.

The broken selector spans x = -142.53 to 532.53, covering the toolbar. The open
menu spans x = 0 to 715.03, exceeding the 390px viewport.

## Repeat the capture

1. Check out the runtime revision above and install its dependencies.
2. Run `bun start` on an isolated preview server. The fixture seeds three synthetic
   TSX board files into that server, so do not reuse another project's server.
3. Open fixture 63 in the Codex in-app browser with a fresh origin/profile state.
   Use its standalone Cosmos renderer to omit the fixture navigation sidebar.
4. Set the viewport to 390 × 844 before loading the fixture (reload after changing
   the viewport). Wait until the PCB is rendered and the progress indicator disappears.
5. Capture the closed selector, then open it and capture again without typing,
   selecting another file, expanding recent files, scrolling, or changing zoom.

Use the same conditions for the fix comparison. The paired PR descriptions link
to immutable committed image revisions so they keep showing the captured state.
