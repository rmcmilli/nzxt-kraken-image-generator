const csv = require('csvtojson')

const util = require('util')
const exec = util.promisify(require('child_process').exec)

const sumBy = (list, key, factor = 1, fixed = 0, suffix = '') => {
  const values = list.map((i) => i[key]).filter((x) => x)
  const sum = values.map((x) => parseFloat(x, 10)).reduce((a, b) => a + b, 0)
  return ((sum / values.length || 0) * factor).toFixed(fixed) + suffix
}

module.exports = {
  cpu: async () => {
    const { stdout, stderr } = await exec('osx-cpu-temp')
    return stdout.replace(/°[CF]/, '°')
  },
  intel: async () => {
    const script = '/Applications/Intel\\ Power\\ Gadget/PowerLog'
    const output = './output/PowerLog.csv'
    await exec(`${script} -duration 1 -file ${output}`)
    const list = await csv().fromFile(output)
    return {
      frequency: sumBy(list, 'CPU Frequency_0(MHz)', 0.001, 1, 'Ghz'),
      power: sumBy(list, 'Processor Power_0(Watt)', 1, 0, 'W'),
      usage: sumBy(list, 'CPU Utilization(%)', 1, 0, '%'),
      package: sumBy(list, 'Package Temperature_0(C)', 1, 1, '°'),
      cpumax: sumBy(list, 'CPU Max Temperature_0(C)', 1, 1, '°'),
    }
  },
}
