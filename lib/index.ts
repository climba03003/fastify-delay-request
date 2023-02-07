import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import FastifyPlugin from 'fastify-plugin'

// work-around to use import in TypeScript
type CustomImport = <R = any>(name: string) => Promise<R>
// eslint-disable-next-line @typescript-eslint/no-implied-eval,no-new-func
export const _import = new Function('modulePath', 'return import(modulePath)') as CustomImport

export interface FastifyDelayRequestOptions {
  concurreny?: number
  taskTimeout?: number
  maxRequest?: number
  maxTimeout?: number
  checkInterval?: number
  onReachLimit?: (request: FastifyRequest, reply: FastifyReply) => unknown | Promise<unknown>
}

declare module 'fastify' {
  interface FastifyInstance {
    delay: {
      addTask: (task: Function) => void
    }
  }
}

const plugin: FastifyPluginAsync<FastifyDelayRequestOptions> = async function (fastify, options) {
  const { default: PQueue } = await _import<typeof import('p-queue')>('p-queue')
  // maximum request that should holds
  // unlimited request may cause memory leak
  const maxRequest = options.maxRequest ?? 100
  // check status interval
  const checkInterval = options.checkInterval ?? 1000
  // max wait timeout
  const maxTimeout = options.maxTimeout ?? 180000
  const onReachLimit = options.onReachLimit ?? function defaultOnReachLimit (_: FastifyRequest, reply: FastifyReply) {
    return reply
      .code(503)
      .header('Retry-After', maxTimeout)
      .send({
        success: false,
        code: 503,
        message: 'Service Unavailable'
      })
  }

  // we handle the tasks by p-queue
  const taskQ = new PQueue({
    concurrency: options.concurreny ?? 1,
    timeout: options.taskTimeout ?? 60000,
    throwOnTimeout: true,
    // we should start when fastify ready
    // in this case all the plugin is ready
    autoStart: false
  })
  const timers: NodeJS.Timer[] = []

  fastify.decorate('delay', { addTask })

  fastify.addHook('onReady', function (done) {
    taskQ.start()
    done()
  })

  fastify.addHook('onClose', function (_, done) {
    // clear all the task
    taskQ.clear()
    done()
  })

  fastify.addHook('onRequest', handleRequest)

  function addTask (task: Function): void {
    const promise = taskQ.add(task as any)
    promise.catch(() => {
      // we close the server whenever task failure
      void fastify.close()
    })
  }

  function handleRequest (request: FastifyRequest, reply: FastifyReply, done: Function): void {
    if (taskQ.size === 0 && taskQ.pending === 0) {
      // when no task exists, continue
      done()
      return
    }

    const now = Date.now()

    // we check in interval
    const id = setInterval(() => {
      _handleRequest(request, reply, done)
    }, checkInterval)
    timers.push(id)

    // fire first
    _handleRequest(request, reply, done)

    function _handleRequest (request: FastifyRequest, reply: FastifyReply, done: Function): void {
      // we need to duplicate the check here for timeout
      if (taskQ.size === 0 && taskQ.pending === 0) {
        // when no task exists, continue
        _cleanup()
        return
      }

      if (timers.length > maxRequest || (Date.now() - now) > maxTimeout) {
        const promise: any = onReachLimit(request, reply)
        if (typeof promise?.then === 'function') promise.then(_cleanup, _cleanup)
        else _cleanup()
      }
    }

    function _cleanup (...args: any[]): void {
      clearInterval(id)
      const idx = timers.findIndex((i) => i === id)
      /* istanbul ignore else */
      if (idx > -1) timers.splice(idx, 1)
      done(...args)
    }
  }
}

export const FastifyDelayRequest = FastifyPlugin(plugin, {
  fastify: '4.x',
  name: 'fastify-delay-request',
  dependencies: []
})
export default FastifyDelayRequest
