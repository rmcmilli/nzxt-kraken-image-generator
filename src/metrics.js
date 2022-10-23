const csv = require('csvtojson')
const { merge, keyBy, map } = require('lodash')

const util = require('util')
const exec = util.promisify(require('child_process').exec)

const sumBy = (list, key, factor = 1, fixed = 0, suffix = '') => {
  const values = list.map((i) => i[key]).filter((x) => x)
  const sum = values.map((x) => parseFloat(x, 10)).reduce((a, b) => a + b, 0)
  return ((sum / values.length || 0) * factor).toFixed(fixed) + suffix
}

const cleanUnits = (str) => str.replace(/°[CF]/, '°').replace(/rpm/, '')

module.exports = {
  cpu: async () => {
    const { stdout } = await exec('osx-cpu-temp')
    return cleanUnits(stdout)
  },
  liquidctl: async (device) => {
    const { stdout } = await exec(`liquidctl status --match ${device} --json`)
    const status = JSON.parse(stdout)[0].status
    const info = map(keyBy(status, 'key'), ({ value, unit }, k) => {
      const key = k.replace(/ /g, '_').toLowerCase()
      return { [key]: `${Math.round(value)}${cleanUnits(unit)}` }
    })
    return merge(...info)
  },
  intel: async () => {
    const script = '/Applications/Intel\\ Power\\ Gadget/PowerLog'
    const output = './output/PowerLog.csv'
    await exec(`${script} -duration 1 -file ${output}`)
    const list = await csv().fromFile(output)
    return {
      cpu_freq: sumBy(list, 'CPU Frequency_0(MHz)', 0.001, 1, 'G'),
      cpu_power: sumBy(list, 'Processor Power_0(Watt)', 1, 0, 'W'),
      cpu_usage: sumBy(list, 'CPU Utilization(%)', 1, 0, '%'),
      cpu_temp: sumBy(list, 'Package Temperature_0(C)', 1, 0, '°'),
      cpu_maxtemp: sumBy(list, 'CPU Max Temperature_0(C)', 1, 1, '°'),
      cpu_maxfreq: sumBy(list, 'CPU Max Frequency_0(MHz)', 0.001, 1, 'G'),
    }
  },
}
