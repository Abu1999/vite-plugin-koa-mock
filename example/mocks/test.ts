import { Router } from '../../src/index'

export const router = new Router()

router.get('/api/foo', (ctx) => {
  ctx.body = 'bar111111122333444'
})
