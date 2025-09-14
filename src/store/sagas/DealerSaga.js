import CryptoJS from 'crypto-js'
import Dexie from 'dexie'
import { call, put, takeLatest, select, takeEvery } from 'redux-saga/effects'
import { convertHexToString, dropsToXrp } from 'xrpl'
import { LoadPortalStart, LoadPortalSuccess, LoadDrawListStart, LoadDrawListSuccess, LoadDrawStart, LoadDrawSuccess, loadArchiveStart, loadArchiveSuccess, loadTicketsStart, loadTicketsSuccess, loadGameSettingStart, loadGameSettingListStart, loadGameSettingSuccess, loadGameSettingListSuccess } from '../slices/DealerSlice'
import { fetchAccountTxs } from './RippleSaga'
import { genGameTitle, genGameType, genDBName, genTicketCode, genDrawID } from '../../lib/DealerUtil'
import { TxResult, TxType, SettingAccount } from '../../lib/RippleConst'
import { GetTicketTxs } from './CounterSaga'
import { calcRate, safeAddItem } from '../../lib/AppUtil'
import { setDisplayJson } from '../slices/UserSlice'
import { CommonDBSchame } from '../../lib/AppConst'

let CommonDB = null

function initCommonDB() {
  CommonDB = new Dexie('Common')
  CommonDB.version(1).stores(CommonDBSchame)
}

function* fetchGameSetting() {
  let txs = yield call(fetchAccountTxs, { account: SettingAccount })
  for (let i = 0; i < txs.length; i++) {
    const tx = txs[i]
    if (tx.tx_json.Account === SettingAccount && tx.tx_json.Memos !== undefined && tx.tx_json.Memos.length > 0 && tx.tx_json.Memos[0].Memo.MemoData !== undefined) {
      const setting_string = convertHexToString(tx.tx_json.Memos[0].Memo.MemoData)
      if (setting_string !== '') {
        try {
          let setting_json = JSON.parse(setting_string)
          let result = yield call(() => safeAddItem(CommonDB, 'GameSettings', 'OpenLedgerIndex', setting_json))
          // console.log(result)
        } catch (error) {
          console.log(error)
          yield put(setGameError(`Setting should be a json...`))
        }
      }
    }
  }
  yield call(handleLoadGameSettingList)
}

function* handleLoadGameSettingList() {
  if (CommonDB === null) {
    yield call(initCommonDB)
  }

  let setting_list = yield call(() => CommonDB.GameSettings
    .orderBy('OpenLedgerIndex')
    .reverse()
    .toArray())
  yield put(loadGameSettingListSuccess({ setting_list: setting_list }))
}

function* handleLoadGameSetting() {
  if (CommonDB === null) {
    yield call(initCommonDB)
  }

  let game_setting = localStorage.getItem(`GameSetting`)
  if (game_setting === null) {
    game_setting = yield call(() => CommonDB.GameSettings
      .orderBy('OpenLedgerIndex')
      .reverse()
      .limit(1)
      .first())
    if (game_setting !== undefined) {
      localStorage.setItem(`GameSetting`, JSON.stringify(game_setting))
    } else {
      yield call(fetchGameSetting)
    }
  } else {
    game_setting = JSON.parse(game_setting)
  }

  if (game_setting !== null && game_setting !== undefined) {
    yield put(loadGameSettingSuccess({
      game_setting: game_setting,
      game_title: genGameTitle(game_setting),
      game_type: genGameType(game_setting),
      db_name: genDBName(game_setting)
    }))
  }
}

function* handleUseGameSetting(action) {
  let open_ledger_index = action.payload.open_ledger_index
  const setting = yield call(() => CommonDB.GameSettings
    .where(`OpenLedgerIndex`).equals(open_ledger_index)
    .limit(1)
    .first())
  localStorage.setItem(`GameSetting`, JSON.stringify(setting))
  yield put(loadGameSettingSuccess({
    game_setting: setting,
    game_title: genGameTitle(setting),
    game_type: genGameType(setting),
    db_name: genDBName(setting)
  }))
}

