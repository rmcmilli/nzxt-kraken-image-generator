const csv = require('csvtojson')
const { merge, keyBy, map } = require('lodash')
const fs = require('fs')

const util = require('util')
const exec = util.promisify(require('child_process').exec)

const sumBy = (list, key, factor = 1, fixed = 0, suffix = '') => {
  const values = list.map((i) => i[key]).filter((x) => x)
  const sum = values.map((x) => parseFloat(x, 10)).reduce((a, b) => a + b, 0)
  return ((sum / values.length || 0) * factor).toFixed(fixed) + suffix
}

const cleanUnits = (str) => str.replace(/°[CF]/, '°').replace(/rpm/, '')

// const liquidctl = async (device) => {
//   const { stdout } = await exec(`liquidctl status --match ${device} --json`)
//   const status = JSON.parse(stdout)[0].status
//   const info = map(keyBy(status, 'key'), ({ value, unit }, k) => {
//     const key = k.replace(/ /g, '_').toLowerCase()
//     return { [key]: `${Math.round(value)}${cleanUnits(unit)}` }
//   })
//   return merge(...info)
// }


const liquidctl = async (device) => {
  // const liquidctl_status = "/mnt/c/Users/ronmc/Documents/projects/liquidctl-gif/status.json"
  const liquidctl_status = "../status.json"
  // fs.readFile(liquidctl_status, 'utf8', function(err, data) {
  //   if (err) throw err
  //   const status = JSON.parse(data)[0].status
  //   const info = map(keyBy(status, 'key'), ({ value, unit }, k) => {
  //     const key = k.replace(/ /g, '_').toLowerCase()
  //     return { [key]: `${Math.round(value)}${cleanUnits(unit)}` }
  //   })
    // console.log(info)
    // console.log(merge(...info))
  //   return merge(...info)
  // })
  read_file = fs.readFileSync(liquidctl_status)
  const status = JSON.parse(read_file)[0].status
  const info = map(keyBy(status, 'key'), ({ value, unit }, k) => {
    const key = k.replace(/ /g, '_').toLowerCase()
    return { [key]: `${Math.round(value)}${cleanUnits(unit)}` }
  })
  // console.log(info)
  const merged = merge(...info)
  // console.log(merged)
  return merged
}


const intelPowerGadget = async () => {
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
}

const linuxSensors = async () => {
  // const output = "/mnt/c/Users/ronmc/Documents/projects/liquidctl-gif/sensors.json"
  const output = "../sensors.json"
  var temp_suffix = '°'
  // fs.readFile(output, 'utf8', function(err, data) {
  //   if (err) throw err
  //   // console.log(data)
  //   values = JSON.parse(data)["k10temp-pci-00c3"]["CPU Temp"]["temp1_input"]
  //   console.log({cpu_temp: Math.floor(values) + temp_suffix})
  //   return {cpu_temp: Math.floor(values) + temp_suffix}
  // })
  var read_file = fs.readFileSync(output)
  // console.log(JSON.parse(read_file))
  var values = JSON.parse(read_file)["k10temp-pci-00c3"]["CPU Temp"]["temp1_input"]
  // console.log({cpu_temp: Math.floor(values) + temp_suffix})
  return {
    cpu_temp: Math.floor(values) + temp_suffix,
  // cpu_maxtemp: sumBy(list, 'CPU Max Temperature_0(C)', 1, 1, '°'),
  // cpu_maxfreq: sumBy(list, 'CPU Max Frequency_0(MHz)', 0.001, 1, 'G'),
  }
}

// module.exports = {
//   liquidctl,
//   intelPowerGadget,
//   all: async () => {
//     return merge(
//       await intelPowerGadget(),
//       await liquidctl('Kraken'),
//       await liquidctl('Smart'),
//     )
//   },
// }

// async function create_table() {
//   console.table(await linuxSensors())
// }

// create_table()


module.exports = {
  liquidctl,
  linuxSensors,
  all: async () => {
    return merge(
      await linuxSensors(),
      await liquidctl('Kraken'),
      // await liquidctl('Smart'),
    )
  },
}