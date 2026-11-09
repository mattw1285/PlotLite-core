import { defineConfig } from 'vite'
import { copyFileSync } from 'node:fs'

export default defineConfig({
    base: '/PlotLite-core/',

    server: {
        host: '127.0.0.1',
        port: 8000,
        strictPort: true
    },
    preview: {
        host: '127.0.0.1',
        port: 8000,
        strictPort: true
    },

    plugins: [{
        name: 'copy-license',
        closeBundle() {
            copyFileSync('LICENSE.md', 'dist/LICENSE.md')
        }
    }]
})