// Draw
let draw_db = null
function initDrawDB(db_name) {
  draw_db = new Dexie(db_name)
  draw_db.version(1).stores({
    Draws: `OpenLedgerIndex&, CloseLedgerIndex&, DrawID&, InitPool, Income, OperatingFee, CodeCount, JackpotCode, JackpotCount, JackpotAmount, AmountTotal, PayAmount, ResidualPool, PayTxLedgerIndex, PayTxLedgerHash&, PayTxIndex, PayTxHash&, BreakdownCount, BreakdownPaidCount, PaidRate, close_time_iso`,
    Breakdowns: `TicketTxHash&, Account, PayTxLedgerIndex, PayTxLedgerHash, PayTxIndex, PayTxHash&, DrawID, AmountTotal, JackpotTotal, JackpotCount, PrizeTotal, PrizeCount, close_time_iso`
  })
}

function getAllDatabaseNames() {
  return new Promise((resolve) => {
    const req = indexedDB.databases ? indexedDB.databases() : Promise.resolve([])
    req.then(dbs => {
      const dbNames = dbs.map(db => db.name)
      resolve(dbNames)
    }).catch(() => {
      resolve([])
    })
  })
}

export function* NewLedgerClosed(action) {
  let latest_ledger_index = action.ledger_index

  yield call(LoadPortal)
  yield call(checkDrawHistroy)
  yield call(checkBreakdownHistroy)
}

function* checkDrawHistroy() {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  const latest_ledger = yield select(state => state.Ripple.latestLedger)
  if (latest_ledger !== null && latest_ledger.ledger_index % 10 === 0) {
    let draw_size = Math.floor((latest_ledger.ledger_index - game_setting.OpenLedgerIndex) / game_setting.DrawLedgerInterval)
    if (draw_size > (game_setting.CloseLedgerIndex + 1 - game_setting.OpenLedgerIndex) / game_setting.DrawLedgerInterval) {
      draw_size = (game_setting.CloseLedgerIndex + 1 - game_setting.OpenLedgerIndex) / game_setting.DrawLedgerInterval
    }
    let draws = yield call(() => draw_db.Draws
      .orderBy('OpenLedgerIndex')
      .filter(d => d.OpenLedgerIndex >= game_setting.OpenLedgerIndex && d.CloseLedgerIndex <= game_setting.CloseLedgerIndex)
      .toArray())
    let draw_count = draws.length
    if (draw_size > draw_count) {
      const close_ledger_indexs = draws.map(draw => draw.CloseLedgerIndex)
      let missing_draw_close_ledger_index = game_setting.OpenLedgerIndex
      for (let i = 0; i < draw_size; i++) {
        let close_ledger_index = game_setting.OpenLedgerIndex + (i + 1) * game_setting.DrawLedgerInterval - 1
        if (!close_ledger_indexs.includes(close_ledger_index)) {
          missing_draw_close_ledger_index = close_ledger_index
          break
        }
      }

      let pool_txs = yield call(fetchAccountTxs, { account: game_setting.PoolAccount, ledger_index_min: missing_draw_close_ledger_index + 1 })
      for (let i = 0; i < pool_txs.length; i++) {
        const tx = pool_txs[i]
        try {
          if (tx.validated === true && tx.meta.TransactionResult === TxResult.Success && tx.tx_json.TransactionType === TxType.Payment && tx.tx_json.Destination === game_setting.SendAccount && tx.tx_json.Account === game_setting.PoolAccount && tx.tx_json.Memos.length > 0) {
            const pay_memo_json = JSON.parse(convertHexToString(tx.tx_json.Memos[0].Memo.MemoData))
            let paid_rate = calcRate(pay_memo_json.AmountTotal, pay_memo_json.Income)
            let new_draw = { ...pay_memo_json, PayTxLedgerIndex: tx.ledger_index, PayTxLedgerHash: tx.ledger_hash, PayTxIndex: tx.meta.TransactionIndex, PayTxHash: tx.hash, close_time_iso: tx.close_time_iso, BreakdownPaidCount: 0, PaidRate: paid_rate }
            yield call(() => safeAddItem(draw_db, 'Draws', 'OpenLedgerIndex', new_draw))
          }
        } catch (error) {
          console.log(error)
          console.log(tx)
        }
      }
    }
  }
}

