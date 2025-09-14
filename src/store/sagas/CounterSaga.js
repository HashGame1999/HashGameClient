import Dexie from 'dexie'
import { call, put, takeLatest, select, delay } from 'redux-saga/effects'
import { updateWalletInfo, updateTrustLineList, loadHistroyTxsStart, loadHistroyTxsSuccess, loadIssuerCurrencyListStart, loadIssuerCurrencyListSuccess, submitActionStart, submitActionSuccess, loadSendCurrencyListStart, loadSendCurrencyListSuccess, updateOfferList, loadConvertPathStart, loadConvertPathSuccess, resetWallet } from '../slices/CounterSlice'
import { fetchAccountInfo, fetchAccountLines, fetchAccountTxs, fetchIssuerCurrencyList, submitTrustSet, submitPayment, submitOfferCreate, fetchAccountOffers, submitOfferCancel, fetchOfferBook, submitAccountDelete, fetchConvertPath, submitPathPayment, submitPlayPayment } from './RippleSaga'
import { formatMemo } from '../../lib/RippleUtil'
import { DefaultCoinCode, DefaultCoinIssuer, PaySubAction, TxResult, TxType } from '../../lib/RippleConst'
import { convertHexToString } from 'xrpl'
import { safeAddItem } from '../../lib/AppUtil'

let db = null

function initDB(db_name) {
  db = new Dexie(db_name)
  db.version(1).stores({
    Txs: `Hash&, LedgerIndex, Sequence, TxIndex, TxType, TxResult, Fee, TxDate, SourAccount, DestAccount, Issuer, Currency, DeliveredAmount, Memo, close_time_iso, json, [LedgerIndex+TxIndex], [SourAccount+DestAccount]`,
  })
}

// Wallet
export function* fetchWalletInfo() {
  const address = yield select(state => state.User.Address)
  let result = yield call(fetchAccountInfo, { address: address })
  yield put(updateWalletInfo(result))
}

export function* fetchTrustLineList() {
  const address = yield select(state => state.User.Address)
  let result = yield call(fetchAccountLines, { address: address })
  if (result.error === null) {
    // result = result.lines.filter(l => !(parseInt(l.balance) === 0 && parseInt(l.limit) === 0))
  }
  yield put(updateTrustLineList(result))
}

export function* fetchOfferList() {
  const address = yield select(state => state.User.Address)
  let result = yield call(fetchAccountOffers, { address: address })
  yield put(updateOfferList(result))
}

export function* fetchTxHistroy() {
  const address = yield select(state => state.User.Address)
  if (address) {
    if (db === null) {
      yield call(initDB, address)
    }

    const last_tx = yield call(() => db.Txs
      .orderBy('[LedgerIndex+TxIndex]')
      .reverse()
      .limit(1)
      .first())

    let txs = []
    if (last_tx === undefined) {
      txs = yield call(fetchAccountTxs, { account: address })
    } else {
      txs = yield call(fetchAccountTxs, { account: address, ledger_index_min: last_tx.LedgerIndex + 1 })
    }

    let insert_count = 0
    for (let i = 0; i < txs.length; i++) {
      const tx = txs[i]
      let tmp_tx = {
        Hash: tx.hash,
        LedgerIndex: tx.ledger_index,
        Sequence: tx.tx_json.Sequence,
        TxIndex: tx.meta.TransactionIndex,
        TxType: tx.tx_json.TransactionType,
        TxResult: tx.meta.TransactionResult,
        Fee: tx.tx_json.Fee,
        TxDate: tx.tx_json.date,
        close_time_iso: tx.close_time_iso,
        json: tx
      }
      if (tmp_tx.TxType === TxType.Payment && tmp_tx.TxResult === TxResult.Success) {
        tmp_tx.SourAccount = tx.tx_json.Account
        tmp_tx.DestAccount = tx.tx_json.Destination
        if (tx.meta.delivered_amount === "unavailable") {
          // old tx
          tmp_tx.DeliveredAmount = tx.tx_json.DeliverMax
          tmp_tx.Issuer = DefaultCoinIssuer
          tmp_tx.Currency = DefaultCoinCode
        } else if (typeof tx.meta.delivered_amount !== 'string') {
          tmp_tx.DeliveredAmount = tx.meta.delivered_amount.value
          tmp_tx.Issuer = tx.meta.delivered_amount.issuer
          tmp_tx.Currency = tx.meta.delivered_amount.currency
          if (tmp_tx.Currency.length > 3) {
            tmp_tx.Currency = tmp_tx.Currency.replace(/(00)+$/, '')
            tmp_tx.Currency = convertHexToString(tmp_tx.Currency)
          }
        } else {
          tmp_tx.DeliveredAmount = tx.meta.delivered_amount
          tmp_tx.Issuer = DefaultCoinIssuer
          tmp_tx.Currency = DefaultCoinCode
        }
        if (tx.tx_json.Memos !== undefined && tx.tx_json.Memos.length > 0 && tx.tx_json.Memos[0].Memo.MemoData !== undefined) {
          tmp_tx.Memo = convertHexToString(tx.tx_json.Memos[0].Memo.MemoData)
        }
      }
      let result = yield call(() => safeAddItem(db, 'Txs', 'Hash', tmp_tx))
      if (result) {
        insert_count += 1
      }
    }
    yield call(LoadHistroyTxs)
  }
}

export function* clearWallet() {
  db = null
  yield put(resetWallet())
}

function* LoadHistroyTxs() {
  const address = yield select(state => state.User.Address)
  if (address) {
    if (db === null) {
      yield call(initDB, address)
    }
    let txs = yield call(() => db.Txs
      .orderBy('[LedgerIndex+TxIndex]')
      .reverse()
      .toArray())
    yield put(loadHistroyTxsSuccess({ txs: txs }))
  }
}

