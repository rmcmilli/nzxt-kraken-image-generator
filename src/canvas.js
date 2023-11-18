const fs = require('fs')
const { map, size } = require('lodash')
const { createCanvas, loadImage } = require('canvas')
const GIFEncoder = require('gifencoder')
const PNG = require('pngjs').PNG;

const { DEBUG } = process.env

// Node Canvas Docs: https://github.com/Automattic/node-canvas/blob/master/Readme.md

const IMAGE_RADIUS = 160
const IMAGE_OUTPUT = './output/generated.gif'

const GAUGE_WIDTH = 38

const FONT = {
  familly: 'Arial Rounded MT',
  weight: 'bold',
  sizes: [34, 28],
}

const COLORS = {
  background: 'rgb(0,0,0)',
  circle: 'rgb(36, 36, 36)',
  debug: 'rgb(100,100,100)',
  white: '#ffffff',
  left: '#009cd4',
  right: '#d400cb',
}


const GROUPS = [
  [
    { title: 'CPU', metric: 'cpu_temp' },
    { title: 'H2O', metric: 'liquid_temperature' },
  ],
]

const square = (ctx, ax, ay, bx, by) => {
  ctx.strokeStyle = COLORS.debug
  ctx.lineWidth = 10
  // ctx.lineCap = 'square'
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

const background = (ctx, color, radius) => {
  arc(ctx, color, IMAGE_RADIUS, IMAGE_RADIUS, radius, 0, 2 * Math.PI, false)
}

const gauge = (ctx, frame) => {
  const usage = frameToUsage(frame)
  ctx.beginPath()
  ctx.strokeStyle = frame.left ? COLORS.left : COLORS.right
  ctx.lineWidth = GAUGE_WIDTH
  ctx.lineCap = 'round'
  ctx.arc(
    IMAGE_RADIUS,
    IMAGE_RADIUS,
    IMAGE_RADIUS - GAUGE_WIDTH / 2,
    ...percentToPi(usage, frame.left),
  )
  ctx.fill()
  ctx.stroke()
}

const splitText = (ctx, frame) => {
  const xpos = frame.left ? 110 : 210
  ctx.fillStyle = frame.left ? COLORS.left : COLORS.right
  ctx.font = `${FONT.weight} ${FONT.sizes[1]}px "${FONT.familly}"`
  text(ctx, frame.title, xpos, 200)
  ctx.fillStyle = COLORS.white
  ctx.font = `${FONT.sizes[0]}px "${FONT.familly}"`
  text(ctx, frame.value, xpos, IMAGE_RADIUS)
}

const percentToPi = (percent, left) => {
  if (left) return [Math.PI + -Math.PI / percent, Math.PI + Math.PI / percent]
  else return [-Math.PI / percent, Math.PI / percent]
}

const frameToUsage = (frame) => {
  let ratio = 1
  if (['RPM'].includes(frame.title)) ratio = 0.075
  if (['H2O', 'PWR'].includes(frame.title)) ratio = 0.5
  if (['FRQ', 'MAX'].includes(frame.title)) ratio = 10
  const value = Number(frame.value.replace(/(G|°|dB|%|W)$/, ''))
  return percentToGaugeRatio(value * ratio)
}

const percentToGaugeRatio = (percent) => {
  // 100% = 3
  // 0% = 12
  if (percent > 100) percent = 100
  if (percent < 0) percent = 0
  return (percent / 11.1 - 9) * -1 + 2.3
}

const frame = (image, frames) => {
  const canvas = createCanvas(320, 320)
  const ctx = canvas.getContext('2d')
  // Background
  background(ctx, COLORS.circle, IMAGE_RADIUS)
  background(ctx, COLORS.background, IMAGE_RADIUS - GAUGE_WIDTH)
  // Helpers
  if (DEBUG) square(ctx, 60, 60, 260, 260)
  // Metrics
  frames.forEach((frame) => {
    gauge(ctx, frame)
    splitText(ctx, frame)
  })
  // NZXT image
  ctx.drawImage(image, 0, 0, 320, 320)
  // Return frame
  // return ctx
  // return ctx.canvas
  // Get the PNG buffer from the canvas
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./output/test.png', buffer);
  return canvas
}



const generate = async (metrics) => {
  const IMAGE_OUTPUT = __dirname + "/../output/generated.png";
  // const image = await loadImage("./images/kraken.png");
  const image = await loadImage(__dirname + "/../images/kraken.png");
  const groups = map(GROUPS, (group) => {
    return map(group, (g, i) => ({
      ...g,
      value: metrics[g.metric] || "-",
      left: i === 0,
    }));
  });
  
  // const canvas = createCanvas(320, 320);
  // const ctx = canvas.getContext("2d");
  const frames = groups.map((group) => frame(image, group))
  const encoder = new PNG({ width: 320, height: 320 });


  for (const frame of frames) {
    const buffer = frame.toBuffer('image/png');
    fs.writeFileSync(IMAGE_OUTPUT, buffer);
  }

}

module.exports = { generate }
