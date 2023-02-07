import Fastify from 'fastify'
import t from 'tap'
import FastifyDelayRequest from '../lib'

t.test('registration', function (t) {
  t.plan(2)

  t.test('without options', async function (t) {
    t.plan(1)
    const fastify = Fastify()
    await fastify.register(FastifyDelayRequest)
    t.pass('can be registered without options')
  })

  t.test('with options', async function (t) {
    t.plan(1)
    const fastify = Fastify()
    await fastify.register(FastifyDelayRequest, {
      concurreny: 2,
      taskTimeout: 100,
      maxRequest: 10,
      maxTimeout: 10,
      checkInterval: 1000,
      onReachLimit (_request, _reply) {
        // may skip the delay
      }
    })
    t.pass('can be registered with options')
  })
})
