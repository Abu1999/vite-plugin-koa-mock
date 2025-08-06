import { normalize, resolve } from 'pathe'
import { blue, bold, dim, green } from 'kolorist'
import { importx } from 'importx'
import chokidar from 'chokidar'
import Koa from 'koa'
import compose from 'koa-compose'
import Router from '@koa/router'
import cors from '@koa/cors'
import bodyParser from 'koa-bodyparser'
import type { Plugin, ProxyOptions } from 'vite'
import getPort from 'get-port'

import logger from './logger'
import { log } from './utils'
import type { KoaMockOptions } from './types'

/* -------------------------------------------------- types -------------------------------------------------- */

declare module 'koa' {
  interface Request {
    body?: unknown
    rawBody: string
  }
}

/* -------------------------------------------------- plugin -------------------------------------------------- */

async function createPlugin(options: KoaMockOptions = {}): Promise<Plugin> {
  async function getFreePort(port?: number) {
    const freePort = await getPort({ port: port || 9719 }) // 首选9719，如果被占用会自动选择其他
    console.log(`Free port found: ${freePort}`)
    return freePort
  }

  // options
  let {
    mockDir = './mock',
    port,
    proxyKeys = ['/api'],
    logger: enableLogger = true,
    cors: enableCors = true,
    bodyParser: enableBodyParser = true,
  } = options

  port = await getFreePort(port)
  // enabled only in development mode
  if (process.env.NODE_ENV !== 'development') {
    return {
      name: 'vite-plugin-koa-mock',
      apply: () => false,
    }
  }

  // new koa app
  const app = new Koa()

  // use builtin middleware
  if (enableLogger)
    app.use(logger())
  if (enableCors)
    app.use(cors(typeof enableCors === 'boolean' ? undefined : enableCors))
  if (enableBodyParser)
    app.use(bodyParser())

  // use mock router
  let routerMiddleware = await loadRouterMiddleware(mockDir)
  const watcher = chokidar.watch(mockDir).on('all', async (event, path) => {
    if (['add', 'change', 'unlink'].includes(event)) {
      if (event === 'change')
        log(`${normalize(path)} changed`)
      routerMiddleware = await loadRouterMiddleware(mockDir)
    }
  })
  app.use((ctx, next) => {
    if (routerMiddleware)
      routerMiddleware(ctx, next)
    else
      next()
  })

  // start to listen
  const server = app.listen(port)

  // configure Vite's server.proxy
  const proxyOptions = {
    target: `http://localhost:${port}`,
    changeOrigin: true,
  }
  const proxy: Record<string, ProxyOptions> = {}
  for (const key of proxyKeys)
    proxy[key] = proxyOptions

  // return the plugin
  return {
    name: 'vite-plugin-koa-mock',
    apply: 'serve',
    config: () => ({
      server: {
        proxy,
      },
    }),
    configureServer: (devServer) => {
      const _printUrls = devServer.printUrls
      devServer.printUrls = () => {
        _printUrls()
        console.log(`  ${dim(green('➜'))}  ${dim(bold('Mock'))}: ${blue(`http://localhost:${port}/`)}`)
      }
      const _restart = devServer.restart
      devServer.restart = async (forceOptimize?: boolean) => {
        await new Promise<void>(resolve => server.close(() => resolve()))
        await watcher.close()
        await _restart(forceOptimize)
      }
      const _close = devServer.close
      devServer.close = async () => {
        await new Promise<void>(resolve => server.close(() => resolve()))
        await watcher.close()
        await _close()
      }
    },
  }
}

/* -------------------------------------------------- utils -------------------------------------------------- */

async function loadRouterMiddleware(mockDir: string) {
  try {
    const mod = await importx('./index', {
      parentURL: resolve(mockDir),
      cache: false,
    })
    const router = mod.router
    return compose([router.routes(), router.allowedMethods()])
  }
  catch (err) {
    log(new Error('Failed to load the mock dir', { cause: err }))
  }
}

/* -------------------------------------------------- exports -------------------------------------------------- */

export type { Middleware } from 'koa'
export type { Options as CorsOptions } from '@koa/cors'
export type { KoaMockOptions } from './types'

export { Router }
export default createPlugin