function* checkBreakdownHistroy() {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  const latest_ledger = yield select(state => state.Ripple.latestLedger)
  if (latest_ledger !== null && latest_ledger.ledger_index % 10 === 0) {
    let draw = yield call(() => draw_db.Draws
      .where("BreakdownCount")
      .above(0)
      .filter(d => d.BreakdownCount != d.BreakdownPaidCount && d.OpenLedgerIndex >= game_setting.OpenLedgerIndex && d.CloseLedgerIndex <= game_setting.CloseLedgerIndex)
      .limit(1)
      .first())
    if (draw !== undefined) {
      let breakdown_txs = yield call(fetchAccountTxs, { account: game_setting.SendAccount, ledger_index_min: draw.CloseLedgerIndex })
      for (let i = 0; i < breakdown_txs.length; i++) {
        const tx = breakdown_txs[i]
        if (tx.validated === true && tx.meta.TransactionResult === TxResult.Success && tx.tx_json.TransactionType === TxType.Payment && tx.tx_json.Account === game_setting.SendAccount && tx.tx_json.Memos !== undefined && tx.tx_json.Memos.length > 0) {
          const pay_memo_json = JSON.parse(convertHexToString(tx.tx_json.Memos[0].Memo.MemoData))
          let breakdown = { ...pay_memo_json, Account: tx.tx_json.Destination, PayTxLedgerIndex: tx.ledger_index, PayTxLedgerHash: tx.ledger_hash, PayTxIndex: tx.meta.TransactionIndex, PayTxHash: tx.hash, close_time_iso: tx.close_time_iso }
          let result = yield call(() => safeAddItem(draw_db, 'Breakdowns', 'TicketTxHash', breakdown))
        }
      }

      // update all draw's BreakdownPaidCount
      let draws = yield call(() => draw_db.Draws
        .orderBy('OpenLedgerIndex')
        .filter(d => d.BreakdownCount != d.BreakdownPaidCount && d.OpenLedgerIndex >= game_setting.OpenLedgerIndex && d.CloseLedgerIndex <= game_setting.CloseLedgerIndex)
        .toArray())
      for (let i = 0; i < draws.length; i++) {
        const tmp = draws[i]
        let breakdowns = yield call(() => draw_db.Breakdowns
          .where("DrawID")
          .equals(tmp.DrawID)
          .toArray())
        let updatedCount = yield call(() => draw_db.Draws
          .where("DrawID")
          .equals(tmp.DrawID)
          .modify(tmp => {
            tmp.BreakdownPaidCount = breakdowns.length
          }))
      }
    }
  }
}

export function* SavePoolPayment(payload) {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  const tx = payload.tx
  if (tx.validated === true && tx.meta.TransactionResult === TxResult.Success && tx.tx_json.TransactionType === TxType.Payment && tx.tx_json.Destination === game_setting.SendAccount && tx.tx_json.Account === game_setting.PoolAccount && tx.tx_json.Memos.length > 0) {
    const pay_memo_json = JSON.parse(convertHexToString(tx.tx_json.Memos[0].Memo.MemoData))
    let paid_rate = calcRate(pay_memo_json.AmountTotal, pay_memo_json.Income)
    let draw = { ...pay_memo_json, PayTxLedgerIndex: tx.ledger_index, PayTxLedgerHash: tx.ledger_hash, PayTxIndex: tx.meta.TransactionIndex, PayTxHash: tx.hash, close_time_iso: tx.close_time_iso, BreakdownPaidCount: 0, PaidRate: paid_rate }
    yield call(() => safeAddItem(draw_db, 'Draws', 'OpenLedgerIndex', draw))
    yield call(LoadPortal)
  }
}

export function* SaveBreakdownPayment(payload) {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  const tx = payload.tx
  if (tx.validated === true && tx.meta.TransactionResult === TxResult.Success && tx.tx_json.TransactionType === TxType.Payment && tx.tx_json.Account === game_setting.SendAccount && tx.tx_json.Memos.length > 0) {
    const pay_memo_json = JSON.parse(convertHexToString(tx.tx_json.Memos[0].Memo.MemoData))
    let breakdown = { ...pay_memo_json, Account: tx.tx_json.Destination, PayTxLedgerIndex: tx.ledger_index, PayTxLedgerHash: tx.ledger_hash, PayTxIndex: tx.meta.TransactionIndex, PayTxHash: tx.hash, close_time_iso: tx.close_time_iso }
    yield call(() => safeAddItem(draw_db, 'Breakdowns', 'TicketTxHash', breakdown))
  }
}

