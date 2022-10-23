#!/usr/bin/env node

const { generate } = require('./src/canvas.js')
const { all } = require('./src/metrics.js')

;(async () => await generate(await all()))()
