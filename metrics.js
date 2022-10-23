#!/usr/bin/env node

const { merge } = require('lodash')
const { intel, liquidctl } = require('./src/metrics.js')

;(async () => {
  const metrics = merge(
    await intel(),
    await liquidctl('Smart'),
    await liquidctl('Kraken'),
  )
  console.table(metrics)
})()
