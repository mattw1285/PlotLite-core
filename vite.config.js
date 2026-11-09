import { defineConfig } from 'vite'

export default defineConfig({
    base: '/PlotLite-core/',

    server: {
        host: '127.0.0.1',
        port: 8000,
        strictPort: true
    }
})
