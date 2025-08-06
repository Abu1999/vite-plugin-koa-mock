# vite-plugin-koa-mocks

[![npm-version](https://img.shields.io/npm/v/vite-plugin-koa-mock?style=flat-square&color=%23cb3837)](https://www.npmjs.com/package/vite-plugin-koa-mock)
[![license](https://img.shields.io/github/license/Abu1999/vite-plugin-koa-mock?&style=flat-square)](./LICENSE)

English | [中文](./README_zh.md)

Serve mock API with **Koa.js** in **Vite** projects.

![logger](https://raw.githubusercontent.com/Abu1999/vite-plugin-koa-mock/main/images/cover.png)

## Install

```shell
npm install -D vite-plugin-koa-mock
```

## Usage

Config `vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import KoaMock from 'vite-plugin-koa-mock'

export default defineConfig({
  plugins: [
    KoaMock({
      mockDir: 'mocks',
      proxyKeys: ['/mock'],
    }),
  ],
})
```

Create `mocks/*.js` or `mocks/*.ts` with your mock APIs:

```javascript
import { Router } from 'vite-plugin-koa-mock'

export const router = new Router()

router.get('/mock/foo', (ctx) => {
  ctx.body = 'bar'
})

router.get('/mock/bar', (ctx) => {
  ctx.body = 'foo'
})
```

## Options

```typescript
import type { Options as CorsOptions } from '@koa/cors'

export interface KoaMockOptions {
  /**
   * The dir for mock APIs.
   * @default './mock'
   */
  mockDir?: string

  /**
   * The port for mock server.
   * @default 9719
   */
  port?: number

  /**
   * Keys for Vite's configuration `server.proxy`.
   * @see https://vitejs.dev/config/server-options.html#server-proxy
   * @default ['/api']
   */
  proxyKeys?: string[]

  /**
   * Whether to enable builtin logger middleware.
   * @default true
   */
  logger?: boolean

  /**
   * Whether to enable builtin CORS middleware.
   * You can configure the CORS middleware by setting an options object.
   * @see https://github.com/koajs/cors#corsoptions
   * @default true
   */
  cors?: boolean | CorsOptions

  /**
   * Whether to enable builtin body parser middleware.
   * @see https://github.com/koajs/bodyparser
   * @default true
   */
  bodyParser?: boolean
}
```

## License

[MIT](./LICENSE) License &copy; 2024-PRESENT
[mys1024](https://github.com/mys1024)
