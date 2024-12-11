import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    // Load environment variables

    // eslint-disable-next-line no-undef
    const env = loadEnv(mode, process.cwd(), '');

    console.log(env.VITE_BASEURL)

    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api': {
                    target: env.VITE_BASEURL,
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, '')
                }
            }
        }
    }
})
