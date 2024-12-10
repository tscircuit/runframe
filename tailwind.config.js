export default {
  content: [
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  // Disable Tailwind's base styles if you want minimal CSS
  corePlugins: {
    preflight: false,
  },
}