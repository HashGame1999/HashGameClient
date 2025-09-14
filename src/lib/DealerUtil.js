import CryptoJS from 'crypto-js'
import { MasterAccount } from './RippleConst'

function genDrawID(hashgame, open_ledger_index) {
  let draw_id = `${hashgame.Name}-${hashgame.CoinCode}@${hashgame.JackpotCodeLength}-v${hashgame.Version}#${open_ledger_index}`
  return draw_id
}

function genTicketCode(tx_hash, payment_amount, ticket_price, jackpot_code_length) {
  let ticket_code_count = Math.floor(payment_amount / ticket_price)
  let ticket_codes = []
  if (ticket_code_count > 0) {
    ticket_codes.push(tx_hash.substring(0, jackpot_code_length))
    let prev_hash = tx_hash
    for (let i = 1; i < ticket_code_count; i++) {
      let current_hash = CryptoJS.SHA512(prev_hash).toString().toUpperCase()
      ticket_codes.push(current_hash.substring(0, jackpot_code_length))
      prev_hash = current_hash
    }
  }
  return ticket_codes
}

function genGameTx(hashgame, game_tx) {
  let tmp = {}
  if (game_tx.meta.TransactionResult === TxResult.Success && game_tx.tx_json.TransactionType === TxType.Payment && game_tx.validated === true && game_tx.ledger_index >= hashgame.OpenLedgerIndex) {
    tmp.ledger_index = game_tx.ledger_index
    tmp.ledger_hash = game_tx.ledger_hash
    tmp.tx_index = game_tx.meta.TransactionIndex
    tmp.tx_type = game_tx.tx_json.TransactionType
    tmp.tx_result = game_tx.meta.TransactionResult
    tmp.tx_sequence = game_tx.tx_json.Sequence
    tmp.tx_hash = game_tx.hash
    tmp.sour = game_tx.tx_json.Account
    tmp.dest = game_tx.tx_json.Destination
    tmp.delivered_amount = game_tx.meta.delivered_amount
    tmp.fee = game_tx.tx_json.Fee
    if (game_tx.tx_json.Destination === hashgame.GameAccount) {
      let [ticket_code_count, ticket_codes] = genTicketCode(tmp.tx_hash, tmp.delivered_amount, hashgame.TicketPrice, hashgame.JackpotCodeLength)
      tmp.ticket_code_count = ticket_code_count
      tmp.ticket_codes = ticket_codes
    }
    tmp.close_time_iso = game_tx.close_time_iso
    let tmp_memos = []
    if (game_tx.tx_json.Memos) {
      let memo_length = game_tx.tx_json.Memos.length
      for (let i = 0; i < memo_length; i++) {
        const memo = game_tx.tx_json.Memos[i].Memo
        let tmp_memo = {}
        for (const key in memo) {
          tmp_memo[key] = convertHexToString(memo[key])
        }
        tmp_memos.push(tmp_memo)
      }
      tmp.memos = tmp_memos
      // breakdown
      tmp.is_breakdown = false
      tmp.breakdowns = []
      tmp.is_paid = false
      // tmp.pay_tx_hash = ''
      // tmp.pay_amount = 0
      // tmp.pay_fee_in_drop = 0
    }
    // console.log(tmp)
    return tmp
  }
}

function genGameType(game) {
  return `${game.Name}-${game.CoinCode}@${game.JackpotCodeLength}-v${game.Version}`
}

function genGameTitle(game) {
  return `${game.Name}-${game.CoinCode}@${game.JackpotCodeLength}-v${game.Version}#${game.Index}`
}

function genDBName(game) {
  let db_path = `${game.Name}-${game.CoinCode}@${game.JackpotCodeLength}-v${game.Version}#${game.OpenLedgerIndex}`
  return db_path
}

function genRefSourceTag(address) {
  let hash = CryptoJS.SHA512(`${address}@${MasterAccount}`).toString().toUpperCase()
  hash = hash.substring(0, 8)
  let source_tag = parseInt(hash, 16)
  return source_tag
}

function genReferralNumber(address) {
  let ref_number = genRefSourceTag(address)
  return ref_number
}

export {
  genDrawID,
  genTicketCode,
  genGameTx,
  genGameType,
  genGameTitle,
  genDBName,
  genReferralNumber
}