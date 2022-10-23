#!/usr/bin/env node

const { merge } = require('lodash')

const { generate } = require('./src/canvas.js')
const { intel, liquidctl } = require('./src/metrics.js')

;(async () => {
  const metrics = merge(await intel(), await liquidctl('Kraken'), await liquidctl('Smart'))
  await generate(metrics)
})()
