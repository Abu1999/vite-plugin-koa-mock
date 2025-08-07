import { defineConfig } from 'vite'
// import KoaMock from 'vite-plugin-koa-mocks'
import KoaMock from '../src/index'

export default defineConfig({
  plugins: [
    KoaMock({
    }),
  ],
})
