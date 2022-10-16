#!/usr/bin/env node

const { generate } = require('./src/canvas.js')
const { intel } = require('./src/metrics.js')

;(async () => {
  await generate(await intel())
})()