function* LoadDrawList() {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  let draws = yield call(() => draw_db.Draws
    .orderBy('OpenLedgerIndex')
    .filter(d => d.OpenLedgerIndex >= game_setting.OpenLedgerIndex && d.CloseLedgerIndex <= game_setting.CloseLedgerIndex)
    .reverse()
    .toArray())
  yield put(LoadDrawListSuccess({ draws: draws }))
}

function* LoadDraw(action) {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  const open_ledger_index = parseInt(action.payload)
  let draw = yield call(() => draw_db.Draws
    .where("OpenLedgerIndex")
    .equals(open_ledger_index)
    .filter(d => d.OpenLedgerIndex >= game_setting.OpenLedgerIndex && d.CloseLedgerIndex <= game_setting.CloseLedgerIndex)
    .limit(1)
    .first())
  if (draw !== undefined) {
    let breakdowns = yield call(() => draw_db.Breakdowns
      .where("DrawID")
      .equals(draw.DrawID)
      .toArray())
    draw.Breakdowns = breakdowns
    yield put(LoadDrawSuccess({ draw: draw }))
  }
}

function* LoadDrawResult({ payload }) {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  const open_ledger_index = parseInt(payload.open_ledger_index)

  // gen result start
  let draw_id = genDrawID(game_setting, open_ledger_index)
  let close_ledger_index = open_ledger_index + game_setting.DrawLedgerInterval - 1
  let game_txs = yield call(fetchAccountTxs, { account: game_setting.GameAccount, ledger_index_min: open_ledger_index, ledger_index_max: close_ledger_index })
  game_txs = game_txs.filter(tx => tx.tx_json.Destination === game_setting.GameAccount && tx.tx_json.TransactionType === TxType.Payment && tx.meta.TransactionResult === TxResult.Success && dropsToXrp(tx.meta.delivered_amount) > 1)
  game_txs = game_txs.reverse()

  // count: tickets, ticket_codes, income
  let tickets = []
  let ticket_codes = []
  for (let i = 0; i < game_txs.length; i++) {
    const tx = game_txs[i]
    tx.Amount = dropsToXrp(tx.meta.delivered_amount)
    let codes = genTicketCode(tx.hash, tx.Amount, game_setting.CodePrice, game_setting.JackpotCodeLength)
    tickets.push({
      Address: tx.tx_json.Account,
      LedgerIndex: tx.ledger_index,
      TxIndex: tx.meta.TransactionIndex,
      TxHash: tx.hash,
      DeliveredAmount: tx.Amount,
      CodeCount: parseInt(tx.Amount),
      Codes: codes
    })
    ticket_codes = ticket_codes.concat(codes)
  }

  // // gen jackpot code
  let strDrawCodes = `${draw_id}:${ticket_codes.join(',')}`
  let hashDrawCodes = CryptoJS.SHA512(strDrawCodes).toString().toUpperCase()
  let jackpot_code = hashDrawCodes.substring(0, game_setting.JackpotCodeLength)

  // breakdown: prize, jackpot
  let prize_count = 0
  let prize_total = 0
  let prize_breakdown = {}
  for (let i = 1; i <= game_setting.PrizeCodeLength.length; i++) {
    prize_breakdown[`Rank#${i}`] = []
  }

  let jackpot_breakdown = []
  let pay_memos = []

  for (let i = 0; i < tickets.length; i++) {
    const ticket = tickets[i]
    let pay_memo_json = {
      Address: ticket.Address,
      LedgerIndex: ticket.LedgerIndex,
      TxIndex: ticket.TxIndex,
      TxHash: ticket.TxHash,
      JackpotCount: 0,
      JackpotBreakdown: [],
      PrizeCount: 0,
      PrizeTotal: 0,
      PrizeBreakdown: {}
    }

    for (let j = 0; j < ticket.CodeCount; j++) {
      const code = ticket.Codes[j]
      let match_count = 0
      for (let k = 1; k <= game_setting.JackpotCodeLength; k++) {
        if (code.substring(0, k) == jackpot_code.substring(0, k)) {
          match_count = match_count + 1
        } else {
          break
        }
      }
      if (match_count === game_setting.JackpotCodeLength) {
        jackpot_breakdown.push({
          Address: ticket.Address,
          TxHash: ticket.TxHash,
          CodeIndex: j
        })

        pay_memo_json.JackpotBreakdown.push({
          CodeIndex: j,
          Code: code
        })
        pay_memo_json.JackpotCount = pay_memo_json.JackpotCount + 1
      } else if (match_count >= game_setting.JackpotCodeLength - game_setting.PrizeCodeLength.length) {
        let prize_rank = game_setting.JackpotCodeLength - match_count
        let prize_amount = game_setting.PrizeAmount[game_setting.PrizeCodeLength.length - prize_rank]

        prize_count = prize_count + 1
        prize_total = prize_total + prize_amount
        prize_breakdown[`Rank#${prize_rank}`].push({
          Address: ticket.Address,
          TxHash: ticket.TxHash,
          CodeIndex: j,
          Code: code
        })

        pay_memo_json.PrizeCount = pay_memo_json.PrizeCount + 1
        pay_memo_json.PrizeTotal = pay_memo_json.PrizeTotal + prize_amount
        if (!pay_memo_json.PrizeBreakdown[`Rank#${prize_rank}`]) {
          pay_memo_json.PrizeBreakdown[`Rank#${prize_rank}`] = []
        }
        pay_memo_json.PrizeBreakdown[`Rank#${prize_rank}`].push({
          CodeIndex: j,
          Code: code
        })
      }
    }

    if (pay_memo_json.JackpotCount > 0 || pay_memo_json.PrizeCount > 0) {
      pay_memos.push(pay_memo_json)
    }
  }

  // // gen draw result
  let jackpot_breakdown_length = jackpot_breakdown.length

  let draw_result = {
    GameSetting: game_setting,
    DrawInfo: {
      DrawID: draw_id,
      OpenLedgerIndex: open_ledger_index,
      CloseLedgerIndex: close_ledger_index,
      CodeCount: ticket_codes.length,
      DrawTicketCodes: strDrawCodes,
      JackpotCode: jackpot_code,
      PrizeCount: prize_count,
      PrizeTotal: prize_total,
      JackpotCount: jackpot_breakdown_length,
      BreakdownCount: pay_memos.length
    },
    Tickets: tickets,
    JackpotBreakdown: jackpot_breakdown,
    PrizeBreakdown: prize_breakdown
  }
  yield put(setDisplayJson({ json: draw_result, isExpand: false }))
}

