import { Router } from '../../src/index'

export const router = new Router()

router.get('/mock/foo', (ctx) => {
  ctx.body = 'bar'
})
