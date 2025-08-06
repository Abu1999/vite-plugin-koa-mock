import { readdir } from 'node:fs/promises'
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
  // options
  const {
    mockDir = 'mocks',
    port,
    proxyKeys = ['/api'],
    logger: enableLogger = true,
    cors: enableCors = true,
    bodyParser: enableBodyParser = true,
  } = options

  // enabled only in development mode
  if (process.env.NODE_ENV !== 'development') {
    return {
      name: 'vite-plugin-koa-mock',
      apply: () => false,
    }
  }
  // Koa应用
  const app = new Koa()
  let projectRoot: string // 项目根目录
  let resolvedMockDir: string // 解析后的mock目录
  let routerMiddleware: any = null
  let watcher: any = null

  // use builtin middleware
  if (enableLogger)
    app.use(logger())
  if (enableCors)
    app.use(cors(typeof enableCors === 'boolean' ? undefined : enableCors))
  if (enableBodyParser)
    app.use(bodyParser())

  // start to listen
  let server: any

  // configure Vite's server.proxy
  const proxyOptions = {
    target: `http://localhost:${port}`,
    changeOrigin: true,
  }
  const proxy: Record<string, ProxyOptions> = {}
  for (const key of proxyKeys)
    proxy[key] = proxyOptions

  /* -------------------------------------------------- utils -------------------------------------------------- */

  // 工具函数：获取文件扩展名
  const getFileExtension = (filename: string) => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
  }

  // 工具函数：判断是否为JS文件
  const isJsFile = (filename: string) => {
    const ext = getFileExtension(filename)
    return ext === 'js' || ext === 'ts'
  }

  // 加载路由中间件
  async function loadRouterMiddleware(resolvedMockDir: string) {
    try {
      // 读取目录下所有文件
      const files = await readdir(resolvedMockDir, { withFileTypes: true })
      // 收集所有路由中间件
      const middlewares = []
      const filesNameList = []

      for (const file of files) {
        // 跳过目录和非JS文件
        if (file.isDirectory() || !isJsFile(file.name))
          continue

        // 构建文件URL
        const mod = await importx(`./${file.name}`, {
          parentURL: resolve(resolvedMockDir),
          cache: false,
        })

        // 检查是否导出了router
        if (mod && mod.router) {
        // 添加路由中间件
          middlewares.push(mod.router.routes())
          middlewares.push(mod.router.allowedMethods())
          filesNameList.push(file.name)
        }
      }

      log(`已加载mock文件: [${filesNameList.join(',')}]`)
      return compose(middlewares)
    }
    catch (err) {
      log(new Error('Failed to load the mock dir', { cause: err }))
      return null
    }
  }

  // 启动服务器函数
  async function startServer(serverPort: number) {
    try {
    // 获取可用端口
      const port = await getPort({ port: serverPort || 9719 }) // 首选9719，如果被占用会自动选择其他
      // 监听端口并处理错误
      server = app.listen(port)
    }
    catch (err) {
      log(`获取端口时出错:${err}`)
    }
  }
  /* -------------------------------------------------- utils -------------------------------------------------- */

  let _loadRouterTimer: NodeJS.Timeout | null

  // return the plugin
  return {
    name: 'vite-plugin-koa-mock',
    apply: 'serve',
    config: () => ({
      server: {
        proxy,
      },
    }),

    // 获取项目根目录（关键修复）
    configResolved(config) {
      projectRoot = config.root
      resolvedMockDir = resolve(`${projectRoot}/${mockDir}`)

      // 监听mock目录变化（基于正确路径）
      watcher = chokidar.watch(resolvedMockDir).on('all', async (event, path) => {
        if (['add', 'change', 'unlink'].includes(event)) {
          if (event === 'change')
            log(`${normalize(path)} changed`)
          // 防抖
          if (_loadRouterTimer)
            clearTimeout(_loadRouterTimer)

          _loadRouterTimer = await setTimeout(async () => {
            routerMiddleware = await loadRouterMiddleware(resolvedMockDir)
          }, 300)
        }
      })

      // 启动Koa服务
      startServer(port as number).then(() => {
        // 挂载Koa中间件
        app.use((ctx, next) => {
          if (routerMiddleware)
            return routerMiddleware(ctx, next)

          return next()
        })
      })
    },

    configureServer: (devServer) => {
      // 请求打印
      const _printUrls = devServer.printUrls
      devServer.printUrls = () => {
        _printUrls()
        console.log(`  ${dim(green('➜'))}  ${dim(bold('Mock'))}: ${blue(`http://localhost:${port}/`)}`)
      }
      // 重启
      const _restart = devServer.restart
      devServer.restart = async (forceOptimize?: boolean) => {
        await new Promise<void>(resolve => server.close(() => resolve()))
        await watcher.close()
        await _restart(forceOptimize)
      }
      // 关闭
      const _close = devServer.close
      devServer.close = async () => {
        await new Promise<void>(resolve => server.close(() => resolve()))
        await watcher.close()
        await _close()
      }
    },
  }
}

/* -------------------------------------------------- exports -------------------------------------------------- */

export type { Middleware } from 'koa'
export type { Options as CorsOptions } from '@koa/cors'
export type { KoaMockOptions } from './types'

export { Router }
export default createPlugin