function* LoadPortal() {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  let current_draw = null
  let prev_draw = null
  let recent_jackpot_draw = null
  let biggest_jackpot_draw = null

  let draws = yield call(() => draw_db.Draws
    .orderBy('OpenLedgerIndex')
    .filter(d => d.OpenLedgerIndex >= game_setting.OpenLedgerIndex && d.CloseLedgerIndex <= game_setting.CloseLedgerIndex)
    .reverse()
    .toArray())
  let draw_count = draws.length
  let total_income = draws.reduce((acc, draw) => acc + draw.Income, 0)
  let total_jackpot_count = draws.reduce((acc, draw) => acc + draw.JackpotCount, 0)
  let total_amount_total = draws.reduce((acc, draw) => acc + draw.AmountTotal, 0)

  if (draw_count > 0) {
    prev_draw = draws[0]
    let EstimatedJackpotAmount = Math.floor(game_setting.VirtualPool * game_setting.JackpotProportion)
    if (prev_draw.ResidualPool > game_setting.VirtualPool) {
      EstimatedJackpotAmount = Math.floor(prev_draw.ResidualPool * game_setting.JackpotProportion)
    }
    if (prev_draw.CloseLedgerIndex < game_setting.CloseLedgerIndex) {
      current_draw = {
        OpenLedgerIndex: prev_draw.OpenLedgerIndex + game_setting.DrawLedgerInterval,
        CloseLedgerIndex: prev_draw.CloseLedgerIndex + game_setting.DrawLedgerInterval,
        InitPool: prev_draw.ResidualPool,
        EstimatedJackpotAmount: EstimatedJackpotAmount
      }
    }
    recent_jackpot_draw = draws.find(draw => draw.JackpotCount > 0)
    let jackpot_draws = draws.filter(d => d.JackpotCount > 0)
    if (jackpot_draws.length > 0) {
      biggest_jackpot_draw = jackpot_draws.reduce((max, current) =>
        current.JackpotAmount > max.JackpotAmount ? current : max
      )
    }
  }
  let paid_rate = Math.round(total_amount_total / total_income * 10000) / 100
  if (Number.isNaN(paid_rate)) {
    paid_rate = 100
  }

  yield put(LoadPortalSuccess({
    draw_count: draw_count,
    total_jackpot_count: total_jackpot_count,
    total_amount_total: total_amount_total,
    paid_rate: paid_rate,
    prev_draw: prev_draw,
    current_draw: current_draw,
    recent_jackpot_draw: recent_jackpot_draw,
    biggest_jackpot_draw: biggest_jackpot_draw
  }))
}

