import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      // Use Babel for ALL JSX transformation
      // This prevents esbuild from ever seeing raw JSX syntax
      babel: {
        plugins: [],
      },
    }),
  ],
  esbuild: {
    // Tell esbuild to treat .jsx as plain JS (no JSX parsing)
    // @vitejs/plugin-react handles JSX before esbuild sees the file
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
    },
  },
})