function* LoadIssuerCurrencyList({ payload }) {
  const { issuer } = payload
  let result = yield call(fetchIssuerCurrencyList, { issuer: issuer })
  yield put(loadIssuerCurrencyListSuccess(result))
}

function* LoadSendCurrencyList({ payload }) {
  const { dest_account } = payload
  let result = yield call(fetchAccountLines, { address: dest_account })
  yield put(loadSendCurrencyListSuccess(result))
}

function* LoadConvertPath({ payload }) {
  const address = yield select(state => state.User.Address)
  if (address) {
    if (db === null) {
      yield call(initDB, address)
    }
    const { get, paths } = payload
    let result = yield call(fetchConvertPath, { address: address, destination_amount: get, paths: paths })
    console.log(result)
    yield put(loadConvertPathSuccess(result))
  }
}

function* Submit({ payload }) {
  const seed = yield select(state => state.User.Seed)
  const address = yield select(state => state.User.Address)
  console.log(payload)
  let response = null
  switch (payload.action) {
    case TxType.Payment:
      if (payload.sub_aciton === PaySubAction.Normal) {
        let tmp_payload = {
          seed: seed,
          sour: address,
          dest: payload.dest_account,
          issuer: payload.issuer,
          currency: payload.currency,
          amount: payload.amount,
          sour_tag: payload.sour_tag,
          dest_tag: payload.dest_tag
        }
        if (payload.memo.trim() !== '') {
          tmp_payload.memos = formatMemo(payload.memo.trim())
        }
        response = yield call(submitPayment, tmp_payload)
        if (response.result === TxResult.Success) {
          yield call(fetchWalletInfo)
          yield call(fetchTrustLineList)
        }
        yield put(submitActionSuccess({ error: response.error, result: response.result }))
      } else if (payload.sub_aciton === PaySubAction.Path) {
        let tmp_payload = {
          seed: seed,
          address: address,
          destination_amount: payload.destination_amount,
          alt: payload.alt
        }
        response = yield call(submitPathPayment, tmp_payload)
        if (response.result === TxResult.Success) {
          yield call(fetchWalletInfo)
          yield call(fetchTrustLineList)
        }
        yield put(submitActionSuccess({ error: response.error, result: response.result }))
      } else if (payload.sub_aciton === PaySubAction.Play) {
        // Game
        let tmp_payload = {
          seed: seed,
          sour: address,
          dest: payload.dest_account,
          amount: payload.amount,
          sour_tag: payload.sour_tag
        }
        response = yield call(submitPlayPayment, tmp_payload)
        yield put(submitActionSuccess({ error: response.error, result: response.result }))
      }
      break
    case TxType.OfferCreate:
      response = yield call(submitOfferCreate, {
        seed: seed,
        address: address,
        TakerPays: payload.TakerPays,
        TakerGets: payload.TakerGets
      })
      if (response.result === TxResult.Success) {
        yield call(fetchOfferBook)
        yield call(fetchWalletInfo)
        yield call(fetchTrustLineList)
      }
      yield put(submitActionSuccess({ error: response.error, result: response.result }))
      break
    case TxType.OfferCancel:
      response = yield call(submitOfferCancel, {
        seed: seed,
        address: address,
        offer_sequence: payload.offer_sequence
      })
      if (response.result === TxResult.Success) {
        yield call(fetchOfferBook)
        yield call(fetchWalletInfo)
        yield call(fetchTrustLineList)
      }
      yield put(submitActionSuccess({ error: response.error, result: response.result }))
      break
    case TxType.TrustSet:
      response = yield call(submitTrustSet, {
        seed: seed,
        address: address,
        issuer: payload.issuer,
        currency: payload.currency,
        amount: payload.amount
      })
      if (response.result === TxResult.Success) {
        yield call(fetchTrustLineList)
      }
      yield put(submitActionSuccess({ error: response.error, result: response.result }))
      break
    case TxType.AccountDelete:
      response = yield call(submitAccountDelete, {
        seed: seed,
        address: address,
        dest: payload.dest
      })
      if (response.result === TxResult.Success) {
        yield call(fetchWalletInfo)
      }
      yield put(submitActionSuccess({ error: response.error, result: response.result }))
      break
    default:
      break
  }
}

// Game
export function* GetTicketTxs(payload) {
  const address = yield select(state => state.User.Address)
  if (address) {
    if (db === null) {
      yield call(initDB, address)
    }
    let tickets = yield call(() => db.Txs
      .where('[SourAccount+DestAccount]')
      .between(
        [address, payload.GameAccount],
        [address, payload.GameAccount],
        true,
        true
      )
      .sortBy('[LedgerIndex+TxIndex]'))
    if (payload.from_ledger_index) {
      tickets = tickets.filter(t => t.LedgerIndex > payload.from_ledger_index)
    }
    return tickets
  }
}

export function* watchCounter() {
  yield takeLatest(loadHistroyTxsStart.type, LoadHistroyTxs)
  yield takeLatest(loadIssuerCurrencyListStart.type, LoadIssuerCurrencyList)
  yield takeLatest(loadSendCurrencyListStart.type, LoadSendCurrencyList)
  yield takeLatest(loadConvertPathStart.type, LoadConvertPath)
  yield takeLatest(submitActionStart.type, Submit)
  yield takeLatest('FetchWalletInfo', fetchWalletInfo)
  yield takeLatest('FetchTrustLineList', fetchTrustLineList)
  yield takeLatest('FetchOfferList', fetchOfferList)
  yield takeLatest('FetchTxHistroy', fetchTxHistroy)
  yield takeLatest('ClearWallet', clearWallet)
}