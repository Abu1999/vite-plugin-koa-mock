import { Router } from '../../src/index'

export const router = new Router()

router.get('/api/index', (ctx) => {
  ctx.body = 'bar11111111111111'
})
