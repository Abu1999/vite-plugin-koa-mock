import type { Options as CorsOptions } from '@koa/cors'

export interface KoaMockOptions {
  /**
   * The dir for mock APIs.
   * @default 'mock'
   */
  mockDir?: string

  /**
   * The port of mock server.
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
