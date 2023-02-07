import Fastify from 'fastify'
import t from 'tap'
import FastifyDelayRequest from '../lib'

async function sleep (ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

t.test('max-request', async function (t) {
  t.plan(2)

  const fastify = Fastify()
  await fastify.register(FastifyDelayRequest, { maxRequest: 1 })
  fastify.get('/', () => 'OK')

  t.teardown(fastify.close.bind(fastify))

  fastify.delay.addTask(async () => {
    await sleep(5000)
  })

  await fastify.ready()

  const [
    one,
    two
  ] = await Promise.all([
    fastify.inject({ method: 'GET', path: '/' }),
    fastify.inject({ method: 'GET', path: '/' })
  ])

  t.equal(one.statusCode, 200)
  t.equal(two.statusCode, 503)
})

t.test('max-request custom handler', async function (t) {
  t.plan(3)

  const fastify = Fastify()
  await fastify.register(FastifyDelayRequest, {
    maxRequest: 1,
    onReachLimit (_, reply) {
      t.pass('should reach custom handler')
      reply
        .code(503)
        .header('Retry-After', 24000)
        .send({
          success: false,
          code: 503,
          message: 'Service Unavailable'
        })
    }
  })
  fastify.get('/', () => 'OK')

  t.teardown(fastify.close.bind(fastify))

  fastify.delay.addTask(async () => {
    await sleep(5000)
  })

  await fastify.ready()

  const [
    one,
    two
  ] = await Promise.all([
    fastify.inject({ method: 'GET', path: '/' }),
    fastify.inject({ method: 'GET', path: '/' })
  ])

  t.equal(one.statusCode, 200)
  t.equal(two.statusCode, 503)
})

t.test('max-request async custom handler', async function (t) {
  t.plan(3)

  const fastify = Fastify()
  await fastify.register(FastifyDelayRequest, {
    maxRequest: 1,
    async onReachLimit (_, reply) {
      t.pass('should reach custom handler')
      await reply
        .code(503)
        .header('Retry-After', 24000)
        .send({
          success: false,
          code: 503,
          message: 'Service Unavailable'
        })
    }
  })
  fastify.get('/', () => 'OK')

  t.teardown(fastify.close.bind(fastify))

  fastify.delay.addTask(async () => {
    await sleep(5000)
  })

  await fastify.ready()

  const [
    one,
    two
  ] = await Promise.all([
    fastify.inject({ method: 'GET', path: '/' }),
    fastify.inject({ method: 'GET', path: '/' })
  ])

  t.equal(one.statusCode, 200)
  t.equal(two.statusCode, 503)
})

t.test('max-request throw inside async custom handler', async function (t) {
  t.plan(3)

  const fastify = Fastify()
  await fastify.register(FastifyDelayRequest, {
    maxRequest: 1,
    async onReachLimit () {
      t.pass('should reach custom handler')
      throw Error('here')
    }
  })
  fastify.get('/', () => 'OK')

  t.teardown(fastify.close.bind(fastify))

  fastify.delay.addTask(async () => {
    await sleep(5000)
  })

  await fastify.ready()

  const [
    one,
    two
  ] = await Promise.all([
    fastify.inject({ method: 'GET', path: '/' }),
    fastify.inject({ method: 'GET', path: '/' })
  ])

  t.equal(one.statusCode, 200)
  t.equal(two.statusCode, 500)
})
