import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import manifestSRI from 'vite-plugin-manifest-sri';


// https://vitejs.dev/config/
export default defineConfig({
  base: "/CosmoGem/",
  plugins: [react(), manifestSRI()],
  build: {
    manifest: true
  }
})
