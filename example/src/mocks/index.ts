import { Router } from '../../../src/index'

export const router = new Router()

router.get('/mock/index', (ctx) => {
  ctx.body = 'bar11111111111111'
})
