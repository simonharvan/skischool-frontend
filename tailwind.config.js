/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  // Element Plus ships its own reset; Tailwind's would fight with it.
  corePlugins: { preflight: false },
  theme: { extend: {} },
  plugins: [],
}
