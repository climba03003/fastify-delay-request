import Fastify from 'fastify'
import t from 'tap'
import FastifyDelayRequest from '../lib'

t.test('no task', async function (t) {
  t.plan(2)

  const fastify = Fastify()
  await fastify.register(FastifyDelayRequest)
  fastify.get('/', () => 'OK')

  t.teardown(fastify.close.bind(fastify))

  await fastify.ready()

  const [
    one,
    two
  ] = await Promise.all([
    fastify.inject({ method: 'GET', path: '/' }),
    fastify.inject({ method: 'GET', path: '/' })
  ])

  t.equal(one.statusCode, 200)
  t.equal(two.statusCode, 200)
})
