import { defineConfig } from 'vite'
// import KoaMock from 'vite-plugin-koa-mock'
import KoaMock from '../src/index'

export default defineConfig({
  plugins: [
    KoaMock({
    }),
  ],
})
