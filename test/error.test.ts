import Fastify from 'fastify'
import t from 'tap'
import FastifyDelayRequest from '../lib'

async function sleep (ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

t.test('max-timeout', async function (t) {
  t.plan(1)
  let _resolve: any
  const promise = new Promise((resolve) => {
    _resolve = resolve
  })

  const fastify = Fastify()
  await fastify.register(FastifyDelayRequest)
  fastify.get('/', () => 'OK')

  t.teardown(fastify.close.bind(fastify))

  fastify.delay.addTask(async () => {
    await sleep(1000)
    throw Error()
  })

  fastify.addHook('onClose', (_, done) => {
    t.pass('should close')
    _resolve()
    done()
  })

  await fastify.ready()
  await promise
})
