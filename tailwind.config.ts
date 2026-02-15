import type { Config } from 'tailwindcss'

import preset from './tailwind-preset'

const config: Config = {
  presets: [preset],
  content: ['./app/**/*.{ts,tsx}'],
  plugins: [],
}
export default config
