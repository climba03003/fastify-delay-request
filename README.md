# fastify-delay-request

[![Continuous Integration](https://github.com/climba03003/fastify-delay-request/actions/workflows/ci.yml/badge.svg)](https://github.com/climba03003/fastify-delay-request/actions/workflows/ci.yml)
[![Package Manager CI](https://github.com/climba03003/fastify-delay-request/actions/workflows/package-manager-ci.yml/badge.svg)](https://github.com/climba03003/fastify-delay-request/actions/workflows/package-manager-ci.yml)
[![NPM version](https://img.shields.io/npm/v/fastify-delay-request.svg?style=flat)](https://www.npmjs.com/package/fastify-delay-request)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/climba03003/fastify-delay-request)](https://github.com/climba03003/fastify-delay-request)
[![GitHub](https://img.shields.io/github/license/climba03003/fastify-delay-request)](https://github.com/climba03003/fastify-delay-request)

This plugin is used for delaying response to a request while you would like
the server to spin-up first and wait some heavy task.

## Install

```shell
npm install fastify-delay-request --save

yarn add fastify-delay-request
```

## Usage

```ts
import FastifyDelayRequest from 'fastify-delay-request'
import * as path from 'path'
import { setTimeout } from 'timers/promises'

fastify.register(FastifyDelayRequest, {
})

fastify.delay.addTask(async function() {
  // do some heavy task here
  await setTimeout(10000)
})

```

### Options

#### options.concurreny

Maximum number of tasks run in parallel.
Default: 1

```ts
import FastifyDelayRequest from 'fastify-delay-request'

fastify.register(FastifyDelayRequest, {
  concurreny: 1
})
```

#### options.taskTimeout

Maximum millseconds that allow the task to run.
It can ensure the server should not wait forever.
Default: 60000 (1 min)

```ts
import FastifyDelayRequest from 'fastify-delay-request'

fastify.register(FastifyDelayRequest, {
  taskTimeout: 120000
})
```

#### options.maxTimeout

Maximum timeout for each delayed request.

Default: 180000 (3 mins)

```ts
import FastifyDelayRequest from 'fastify-delay-request'

fastify.register(FastifyDelayRequest, {
  maxTimeout: 240000
})
```

#### options.maxRequest

Maximum requests that holds while waiting all tasks
finished. You must specify a limited number, otherwise
you may face TCP Port Exhaustaion attack or memory-leak.

Default: 100

```ts
import FastifyDelayRequest from 'fastify-delay-request'

fastify.register(FastifyDelayRequest, {
  maxRequest: 100
})
```

#### options.checkInterval

The interval checks for task finish.
Default: 1000 (1s)

```ts
import Fastifybree from 'fastify-delay-request'

fastify.register(FastifyDelayRequest, {
  checkInterval: 1000
})
```

#### options.onReachLimit

The function that used to return error when
maximum request or maximum timeout reached.

You must reply in this handler, otherwise
you may by-pass the delay action and reach
handler.

```ts
import FastifyDelayRequest from 'fastify-delay-request'

fastify.register(FastifyDelayRequest, {
  onReachLimit(request, reply) {
    return reply
      .code(503)
      .header('Retry-After', '240000')
      .send({
        success: false,
        code: 503,
        message: 'Service Unavailable'
      })
  }
})
```
