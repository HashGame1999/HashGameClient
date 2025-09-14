import CryptoJS from 'crypto-js'

const ConsoleColors = {
  'bright': '\x1B[1m%s\x1B[0m',
  'grey': '\x1B[2m%s\x1B[0m',
  'italic': '\x1B[3m%s\x1B[0m',
  'underline': '\x1B[4m%s\x1B[0m',
  'reverse': '\x1B[7m%s\x1B[0m',
  'hidden': '\x1B[8m%s\x1B[0m',
  'black': '\x1B[30m%s\x1B[0m',
  'red': '\x1B[31m%s\x1B[0m',
  'green': '\x1B[32m%s\x1B[0m',
  'yellow': '\x1B[33m%s\x1B[0m',
  'blue': '\x1B[34m%s\x1B[0m',
  'magenta': '\x1B[35m%s\x1B[0m',
  'cyan': '\x1B[36m%s\x1B[0m',
  'white': '\x1B[37m%s\x1B[0m',
  'blackBG': '\x1B[40m%s\x1B[0m',
  'redBG': '\x1B[41m%s\x1B[0m',
  'greenBG': '\x1B[42m%s\x1B[0m',
  'yellowBG': '\x1B[43m%s\x1B[0m',
  'blueBG': '\x1B[44m%s\x1B[0m',
  'magentaBG': '\x1B[45m%s\x1B[0m',
  'cyanBG': '\x1B[46m%s\x1B[0m',
  'whiteBG': '\x1B[47m%s\x1B[0m'
}

function ConsoleInfo(str) {
  console.log(ConsoleColors.green, str)
}

function ConsoleWarn(str) {
  console.log(ConsoleColors.yellow, str)
}

function ConsoleError(str) {
  console.log(ConsoleColors.red, str)
}

function ConsoleDebug(str) {
  console.log(ConsoleColors.redBG, str)
}

const kb = 1024
const mb = 1024 * 1024
const gb = 1024 * 1024 * 1024

function add0(m) { return m < 10 ? '0' + m : m }

function timestamp_format(timestamp) {
  let time = new Date(timestamp)
  let y = time.getFullYear()
  let m = time.getMonth() + 1
  let d = time.getDate()
  let h = time.getHours()
  let mm = time.getMinutes()
  let s = time.getSeconds()

  timestamp = new Date()
  let tmp = '@'
  if (y != timestamp.getFullYear()) {
    tmp += y + '-' + add0(m) + '-' + add0(d) + ' '
  } else {
    tmp += add0(m) + '-' + add0(d) + ' '
  }
  return tmp + add0(h) + ':' + add0(mm) + ':' + add0(s)
}

function timestamp_for_short(timestamp) {
  let now = Date.now()
  let time = new Date(timestamp)
  let y = time.getFullYear()
  let m = time.getMonth() + 1
  let d = time.getDate()
  let h = time.getHours()
  let mm = time.getMinutes()
  let s = time.getSeconds()

  timestamp = new Date()
  let tmp = '@'
  if (y != timestamp.getFullYear()) {
    tmp += y + '-' + add0(m) + '-' + add0(d) + ' '
  } else {
    tmp += add0(m) + '-' + add0(d) + ' '
  }
  return tmp + add0(h) + ':' + add0(mm) + ':' + add0(s)
}

function timestamp2Number(timestamp) {
  let time = new Date(timestamp)
  let y = time.getFullYear()
  let m = time.getMonth() + 1
  let d = time.getDate()
  let h = time.getHours()
  let mm = time.getMinutes()
  let s = time.getSeconds()
  let tmp = ''
  return tmp + y + add0(m) + add0(d) + add0(h) + add0(mm) + add0(s)
}

function filesize_format(filesize) {
  if (filesize >= gb) {
    return `${Number((filesize / gb).toFixed(2))}GB`
  } else if (filesize >= mb) {
    return `${Number((filesize / mb).toFixed(2))}MB`
  } else if (filesize >= kb) {
    return `${Number((filesize / kb).toFixed(2))}KB`
  } else {
    return `${filesize}B`
  }
}

function Str2Hex(str) {
  let arr = []
  let length = str.length
  for (let i = 0; i < length; i++) {
    arr[i] = (str.charCodeAt(i).toString(16))
  }
  return arr.join('').toUpperCase()
}

function HalfSHA512(str) {
  let hash = CryptoJS.SHA512(str).toString().toUpperCase()
  return hash.substring(0, 64)
}

function QuarterSHA512(str) {
  let hash = CryptoJS.SHA512(str).toString().toUpperCase()
  return hash.substring(0, 32)
}

function calcRate(numerator, denominator) {
  let rate = Math.round(numerator / denominator * 10000) / 100
  if (Number.isNaN(rate)) {
    rate = 100
  }
  return rate
}

async function safeAddItem(db, table_name, key, data) {
  const table = db.table(table_name)
  return db.transaction('rw', table, async () => {
    const exists = await table
      .where(key).equals(data[key])
      .count()
      .then(count => count > 0)

    if (!exists) {
      table.add(data)
      return true
    } else {
      return false
    }
  })
}

function genSalt() {
  return CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Base64)
}

function deriveKeyFromPassword(password, salt) {
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: (32 + 16) / 4,
    iterations: 1000,
    hasher: CryptoJS.algo.SHA512
  })

  const keyBytes = CryptoJS.lib.WordArray.create(key.words.slice(0, 8))
  const ivBytes = CryptoJS.lib.WordArray.create(key.words.slice(8, 12))

  return { key: keyBytes, iv: ivBytes }
}

function encryptWithPassword(data, password, salt) {
  const { key, iv } = deriveKeyFromPassword(password, salt)
  const dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data)
  const encrypted = CryptoJS.AES.encrypt(dataStr, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })

  return encrypted.toString()
}

function decryptWithPassword(password, salt, cipherData, isObject = false) {
  const { key, iv } = deriveKeyFromPassword(password, salt)
  const decrypted = CryptoJS.AES.decrypt(cipherData, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7
  })
  const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8)
  return isObject ? JSON.parse(decryptedStr) : decryptedStr
}

export {
  ConsoleInfo,
  ConsoleWarn,
  ConsoleError,
  ConsoleDebug,
  timestamp_format,
  timestamp2Number,
  filesize_format,

  Str2Hex,
  HalfSHA512,
  QuarterSHA512,

  calcRate,
  safeAddItem,

  genSalt,
  encryptWithPassword,
  decryptWithPassword,
}