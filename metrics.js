#!/usr/bin/env node

const { all } = require('./src/metrics.js')

;(async () => console.table(await all()))()