export function* LoadTickets() {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  let current_draw_open_index = game_setting.OpenLedgerIndex
  let prev_draw = yield call(() => draw_db.Draws
    .orderBy('OpenLedgerIndex')
    .reverse()
    .limit(1)
    .first())

  if (prev_draw) {
    current_draw_open_index = prev_draw.OpenLedgerIndex + game_setting.DrawLedgerInterval
  }

  let txs = yield call(GetTicketTxs, { GameAccount: game_setting.GameAccount, from_ledger_index: current_draw_open_index })
  if (txs !== undefined) {
    let tickets = txs.map((tx) => ({ Codes: genTicketCode(tx.json.hash, dropsToXrp(tx.json.meta.delivered_amount), game_setting.CodePrice, game_setting.JackpotCodeLength) }))
    yield put(loadTicketsSuccess({ tickets: tickets }))
  }
}

function* LoadArchive() {
  const game_setting = yield select(state => state.Dealer.GameSetting)
  if (!game_setting) {
    return
  }
  if (draw_db === null) {
    const db_name = yield select(state => state.Dealer.GameDB)
    yield call(initDrawDB, db_name)
  }

  let txs = yield call(GetTicketTxs, { GameAccount: game_setting.GameAccount })

  let draws = yield call(() => draw_db.Draws
    .orderBy('OpenLedgerIndex')
    .filter(d => d.OpenLedgerIndex >= game_setting.OpenLedgerIndex && d.CloseLedgerIndex <= game_setting.CloseLedgerIndex)
    .reverse()
    .toArray())
  let played_draws = []
  for (let i = 0; i < draws.length; i++) {
    const draw = draws[i]
    let tickets = []
    for (let j = 0; j < txs.length; j++) {
      const tx = txs[j].json
      if (tx.ledger_index >= draw.OpenLedgerIndex && tx.ledger_index <= draw.CloseLedgerIndex) {
        let tmp = {
          TxHash: tx.hash,
          Codes: genTicketCode(tx.hash, dropsToXrp(tx.meta.delivered_amount), game_setting.CodePrice, game_setting.JackpotCodeLength)
        }
        tickets.push(tmp)
      }
    }
    if (tickets.length > 0) {
      draw.Tickets = tickets
      played_draws.push(draw)
    }
  }

  yield put(loadArchiveSuccess({ archive: played_draws }))
}

export function* watchDealer() {
  // Game
  yield takeLatest(loadGameSettingStart.type, handleLoadGameSetting)
  yield takeLatest(loadGameSettingListStart.type, handleLoadGameSettingList)
  yield takeLatest('UseGameSetting', handleUseGameSetting)
  yield takeLatest('FetchGameSetting', fetchGameSetting)

  // Draw
  yield takeLatest(LoadPortalStart.type, LoadPortal)
  yield takeLatest(LoadDrawListStart.type, LoadDrawList)
  yield takeEvery(LoadDrawStart.type, LoadDraw)
  yield takeEvery('LoadDrawResult', LoadDrawResult)
  yield takeLatest(loadTicketsStart.type, LoadTickets)
  yield takeLatest(loadArchiveStart.type, LoadArchive)
}
