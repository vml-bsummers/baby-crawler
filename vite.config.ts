import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: ['baby-crawler.ddev.site', '.ddev.site']
  }
})