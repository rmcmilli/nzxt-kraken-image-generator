const { createWriteStream } = require('fs')
const { createCanvas, loadImage } = require('canvas')
const { DEBUG } = process.env

const GIFEncoder = require('gifencoder')

// DOCS: https://github.com/Automattic/node-canvas/blob/master/Readme.md

const OUTPUT = './output/generated.gif'

const COLORS = {
  black: 'rgb(0,0,0)',
  gray1: 'rgb(36, 36, 36)',
  gray2: 'rgb(100,100,100)',
  white: '#ffffff',
  circle: 'rgb(128, 27, 204)',
  title: 'rgb(128, 27, 204)',
}

const square = (ctx, ax, ay, bx, by) => {
  ctx.strokeStyle = COLORS.gray2
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.lineTo(ax, ay)
  ctx.lineTo(bx, ay)
  ctx.lineTo(bx, by)
  ctx.lineTo(ax, by)
  ctx.lineTo(ax, ay)
  ctx.stroke()
}

const text = (ctx, txt, x, y) => {
  const measure = ctx.measureText(txt.replace(/°$/, ''))
  ctx.fillText(txt, x - measure.width / 2, y)
}

const arc = (ctx, color, x, y, radius, rx, ry, reverse) => {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.arc(x, y, radius, rx, ry, reverse)
  ctx.closePath()
  ctx.fill()
}

const gauge = (ctx, color, ratio, left) => {
  let coords = [-Math.PI * ratio, Math.PI * ratio]
  if (left) coords = coords.map((c) => Math.PI + c)
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = 30
  ctx.lineCap = 'round'
  ctx.arc(160, 160, 145, ...coords)
  ctx.fill()
  ctx.stroke()
}

const splitText = (ctx, title, value, x) => {
  ctx.fillStyle = COLORS.gray2
  ctx.font = '24px Impact'
  text(ctx, title, x, 200)
  ctx.fillStyle = COLORS.white
  ctx.font = '30px Impact'
  text(ctx, value, x, 160)
}

const percentToGaugeRatio = (percent) => {
  const MAX = Math.PI / 7
  const MIN = Math.PI / 30
  const ratio = (percent * MAX) / 100
  if (ratio >= MAX) return MAX
  if (ratio <= MIN) return MIN
  return ratio
}

const frame = (image, usage, t1, v1, t2, v2) => {
  const canvas = createCanvas(320, 320)
  const ctx = canvas.getContext('2d')
  // Background
  arc(ctx, COLORS.gray1, 160, 160, 160, 0, 2 * Math.PI, false)
  arc(ctx, COLORS.black, 160, 160, 130, 0, 2 * Math.PI, false)
  // Helpers
  if (DEBUG) square(ctx, 60, 60, 260, 260)
  // Gauges
  gauge(ctx, COLORS.circle, percentToGaugeRatio(usage[0]), true)
  gauge(ctx, COLORS.circle, percentToGaugeRatio(usage[1]), false)
  // NZXT image
  ctx.drawImage(image, 0, 0, 320, 320)
  // Write text
  splitText(ctx, t1, v1, 110)
  splitText(ctx, t2, v2, 210)
  // Return frame
  return ctx
}

const generate = async (metrics) => {
  const image = await loadImage('./images/kraken.png')
  const frames = [
    [metrics.frequency, metrics.package, metrics.power, metrics.usage],
    // ['CPU', metrics.package, 'POW', metrics.power],
    // ['FREQ', metrics.frequency, 'USE', metrics.usage],
  ].map((f) => {
    const temp = Number(metrics.package.replace(/.$/, ''))
    const usage = Number(metrics.usage.replace(/%$/, ''))
    const power = Number(metrics.power.replace(/W$/, ''))
    return frame(image, [temp, usage], ...f)
  })
  const encoder = new GIFEncoder(320, 320)
  encoder.createReadStream().pipe(createWriteStream(OUTPUT))
  encoder.start()
  encoder.setRepeat(0) // 0 for repeat, -1 for no-repeat
  encoder.setQuality(100) // image quality. 10 is default.
  for (const frame of frames) {
    encoder.setDelay(2500) // frame delay in ms
    encoder.addFrame(frame)
  }
  encoder.finish()
}

module.exports = { generate }
