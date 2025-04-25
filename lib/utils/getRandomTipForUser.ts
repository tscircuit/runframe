export const tips = [
  "Always initialize your project using [tsci init](https://github.com/tscircuit/cli) before adding components.",
  "Define reusable modules with cached routes using [<subcircuit />](https://docs.tscircuit.com/elements/subcircuit)",
  "Run `tsci dev` on the command line to preview your boards before export",
  "Use units like mm or mils consistently across your designs.",
  "Quickly set footprints with the [footprint prop](https://docs.tscircuit.com/footprints/footprinter-strings)",
  "Check out the guide on [ordering prototypes](https://docs.tscircuit.com/building-electronics/ordering-prototypes)",
  "Use [net labels](https://docs.tscircuit.com/elements/net) and [group elements](https://docs.tscircuit.com/elements/group) to organize complex schematics.",
  "You can manually drag components on the PCB and Schematic using [manual edits](https://docs.tscircuit.com/guides/manual-edits)",
  "Every tscircuit module can export to [Circuit JSON](https://github.com/tscircuit/circuit-json), Gerbers, Pick'n'Place CSV files, Bill of Materials CSV and more",
  "You can import components from [JLCPCB](https://docs.tscircuit.com/guides/importing-modules-and-chips/importing-from-jlcpcb) or [KiCad](https://docs.tscircuit.com/guides/importing-modules-and-chips/importing-from-kicad)",
  "Any module you push to the [registry](https://tscircuit.com/trending) will have [simple image urls](https://docs.tscircuit.com/web-apis/image-generation-api) you can use display images on a website",
  "The default [Parts Engine](https://docs.tscircuit.com/guides/platform-configuration) will automatically find parts from common vendors for your BOM",
  '[Pin selectors](https://docs.tscircuit.com/guides/using-sel-references) are similar to CSS selectors, ".R1 > .pin1" means "connect to the first pin of the component R1"',
  "You can use the [sel](https://docs.tscircuit.com/guides/using-sel-references) object to select pins in a type-safe way",
  "Publish modules via the [registry](https://tscircuit.com/trending) for working with a team or sharing your work",
  "[Explore tutorials](https://docs.tscircuit.com/category/tutorials) for real-world circuit design examples.",
  "Upload your Circuit JSON to [circuitjson.com](https://circuitjson.com) for a quick preview.",
  "You can display Circuit JSON in 3D, PCB or Schematic mode with the [<CircuitJsonPreview />](https://docs.tscircuit.com/elements/circuitjsonpreview) React component",
  "Use a [<group />](https://docs.tscircuit.com/elements/group) element to move multiple components at once in a schematic or PCB layout.",
  "Refer to the [GitHub Discussions page](https://github.com/tscircuit/tscircuit/discussions) to request features",
  "You can customize the autorouter using the [autorouter prop](https://docs.tscircuit.com/elements/board#setting-the-autorouter)",
  "Use the [<constraint />](https://docs.tscircuit.com/footprints/constraint) element to enforce geometric relationships in PCB designs.",
  "Join the [Discord server](https://tscircuit.com/join) to discuss issues and get help directly from the community.",
]

export const getRandomTipForUser = () => {
  let tip = tips[Math.floor(Math.random() * tips.length)]

  tip = tip.replace(/</g, "&lt;")
  tip = tip.replace(/>/g, "&gt;")
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
