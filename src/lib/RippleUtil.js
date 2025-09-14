import Decimal from 'decimal.js'
import * as rippleKeyPairs from 'ripple-keypairs'
import { dropsToXrp, convertStringToHex, Wallet, ECDSA } from 'xrpl'
import { XRP2DropRate, TxType, TxResult, DefaultCoinCode, TestNetURL } from './RippleConst.js'
import { Str2Hex } from './AppUtil.js'

function Drop2FloorXRP(drop) {
  return Math.floor(drop / XRP2DropRate)
}

function URL4LedgerIndex(ledger_index) {
  return `https://xrpscan.com/ledger/${ledger_index}`
}

function URL4TxHash(tx_hash) {
  return `https://xrpscan.com/tx/${tx_hash}`
}

function URL4Account(account) {
  return `https://xrpscan.com/account/${account}`
}

function URL4LedgerIndexTest(ledger_index) {
  return `https://testnet.xrpl.org/ledgers/${ledger_index}`
}

function URL4TxHashTest(tx_hash) {
  return `https://testnet.xrpl.org/transactions/${tx_hash}`
}

function URL4AccountTest(account) {
  return `https://testnet.xrpl.org/accounts/${account}`
}

function TxSummary(tx, address) {
  let summary = ''
  // console.log(tx.tx_json.TransactionType)
  if (tx.tx_json.TransactionType === TxType.Payment) {
    if (tx.tx_json.Account === address) {
      if (tx.engine_result === TxResult.Success) {
        summary = `just send ${dropsToXrp(tx.tx_json.DeliverMax)} to ${tx.tx_json.Destination} success!`
      } else {
        summary = `just send ${dropsToXrp(tx.tx_json.DeliverMax)} to ${tx.tx_json.Destination} fail...\n(${tx.engine_result_message})`
      }
    } else if (tx.tx_json.Destination === address && tx.engine_result === TxResult.Success) {
      summary = `just receive ${dropsToXrp(tx.tx_json.DeliverAmount)} from ${tx.tx_json.Account}`
    }
  }
  return summary
}

function groupBy(arr, key, groupField = 'txs') {
  const grouped = arr.reduce((acc, item) => {
    const keyValue = item[key]
    const { [key]: _, ...rest } = item
    if (!acc[keyValue]) {
      acc[keyValue] = []
    }
    acc[keyValue].push(rest)
    return acc
  }, {})

  return Object.entries(grouped).map(([keyValue, group]) => ({
    [key]: keyValue,
    [groupField]: group
  }))
}

// ripple
function signMessage(msg, sk) {
  let msgHexStr = Str2Hex(msg)
  let sig = rippleKeyPairs.sign(msgHexStr, sk)
  return sig
}

function signJson(json, seed) {
  let keypairs = rippleKeyPairs.deriveKeypair(seed)
  json.PublicKey = keypairs.publicKey
  json.Timestamp = Date.now()
  let sig = signMessage(JSON.stringify(json), keypairs.privateKey)
  json.Signature = sig
  return json
}

function verifySignature(msg, sig, pk) {
  let hexStrMsg = Str2Hex(msg)
  try {
    return rippleKeyPairs.verify(hexStrMsg, sig, pk)
  } catch (e) {
    return false
  }
}

function verifyJson(json) {
  let sig = json["Signature"]
  delete json["Signature"]
  let tmpMsg = JSON.stringify(json)
  if (verifySignature(tmpMsg, sig, json.PublicKey)) {
    let address = rippleKeyPairs.deriveAddress(json.PublicKey)
    return address
  } else {
    console.log('signature invalid...')
    return false
  }
}

function formatMemo(payload) {
  let memo_data = convertStringToHex(payload)
  let memo_format = convertStringToHex('text/plain')
  try {
    let tmp = JSON.parse(payload)
    if (typeof tmp === 'object') {
      memo_data = convertStringToHex(payload)
      memo_format = convertStringToHex('application/json')
    }
  } catch (error) {
    console.log(error)
  }
  let memos = [
    {
      Memo: {
        // MemoType: convertStringToHex('not use'),
        MemoData: memo_data,
        MemoFormat: memo_format
      }
    }
  ]
  return memos
}

function Asset2Coin(asset) {
  if (typeof asset === 'string') {
    return DefaultCoinCode
  } else {
    return {
      currency: asset.currency,
      issuer: asset.issuer
    }
  }
}

function CoinStr2Coin(coin_str) {
  if (coin_str === DefaultCoinCode) {
    return coin_str
  } else {
    const [currency, issuer] = coin_str.split('.')
    return {
      currency: currency,
      issuer: issuer
    }
  }
}

function CompareCoin(coin_a, coin_b) {
  if (coin_a === DefaultCoinCode && coin_b === DefaultCoinCode) {
    return true
  } else if (coin_a === DefaultCoinCode && coin_b !== DefaultCoinCode) {
    return false
  } else if (coin_a !== DefaultCoinCode && coin_b === DefaultCoinCode) {
    return false
  } else if (coin_a.currency === coin_b.currency && coin_a.issuer === coin_b.issuer) {
    return true
  } else {
    return false
  }
}

function getWallet(seed, server_url) {
  if (server_url === TestNetURL) {
    return Wallet.fromSeed(seed)
  } else {
    return Wallet.fromSeed(seed, { algorithm: ECDSA.secp256k1 })
  }
}

// math
function fixedDecimals(num, length) {
  const numStr = num.toString();

  if (!numStr.includes('.')) {
    return numStr
  }

  const [integerPart, decimalPart] = numStr.split('.')
  const truncatedDecimal = decimalPart.substring(0, length)
  return `${integerPart}.${truncatedDecimal}`
}

export function preciseMultiply(a, b) {
  const decA = new Decimal(a)
  const decB = new Decimal(b)

  const result = decA.times(decB)
  return result
}

export function preciseDivide(dividend, divisor, length) {
  const decDividend = new Decimal(dividend)
  const decDivisor = new Decimal(divisor)

  const result = decDividend.dividedBy(decDivisor)
  return fixedDecimals(result, length)
}

export {
  Drop2FloorXRP,
  URL4LedgerIndex,
  URL4TxHash,
  URL4Account,
  URL4LedgerIndexTest,
  URL4TxHashTest,
  URL4AccountTest,
  TxSummary,
  groupBy,
  signJson,
  verifyJson,
  formatMemo,
  Asset2Coin,
  CoinStr2Coin,
  CompareCoin,
  getWallet,
  fixedDecimals
}