export const tips = [
  "Always initialize your project using ['tsci init'](https://github.com/tscircuit/cli) before adding components.",
  "Use the visual editor for real-time PCB layout and placement feedback.",
  "Leverage automatic routing for faster PCB trace connections.",
  "Define reusable subcircuits for common electronic patterns.",
  "Utilize board constraints to stay within manufacturing parameters.",
  "Run 'tsci dev' to preview your boards before export.",
  "Use units like mm or mils consistently across your designs.",
  "Reference the 'element' docs for correct pin and footprint placement.",
  "Consult 'ordering-prototypes' for recommended PCB fab workflows.",
  "Use 'net' and 'group' constructs to organize complex schematics.",
  "Review 'manual-edits' for advanced board customization.",
  "Serialize your circuits to JSON for interoperability and versioning.",
  "Import components from external libraries with 'importing-modules-and-chips'.",
  "Leverage the image generation API to render board previews.",
  "Use 'essential-elements' to quickly scaffold new circuits.",
  "Check 'platform-configuration' for custom toolchain commands.",
  "Optimize layouts using the 'automatic-layout' guide.",
  "Stick to known footprints for easier assembly and rework.",
  "Configure chips using pin selectors for precise control.",
  "Publish modules via the registry for team-wide access.",
  "Explore tutorials for real-world circuit design examples.",
  "Upload your Circuit JSON to circuitjson.com for a quick preview.",
  "Use the <CircuitJsonPreview /> component to display all available previews for a Circuit JSON array.",
  "Use a <group /> element to move multiple components at once in a schematic or PCB layout.",
  "Refer to the GitHub Discussions page to request more platform features tailored to your needs.",
  "Use the grid function from math-utils to create a grid of components for LED matrix layouts.",
  "Use the RootCircuit platform configuration to customize registry and autorouter behavior.",
  "Use the <constraint /> element to enforce geometric relationships in PCB designs.",
  "Follow the recommended contribution order to understand the tscircuit ecosystem better.",
  "Join the Discord server to discuss issues and get help directly from the community.",
  "Reach out to enterprise support for running the tscircuit platform privately within your organization.",
]

export const getRandomTipForUser = () => {
  let tip = tips[Math.floor(Math.random() * tips.length)]

  tip = tip.replace(
    /(?<!href=")(?<!\()(?<!\]\()(https?:\/\/[^\s\)\]]+)/g,
    (match, p1) =>
      `<a class="rf-text-blue-500 rf-underline"  href="${match}" target="_blank">${match}</a>`,
  )
  tip = tip.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
    '<a class="rf-text-blue-500 rf-underline" href="$2" target="_blank">$1</a>',
  )

  return tip
}
